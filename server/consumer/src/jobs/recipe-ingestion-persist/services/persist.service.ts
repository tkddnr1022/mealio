import { Injectable, Logger } from '@nestjs/common';
import { KAFKA_TOPICS } from '@mealio/shared';
import { KafkaProducerService } from 'src/integrations/kafka/kafka-producer.service';
import {
  createRecipeIngestionRunTriggerPayload,
  recipeIngestionRunTriggerKey,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';
import { assertRunScopeAndJobIdMutuallyExclusive } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.scope';
import {
  logIngestion,
  logIngestionError,
  RECIPE_INGESTION_LOG_EVENTS,
  type RecipeIngestionLoggingOptions,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-logger';
import { resolveRecipeIngestionTargetJobs } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.target';
import { transitionIngestionJobStatus } from 'src/jobs/recipe-ingestion/recipe-ingestion-status-transition';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';
import {
  RetrievedDataValidationError,
  validateRetrievedData,
} from '../validators/retrieved-data.validator';
import { RecipeCreationService } from '../domains/recipe-creation.domain';

export class PersistRunIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersistRunIdError';
  }
}

export class PersistJobIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersistJobIdError';
  }
}

export interface PersistOptions extends RecipeIngestionLoggingOptions {
  jobId?: string;
  runId?: string;
  runIdCount?: number;
  force?: boolean;
}

export interface PersistResult {
  persistedCount: number;
  skippedCount: number;
  failedCount: number;
}

export type PersistByJobIdResult =
  | { outcome: 'persisted'; runId?: string }
  | { outcome: 'skipped' };

@Injectable()
export class PersistService {
  private readonly logger = new Logger(PersistService.name);
  private static readonly STAGE = 'persist' as const;

  constructor(
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly recipeCreationService: RecipeCreationService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async persist(options: PersistOptions = {}): Promise<PersistResult> {
    const startedAt = Date.now();
    const logBase = {
      stage: PersistService.STAGE,
      correlationId: options.correlationId,
      runId: options.runId,
      jobId: options.jobId,
    };

    logIngestion(this.logger, 'log', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_STARTED,
      ...logBase,
    });

    assertRunScopeAndJobIdMutuallyExclusive(options);
    if (options.jobId) {
      try {
        const outcome = await this.persistByJobId(
          options.jobId,
          options.correlationId,
          options.force,
        );
        if (outcome.outcome === 'persisted' && outcome.runId) {
          await this.emitEmbedSubmitTrigger({
            runId: outcome.runId,
            fetchedCount: 1,
            correlationId: options.correlationId,
          });
        }
        const result = {
          persistedCount: outcome.outcome === 'persisted' ? 1 : 0,
          skippedCount: outcome.outcome === 'skipped' ? 1 : 0,
          failedCount: 0,
        };
        logIngestion(this.logger, 'log', {
          event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
          durationMs: Date.now() - startedAt,
          ...logBase,
          outcome: outcome.outcome === 'persisted' ? 'success' : 'skipped',
          ...result,
        });
        return result;
      } catch (error) {
        logIngestionError(
          this.logger,
          {
            event: RECIPE_INGESTION_LOG_EVENTS.JOB_FAILED,
            ...logBase,
            jobId: options.jobId,
          },
          error,
        );
        logIngestion(this.logger, 'log', {
          event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
          durationMs: Date.now() - startedAt,
          ...logBase,
          outcome: 'failed',
          persistedCount: 0,
          skippedCount: 0,
          failedCount: 1,
        });
        throw error;
      }
    }

    const candidates = await resolveRecipeIngestionTargetJobs(
      this.jobRepository,
      'parse_retrieved',
      options,
    );
    if (candidates.length === 0) {
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_NO_OP,
        outcome: 'no_op',
        ...logBase,
        message: 'No parse_retrieved jobs',
      });
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
        durationMs: Date.now() - startedAt,
        ...logBase,
        outcome: 'no_op',
        persistedCount: 0,
        skippedCount: 0,
        failedCount: 0,
      });
      return { persistedCount: 0, skippedCount: 0, failedCount: 0 };
    }

    let persistedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const persistedCountByRunId = new Map<string, number>();

    for (const job of candidates) {
      try {
        const outcome = await this.persistByJobId(
          String(job._id),
          options.correlationId,
          options.force,
        );
        if (outcome.outcome === 'persisted') {
          persistedCount++;
          if (outcome.runId) {
            persistedCountByRunId.set(
              outcome.runId,
              (persistedCountByRunId.get(outcome.runId) ?? 0) + 1,
            );
          }
        } else {
          skippedCount++;
        }
      } catch (error) {
        failedCount++;
        logIngestionError(
          this.logger,
          {
            event: RECIPE_INGESTION_LOG_EVENTS.JOB_FAILED,
            ...logBase,
            jobId: String(job._id),
            message: 'Persist failed in batch',
          },
          error,
        );
      }
    }

    for (const [runId, count] of persistedCountByRunId) {
      await this.emitEmbedSubmitTrigger({
        runId,
        fetchedCount: count,
        correlationId: options.correlationId,
      });
    }

    const outcome =
      failedCount > 0
        ? ('failed' as const)
        : persistedCount > 0
          ? ('success' as const)
          : ('skipped' as const);
    logIngestion(this.logger, 'log', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
      durationMs: Date.now() - startedAt,
      ...logBase,
      outcome,
      persistedCount,
      skippedCount,
      failedCount,
      candidateCount: candidates.length,
    });

    return { persistedCount, skippedCount, failedCount };
  }

  async persistByJobId(
    jobId: string,
    correlationId?: string,
    force?: boolean,
  ): Promise<PersistByJobIdResult> {
    const startedAt = Date.now();
    const logBase = {
      stage: PersistService.STAGE,
      correlationId,
      jobId,
    };
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      this.metrics.recordIngestionStage('persist', 'skipped');
      return { outcome: 'skipped' };
    }
    if (!force) {
      if (job.status === 'persisted' || job.status === 'persisting') {
        this.metrics.recordIngestionStage('persist', 'skipped');
        return { outcome: 'skipped' };
      }
      if (job.status !== 'parse_retrieved') {
        this.metrics.recordIngestionStage('persist', 'skipped');
        return { outcome: 'skipped' };
      }
    }

    const persisting = await transitionIngestionJobStatus(this.jobRepository, {
      id: jobId,
      fromStatus: 'parse_retrieved',
      toStatus: 'persisting',
      force,
    });
    if (!persisting) {
      this.metrics.recordIngestionStage('persist', 'skipped');
      return { outcome: 'skipped' };
    }

    try {
      const data = validateRetrievedData(persisting.retrievedData);
      this.metrics.recordParseConfidence(data.parseConfidence);
      const result = await this.recipeCreationService.execute(
        persisting,
        data,
        { correlationId },
      );
      for (const method of result.matchMethods) {
        this.metrics.recordIngredientMatchMethod(method);
      }

      const persisted = await transitionIngestionJobStatus(this.jobRepository, {
        id: jobId,
        fromStatus: 'persisting',
        toStatus: 'persisted',
        updates: {
          persistedAt: new Date(),
          newIngredientIds: result.newIngredientIds,
        },
        force,
      });
      if (!persisted) {
        logIngestion(this.logger, 'warn', {
          event: RECIPE_INGESTION_LOG_EVENTS.JOB_TRANSITION_FAILED,
          ...logBase,
          runId: persisting.runId,
          message:
            'persist succeeded but persisting→persisted transition failed',
        });
      }

      this.metrics.recordIngestionStage('persist', 'success');
      this.metrics.observeIngestionStageLatency(
        'persist',
        Date.now() - startedAt,
      );
      const runId =
        persisted &&
        typeof persisted.runId === 'string' &&
        persisted.runId.length > 0
          ? persisted.runId
          : undefined;
      return { outcome: 'persisted', runId };
    } catch (error) {
      const message =
        error instanceof RetrievedDataValidationError || error instanceof Error
          ? error.message
          : 'Persist failed';
      await this.jobRepository.rollbackPersistingJobWithRetry(jobId, message);
      this.metrics.recordIngestionStage('persist', 'failed');
      this.metrics.observeIngestionStageLatency(
        'persist',
        Date.now() - startedAt,
      );
      throw error;
    }
  }

  private async emitEmbedSubmitTrigger(params: {
    runId: string;
    fetchedCount: number;
    correlationId?: string;
  }): Promise<void> {
    const payload = createRecipeIngestionRunTriggerPayload(params);
    const key = recipeIngestionRunTriggerKey(params.runId);
    try {
      await this.kafkaProducerService.emit(
        KAFKA_TOPICS.RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED,
        payload,
        key,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Persist completed trigger publish failed';
      logIngestion(this.logger, 'warn', {
        event: RECIPE_INGESTION_LOG_EVENTS.TRIGGER_PUBLISH_FAILED,
        stage: PersistService.STAGE,
        correlationId: params.correlationId,
        runId: params.runId,
        topic: KAFKA_TOPICS.RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED,
        message,
      });
    }
  }
}
