import { Injectable, Logger } from '@nestjs/common';
import { KAFKA_TOPICS } from '@mealio/shared';
import { Types } from 'mongoose';
import {
  isInProgressBatchStatus,
  OpenAIBatchError,
  OpenAIBatchService,
  type OpenAIBatchStatus,
} from 'src/integrations/openai/openai-batch.service';
import { KafkaProducerService } from 'src/integrations/kafka/kafka-producer.service';
import {
  createRecipeIngestionRunTriggerPayload,
  recipeIngestionRunTriggerKey,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';
import {
  logIngestion,
  logIngestionError,
  RECIPE_INGESTION_LOG_EVENTS,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-logger';
import { resolveRecipeIngestionRetrieveBatchIds } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.target';
import {
  transitionIngestionJobStatus,
  transitionIngestionJobsByBatchId,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-status-transition';
import type { RecipeIngestionRunScopeOnlyOptions } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.scope';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';

export class ParseRetrieveRunIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseRetrieveRunIdError';
  }
}

export type ParseRetrieveOptions = RecipeIngestionRunScopeOnlyOptions;

export interface ParseRetrieveResult {
  batchCount: number;
  retrievedCount: number;
  failedCount: number;
  skippedBatchCount: number;
}

export interface ParseBatchOutputJsonlLine {
  custom_id?: string;
  error?: unknown;
  response?: {
    status_code?: number;
    body?: {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };
  };
}

export type ParseBatchOutputLineOutcome =
  | {
      ok: true;
      jobId: string;
      retrievedData: Record<string, unknown>;
      usage: { inputTokens: number; outputTokens: number; totalTokens: number };
    }
  | { ok: false; jobId: string; errorMessage: string };

const TERMINAL_BATCH_FAILURE_STATUSES: ReadonlySet<OpenAIBatchStatus> = new Set(
  ['failed', 'expired'],
);

@Injectable()
export class ParseRetrieveService {
  private readonly logger = new Logger(ParseRetrieveService.name);
  private static readonly STAGE = 'parse-retrieve' as const;

  constructor(
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly openAiBatchService: OpenAIBatchService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async retrieve(
    options: ParseRetrieveOptions = {},
  ): Promise<ParseRetrieveResult> {
    const startedAt = Date.now();
    const logBase = {
      stage: ParseRetrieveService.STAGE,
      correlationId: options.correlationId,
      runId: options.runId,
    };

    logIngestion(this.logger, 'log', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_STARTED,
      ...logBase,
    });

    const batchIds = await resolveRecipeIngestionRetrieveBatchIds(
      this.jobRepository,
      'parse_submitted',
      options,
    );

    if (batchIds.length === 0) {
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_NO_OP,
        outcome: 'no_op',
        ...logBase,
        message: 'No parse_submitted batches',
      });
      this.metrics.recordIngestionStage('parse-retrieve', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'parse-retrieve',
        Date.now() - startedAt,
      );
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
        durationMs: Date.now() - startedAt,
        ...logBase,
        outcome: 'no_op',
        batchCount: 0,
        retrievedCount: 0,
        failedCount: 0,
        skippedBatchCount: 0,
      });
      return {
        batchCount: 0,
        retrievedCount: 0,
        failedCount: 0,
        skippedBatchCount: 0,
      };
    }

    let retrievedCount = 0;
    let failedCount = 0;
    let skippedBatchCount = 0;

    for (const batchId of batchIds) {
      try {
        const outcome = await this.processBatch(
          batchId,
          options.correlationId,
          options.force,
        );
        retrievedCount += outcome.retrievedCount;
        failedCount += outcome.failedCount;
        if (outcome.retrievedCount > 0) {
          for (const [retrievedRunId, count] of outcome.retrievedCountByRunId) {
            await this.emitPersistTrigger({
              runId: retrievedRunId,
              fetchedCount: count,
              correlationId: options.correlationId,
            });
          }
        }
        if (outcome.skipped) {
          skippedBatchCount++;
        }
      } catch (error) {
        logIngestionError(
          this.logger,
          {
            event: RECIPE_INGESTION_LOG_EVENTS.BATCH_FAILED,
            ...logBase,
            batchId,
          },
          error,
        );
        this.metrics.recordIngestionStage('parse-retrieve', 'failed');
      }
    }

    if (retrievedCount > 0) {
      this.metrics.recordIngestionStage(
        'parse-retrieve',
        'success',
        retrievedCount,
      );
    }
    if (failedCount > 0) {
      this.metrics.recordIngestionStage(
        'parse-retrieve',
        'failed',
        failedCount,
      );
    }
    if (skippedBatchCount > 0 && retrievedCount === 0 && failedCount === 0) {
      this.metrics.recordIngestionStage(
        'parse-retrieve',
        'skipped',
        skippedBatchCount,
      );
    }
    this.metrics.observeIngestionStageLatency(
      'parse-retrieve',
      Date.now() - startedAt,
    );

    const outcome =
      failedCount > 0
        ? ('failed' as const)
        : retrievedCount > 0
          ? ('success' as const)
          : skippedBatchCount > 0
            ? ('skipped' as const)
            : ('no_op' as const);

    logIngestion(this.logger, 'log', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
      durationMs: Date.now() - startedAt,
      ...logBase,
      outcome,
      batchCount: batchIds.length,
      retrievedCount,
      failedCount,
      skippedBatchCount,
    });

    return {
      batchCount: batchIds.length,
      retrievedCount,
      failedCount,
      skippedBatchCount,
    };
  }

  private async processBatch(
    batchId: string,
    correlationId?: string,
    force?: boolean,
  ): Promise<{
    retrievedCount: number;
    failedCount: number;
    retrievedCountByRunId: Map<string, number>;
    skipped: boolean;
  }> {
    const logBase = {
      stage: ParseRetrieveService.STAGE,
      correlationId,
      batchId,
    };
    const submittedJobs = await this.jobRepository.findByBatchId(
      batchId,
      force ? undefined : 'parse_submitted',
    );
    const distinctRunIds = new Set(
      submittedJobs
        .map((job) => job.runId)
        .filter(
          (runId): runId is string =>
            typeof runId === 'string' && runId.length > 0,
        ),
    );
    if (distinctRunIds.size > 1) {
      const rolled = await this.jobRepository.rollbackSubmittedBatchWithRetry(
        batchId,
        'runId:batchId invariant violation',
      );
      logIngestion(this.logger, 'error', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_FAILED,
        ...logBase,
        count: rolled,
        message: 'runId:batchId invariant violation',
      });
      return {
        retrievedCount: 0,
        failedCount: rolled,
        retrievedCountByRunId: new Map(),
        skipped: false,
      };
    }

    const batch = await this.openAiBatchService.getBatch(batchId);
    if (isInProgressBatchStatus(batch.status)) {
      logIngestion(this.logger, 'debug', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_SKIPPED,
        ...logBase,
        batchStatus: batch.status,
        message: 'Batch still in progress',
      });
      return {
        retrievedCount: 0,
        failedCount: 0,
        retrievedCountByRunId: new Map(),
        skipped: true,
      };
    }
    if (TERMINAL_BATCH_FAILURE_STATUSES.has(batch.status)) {
      const rolled = await this.jobRepository.rollbackSubmittedBatchWithRetry(
        batchId,
        `Batch ${batch.status}`,
      );
      logIngestion(this.logger, 'error', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_FAILED,
        ...logBase,
        batchStatus: batch.status,
        count: rolled,
        message: `Batch ${batch.status}`,
      });
      return {
        retrievedCount: 0,
        failedCount: rolled,
        retrievedCountByRunId: new Map(),
        skipped: false,
      };
    }
    if (batch.status !== 'completed') {
      logIngestion(this.logger, 'debug', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_SKIPPED,
        ...logBase,
        batchStatus: batch.status,
        message: 'Batch not completed',
      });
      return {
        retrievedCount: 0,
        failedCount: 0,
        retrievedCountByRunId: new Map(),
        skipped: true,
      };
    }
    if (!batch.outputFileId) {
      const rolled = await this.jobRepository.rollbackSubmittedBatchWithRetry(
        batchId,
        'Batch completed without output_file_id',
      );
      logIngestion(this.logger, 'error', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_FAILED,
        ...logBase,
        count: rolled,
        message: 'Batch completed without output_file_id',
      });
      return {
        retrievedCount: 0,
        failedCount: rolled,
        retrievedCountByRunId: new Map(),
        skipped: false,
      };
    }
    return this.processCompletedBatch(
      batchId,
      batch.outputFileId,
      correlationId,
      force,
    );
  }

  private async processCompletedBatch(
    batchId: string,
    outputFileId: string,
    correlationId?: string,
    force?: boolean,
  ): Promise<{
    retrievedCount: number;
    failedCount: number;
    retrievedCountByRunId: Map<string, number>;
    skipped: boolean;
  }> {
    const logBase = {
      stage: ParseRetrieveService.STAGE,
      correlationId,
      batchId,
    };
    const locked = await transitionIngestionJobsByBatchId(this.jobRepository, {
      batchId,
      fromStatus: 'parse_submitted',
      toStatus: 'parse_retrieving',
      force,
    });
    if (locked === 0) {
      return {
        retrievedCount: 0,
        failedCount: 0,
        retrievedCountByRunId: new Map(),
        skipped: false,
      };
    }

    let retrievedCount = 0;
    let failedCount = 0;
    const retrievedCountByRunId = new Map<string, number>();

    try {
      const jsonl =
        await this.openAiBatchService.downloadBatchOutput(outputFileId);
      const lines = parseParseJsonlLines(jsonl);
      for (const line of lines) {
        const outcome = parseParseBatchOutputLine(line);
        if (!outcome.ok) {
          const rolled =
            await this.jobRepository.rollbackRetrievingJobWithRetry(
              outcome.jobId,
              outcome.errorMessage,
            );
          if (rolled) failedCount++;
          continue;
        }
        const doc = await transitionIngestionJobStatus(this.jobRepository, {
          id: outcome.jobId,
          fromStatus: 'parse_retrieving',
          toStatus: 'parse_retrieved',
          updates: {
            retrievedData: outcome.retrievedData,
            parseRetrievedAt: new Date(),
            errorMessage: undefined,
          },
          force,
        });
        if (!doc) continue;
        if (typeof doc.runId === 'string' && doc.runId.length > 0) {
          retrievedCountByRunId.set(
            doc.runId,
            (retrievedCountByRunId.get(doc.runId) ?? 0) + 1,
          );
        }
        this.metrics.recordLlmTokenUsage(outcome.usage);
        retrievedCount++;
      }

      const remaining = await this.jobRepository.findByBatchId(
        batchId,
        force ? undefined : 'parse_retrieving',
      );
      for (const job of remaining) {
        const rolled = await this.jobRepository.rollbackRetrievingJobWithRetry(
          String(job._id),
          'Missing from batch output',
        );
        if (rolled) failedCount++;
      }

      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_RETRIEVED,
        ...logBase,
        retrievedCount,
        failedCount,
        lineCount: lines.length,
      });
    } catch (error) {
      const message =
        error instanceof OpenAIBatchError || error instanceof Error
          ? error.message
          : 'Batch output processing failed';
      failedCount += await this.jobRepository.rollbackRetrievingBatchWithRetry(
        batchId,
        message,
      );
      logIngestionError(
        this.logger,
        {
          event: RECIPE_INGESTION_LOG_EVENTS.BATCH_FAILED,
          ...logBase,
          count: failedCount,
          message,
        },
        error,
      );
    }

    return {
      retrievedCount,
      failedCount,
      retrievedCountByRunId,
      skipped: false,
    };
  }

  private async emitPersistTrigger(params: {
    runId: string;
    fetchedCount: number;
    correlationId?: string;
  }): Promise<void> {
    const payload = createRecipeIngestionRunTriggerPayload(params);
    const key = recipeIngestionRunTriggerKey(params.runId);
    try {
      await this.kafkaProducerService.emit(
        KAFKA_TOPICS.RECIPE_INGESTION_PERSIST_TRIGGERED,
        payload,
        key,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Parse retrieve completed trigger publish failed';
      logIngestion(this.logger, 'warn', {
        event: RECIPE_INGESTION_LOG_EVENTS.TRIGGER_PUBLISH_FAILED,
        stage: ParseRetrieveService.STAGE,
        correlationId: params.correlationId,
        runId: params.runId,
        topic: KAFKA_TOPICS.RECIPE_INGESTION_PERSIST_TRIGGERED,
        message,
      });
    }
  }
}

export function parseParseJsonlLines(
  jsonl: string,
): ParseBatchOutputJsonlLine[] {
  const lines: ParseBatchOutputJsonlLine[] = [];
  for (const raw of jsonl.split('\n')) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    lines.push(JSON.parse(trimmed) as ParseBatchOutputJsonlLine);
  }
  return lines;
}

export function parseParseBatchOutputLine(
  line: ParseBatchOutputJsonlLine,
): ParseBatchOutputLineOutcome {
  const jobId = line.custom_id ?? '';
  if (!jobId || !Types.ObjectId.isValid(jobId)) {
    return {
      ok: false,
      jobId: jobId || 'unknown',
      errorMessage: 'Invalid custom_id',
    };
  }
  if (line.error != null) {
    return {
      ok: false,
      jobId,
      errorMessage:
        typeof line.error === 'string'
          ? line.error
          : JSON.stringify(line.error),
    };
  }
  const statusCode = line.response?.status_code;
  if (statusCode !== 200) {
    return {
      ok: false,
      jobId,
      errorMessage: `Batch line status_code=${statusCode ?? 'missing'}`,
    };
  }
  const content = line.response?.body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.length === 0) {
    return { ok: false, jobId, errorMessage: 'Empty completion content' };
  }
  try {
    const retrievedData = JSON.parse(content) as Record<string, unknown>;
    const usageRaw = line.response?.body as
      | {
          usage?: {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
          };
        }
      | undefined;
    const usage = usageRaw?.usage;
    const inputTokens = Number(usage?.prompt_tokens ?? 0);
    const outputTokens = Number(usage?.completion_tokens ?? 0);
    const totalTokens = Number(
      usage?.total_tokens ?? inputTokens + outputTokens,
    );
    return {
      ok: true,
      jobId,
      retrievedData,
      usage: {
        inputTokens: Number.isFinite(inputTokens) ? inputTokens : 0,
        outputTokens: Number.isFinite(outputTokens) ? outputTokens : 0,
        totalTokens: Number.isFinite(totalTokens) ? totalTokens : 0,
      },
    };
  } catch {
    return {
      ok: false,
      jobId,
      errorMessage: 'Invalid JSON in completion content',
    };
  }
}
