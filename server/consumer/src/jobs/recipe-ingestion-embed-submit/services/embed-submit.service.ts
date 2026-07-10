import { Injectable, Logger } from '@nestjs/common';
import {
  MAX_RECIPE_INGESTION_RETRY_COUNT,
  RECIPE_INGESTION_RECIPE_SOURCE,
  type RecipeIngestionJobDocument,
} from '@mealio/shared';
import {
  OpenAIBatchError,
  OpenAIBatchService,
} from 'src/integrations/openai/openai-batch.service';
import {
  logIngestion,
  logIngestionError,
  RECIPE_INGESTION_LOG_EVENTS,
  type RecipeIngestionLoggingOptions,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-logger';
import { resolveRecipeIngestionTargetJobs } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.target';
import {
  findIngestionJobsByIds,
  transitionIngestionJobStatus,
  transitionIngestionJobsByIds,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-status-transition';
import { RecipeEmbeddingDocumentService } from '../integrations/recipe-embedding-document.integration';
import { IngredientEmbeddingDocumentService } from '../integrations/ingredient-embedding-document';
import { RecipeRepository } from 'src/persistence/repositories/postgresql/recipe.repository';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';

export class EmbedSubmitRunIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmbedSubmitRunIdError';
  }
}

export class EmbedSubmitJobIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmbedSubmitJobIdError';
  }
}

export interface EmbedSubmitOptions extends RecipeIngestionLoggingOptions {
  jobId?: string;
  runId?: string;
  runIdCount?: number;
  force?: boolean;
}

export interface EmbedSubmitResult {
  submittedCount: number;
  batchId?: string;
  skippedCount: number;
}

export interface EmbedBatchJsonlRequestLine {
  custom_id: string;
  method: 'POST';
  url: '/v1/embeddings';
  body: {
    model: string;
    input: string;
  };
}

@Injectable()
export class EmbedSubmitService {
  private readonly logger = new Logger(EmbedSubmitService.name);
  private static readonly STAGE = 'embed-submit' as const;

  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly recipeEmbeddingDocumentService: RecipeEmbeddingDocumentService,
    private readonly ingredientEmbeddingDocumentService: IngredientEmbeddingDocumentService,
    private readonly openAiBatchService: OpenAIBatchService,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async submit(options: EmbedSubmitOptions = {}): Promise<EmbedSubmitResult> {
    const startedAt = Date.now();
    const logBase = {
      stage: EmbedSubmitService.STAGE,
      correlationId: options.correlationId,
      runId: options.runId,
      jobId: options.jobId,
    };

    logIngestion(this.logger, 'log', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_STARTED,
      ...logBase,
    });

    const persistedJobs = await resolveRecipeIngestionTargetJobs(
      this.jobRepository,
      'persisted',
      options,
    );
    if (persistedJobs.length === 0) {
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_NO_OP,
        outcome: 'no_op',
        ...logBase,
        message: 'No persisted jobs',
      });
      this.metrics.recordIngestionStage('embed-submit', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'embed-submit',
        Date.now() - startedAt,
      );
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
        durationMs: Date.now() - startedAt,
        ...logBase,
        outcome: 'no_op',
        submittedCount: 0,
        skippedCount: 0,
      });
      return { submittedCount: 0, skippedCount: 0 };
    }

    const jobsByRunId = this.groupJobsByRunId(persistedJobs);
    let submittedCount = 0;
    let skippedCount = persistedJobs.length - jobsByRunId.totalJobs;
    if (skippedCount > 0) {
      logIngestion(this.logger, 'warn', {
        event: RECIPE_INGESTION_LOG_EVENTS.ROW_SKIPPED,
        ...logBase,
        count: skippedCount,
        message: 'Jobs skipped due to missing runId',
      });
    }
    const submittedBatchIds: string[] = [];

    for (const [runId, jobs] of jobsByRunId.groups.entries()) {
      const result = await this.submitRunGroup(
        runId,
        jobs,
        options.correlationId,
        options.force,
      );
      submittedCount += result.submittedCount;
      skippedCount += result.skippedCount;
      if (result.batchId) submittedBatchIds.push(result.batchId);
    }

    if (submittedCount > 0) {
      this.metrics.recordIngestionStage(
        'embed-submit',
        'success',
        submittedCount,
      );
    } else {
      this.metrics.recordIngestionStage('embed-submit', 'skipped');
    }
    this.metrics.observeIngestionStageLatency(
      'embed-submit',
      Date.now() - startedAt,
    );

    const outcome =
      submittedCount > 0 ? ('success' as const) : ('skipped' as const);
    logIngestion(this.logger, 'log', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
      durationMs: Date.now() - startedAt,
      ...logBase,
      outcome,
      submittedCount,
      skippedCount,
      batchId:
        submittedBatchIds.length === 1 ? submittedBatchIds[0] : undefined,
    });

    return {
      submittedCount,
      batchId:
        submittedBatchIds.length === 1 ? submittedBatchIds[0] : undefined,
      skippedCount,
    };
  }

  private groupJobsByRunId(jobs: RecipeIngestionJobDocument[]): {
    groups: Map<string, RecipeIngestionJobDocument[]>;
    totalJobs: number;
  } {
    const groups = new Map<string, RecipeIngestionJobDocument[]>();
    let totalJobs = 0;
    for (const job of jobs) {
      if (typeof job.runId !== 'string' || job.runId.length === 0) {
        continue;
      }
      totalJobs++;
      const existing = groups.get(job.runId);
      if (existing) existing.push(job);
      else groups.set(job.runId, [job]);
    }
    return { groups, totalJobs };
  }

  private async submitRunGroup(
    runId: string,
    jobs: RecipeIngestionJobDocument[],
    correlationId?: string,
    force?: boolean,
  ): Promise<{
    submittedCount: number;
    skippedCount: number;
    batchId?: string;
  }> {
    const logBase = {
      stage: EmbedSubmitService.STAGE,
      correlationId,
      runId,
    };
    const jobIds = jobs.map((job) => String(job._id));
    const lockedCount = await transitionIngestionJobsByIds(this.jobRepository, {
      ids: jobIds,
      fromStatus: 'persisted',
      toStatus: 'embed_submitting',
      force,
    });
    if (lockedCount === 0) {
      return { submittedCount: 0, skippedCount: jobs.length };
    }
    const lockedJobs = await findIngestionJobsByIds(
      this.jobRepository,
      jobIds,
      'embed_submitting',
      force,
    );

    const lines: EmbedBatchJsonlRequestLine[] = [];
    const lineJobIds: string[] = [];
    const queuedIngredientIdSet = new Set<number>();
    let recipeNotFoundCount = 0;
    let embeddingDocNotFoundCount = 0;

    for (const job of lockedJobs) {
      const recipeId = await this.findRecipeIdBySourceId(job.sourceId);
      if (!recipeId) {
        recipeNotFoundCount++;
        await this.rollbackEmbedStatus(String(job._id), 'recipe not found');
        continue;
      }
      const doc =
        await this.recipeEmbeddingDocumentService.buildDocumentByRecipeId(
          recipeId,
        );
      if (!doc) {
        embeddingDocNotFoundCount++;
        await this.rollbackEmbedStatus(
          String(job._id),
          'embedding document not found',
        );
        continue;
      }
      lines.push({
        custom_id: String(job._id),
        method: 'POST',
        url: '/v1/embeddings',
        body: {
          model: this.openAiBatchService.getEmbeddingModel(),
          input: doc.documentText,
        },
      });
      const ingredientDocuments =
        await this.ingredientEmbeddingDocumentService.buildDocumentsByIngredientIds(
          job.newIngredientIds ?? [],
          queuedIngredientIdSet,
        );
      for (const document of ingredientDocuments) {
        lines.push({
          custom_id: `ingredient:${document.ingredientId}`,
          method: 'POST',
          url: '/v1/embeddings',
          body: {
            model: this.openAiBatchService.getEmbeddingModel(),
            input: document.documentText,
          },
        });
      }
      lineJobIds.push(String(job._id));
    }

    if (recipeNotFoundCount > 0 || embeddingDocNotFoundCount > 0) {
      logIngestion(this.logger, 'warn', {
        event: RECIPE_INGESTION_LOG_EVENTS.ROW_SKIPPED,
        ...logBase,
        recipeNotFoundCount,
        embeddingDocNotFoundCount,
        message: 'Jobs skipped during embed document preparation',
      });
    }

    if (lines.length === 0) {
      return { submittedCount: 0, skippedCount: jobs.length };
    }

    const jsonl = lines.map((line) => JSON.stringify(line)).join('\n');
    try {
      const { batchId } =
        await this.openAiBatchService.submitEmbeddingBatchJsonl(jsonl);
      const submittedCount = await transitionIngestionJobsByIds(
        this.jobRepository,
        {
          ids: lineJobIds,
          fromStatus: 'embed_submitting',
          toStatus: 'embed_submitted',
          updates: {
            batchId,
            embedSubmittedAt: new Date(),
            errorMessage: undefined,
          },
          force,
        },
      );
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_SUBMITTED,
        ...logBase,
        batchId,
        count: submittedCount,
        jobCount: lineJobIds.length,
        lineCount: lines.length,
      });
      return {
        submittedCount,
        skippedCount: jobs.length - submittedCount,
        batchId,
      };
    } catch (error) {
      const message =
        error instanceof OpenAIBatchError || error instanceof Error
          ? error.message
          : 'Embedding batch submit failed';
      for (const jobId of lineJobIds) {
        await this.rollbackEmbedStatus(jobId, message);
      }
      logIngestionError(
        this.logger,
        {
          event: RECIPE_INGESTION_LOG_EVENTS.BATCH_FAILED,
          ...logBase,
          count: lineJobIds.length,
          message,
        },
        error,
      );
      throw error;
    }
  }

  private async findRecipeIdBySourceId(
    sourceId: number,
  ): Promise<number | null> {
    return this.recipeRepository.findIdBySource(
      RECIPE_INGESTION_RECIPE_SOURCE,
      String(sourceId),
    );
  }

  private async rollbackEmbedStatus(
    jobId: string,
    errorMessage: string,
  ): Promise<void> {
    const current = await this.jobRepository.findById(jobId);
    if (!current || current.status !== 'embed_submitting') return;
    const nextRetryCount = (current.retryCount ?? 0) + 1;
    const failed = nextRetryCount >= MAX_RECIPE_INGESTION_RETRY_COUNT;
    await this.jobRepository.transitionStatus(
      jobId,
      'embed_submitting',
      failed ? 'failed' : 'persisted',
      {
        retryCount: nextRetryCount,
        errorMessage,
        ...(failed ? { failedAt: new Date() } : {}),
      },
    );
  }
}
