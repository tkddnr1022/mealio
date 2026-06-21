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
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';
import { resolveRecipeIngestionRetrieveBatchIds } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.target';
import type { RecipeIngestionRunScopeOnlyOptions } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.scope';
import {
  createRecipeIngestionRunTriggerPayload,
  recipeIngestionRunTriggerKey,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';

export class RetrieveRunIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetrieveRunIdError';
  }
}

export type RetrieveOptions = RecipeIngestionRunScopeOnlyOptions;

export interface RetrieveResult {
  batchCount: number;
  retrievedCount: number;
  failedCount: number;
  skippedBatchCount: number;
}

/** OpenAI Batch output JSONL 한 줄 */
export interface BatchOutputJsonlLine {
  custom_id?: string;
  error?: unknown;
  response?: {
    status_code?: number;
    body?: {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };
  };
}

export type BatchOutputLineOutcome =
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

/**
 * OpenAI Batch 완료 확인·결과 반영·Kafka persist 트리거
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §5.3
 */
@Injectable()
export class RetrieveService {
  private readonly logger = new Logger(RetrieveService.name);

  constructor(
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly openAiBatchService: OpenAIBatchService,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async retrieve(options: RetrieveOptions = {}): Promise<RetrieveResult> {
    const startedAt = Date.now();
    const batchIds = await resolveRecipeIngestionRetrieveBatchIds(
      this.jobRepository,
      options,
    );

    if (batchIds.length === 0) {
      this.logger.log('No submitted batches — no-op exit');
      this.metrics.recordIngestionStage('retrieve', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'retrieve',
        Date.now() - startedAt,
      );
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
        const outcome = await this.processBatch(batchId);
        retrievedCount += outcome.retrievedCount;
        failedCount += outcome.failedCount;
        if (outcome.retrievedCount > 0) {
          for (const [
            retrievedRunId,
            count,
          ] of outcome.retrievedCountByRunId.entries()) {
            await this.emitRetrievedTrigger({
              runId: retrievedRunId,
              fetchedCount: count,
            });
          }
        }
        if (outcome.skipped) {
          skippedBatchCount++;
        }
      } catch (error) {
        const message =
          error instanceof OpenAIBatchError || error instanceof Error
            ? error.message
            : 'Batch retrieve failed';
        this.logger.error(`batchId=${batchId} retrieve error: ${message}`);
        this.metrics.recordIngestionStage('retrieve', 'failed');
      }
    }

    this.logger.log(
      `Retrieve complete batches=${batchIds.length} retrieved=${retrievedCount} failed=${failedCount} skipped=${skippedBatchCount}`,
    );
    if (retrievedCount > 0) {
      this.metrics.recordIngestionStage('retrieve', 'success', retrievedCount);
    }
    if (failedCount > 0) {
      this.metrics.recordIngestionStage('retrieve', 'failed', failedCount);
    }
    if (skippedBatchCount > 0 && retrievedCount === 0 && failedCount === 0) {
      this.metrics.recordIngestionStage(
        'retrieve',
        'skipped',
        skippedBatchCount,
      );
    }
    this.metrics.observeIngestionStageLatency(
      'retrieve',
      Date.now() - startedAt,
    );

    return {
      batchCount: batchIds.length,
      retrievedCount,
      failedCount,
      skippedBatchCount,
    };
  }

  private async processBatch(batchId: string): Promise<{
    retrievedCount: number;
    failedCount: number;
    retrievedCountByRunId: Map<string, number>;
    skipped: boolean;
  }> {
    const batch = await this.openAiBatchService.getBatch(batchId);

    if (isInProgressBatchStatus(batch.status)) {
      this.logger.debug(`batchId=${batchId} status=${batch.status} — skip`);
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
      this.logger.warn(
        `batchId=${batchId} status=${batch.status} rolledBack=${rolled}`,
      );
      return {
        retrievedCount: 0,
        failedCount: rolled,
        retrievedCountByRunId: new Map(),
        skipped: false,
      };
    }

    if (batch.status !== 'completed') {
      this.logger.debug(
        `batchId=${batchId} status=${batch.status} — no action`,
      );
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
      return {
        retrievedCount: 0,
        failedCount: rolled,
        retrievedCountByRunId: new Map(),
        skipped: false,
      };
    }

    return this.processCompletedBatch(batchId, batch.outputFileId);
  }

  private async processCompletedBatch(
    batchId: string,
    outputFileId: string,
  ): Promise<{
    retrievedCount: number;
    failedCount: number;
    retrievedCountByRunId: Map<string, number>;
    skipped: boolean;
  }> {
    const locked = await this.jobRepository.transitionManyByBatchId(
      batchId,
      'submitted',
      'retrieving',
    );

    if (locked === 0) {
      this.logger.warn(
        `batchId=${batchId} no jobs transitioned to retrieving — concurrent run?`,
      );
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
      const lines = parseJsonlLines(jsonl);

      for (const line of lines) {
        const outcome = parseBatchOutputLine(line);
        if (!outcome.ok) {
          const rolled =
            await this.jobRepository.rollbackRetrievingJobWithRetry(
              outcome.jobId,
              outcome.errorMessage,
            );
          if (rolled) {
            failedCount++;
          }
          continue;
        }

        const doc = await this.jobRepository.transitionStatus(
          outcome.jobId,
          'retrieving',
          'retrieved',
          {
            retrievedData: outcome.retrievedData,
            retrievedAt: new Date(),
            errorMessage: undefined,
          },
        );

        if (!doc) {
          continue;
        }

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
        'retrieving',
      );
      for (const job of remaining) {
        const rolled = await this.jobRepository.rollbackRetrievingJobWithRetry(
          String(job._id),
          'Missing from batch output',
        );
        if (rolled) {
          failedCount++;
        }
      }
    } catch (error) {
      const message =
        error instanceof OpenAIBatchError || error instanceof Error
          ? error.message
          : 'Batch output processing failed';

      const rolled = await this.jobRepository.rollbackRetrievingBatchWithRetry(
        batchId,
        message,
      );
      failedCount += rolled;
      this.logger.error(
        `batchId=${batchId} output processing failed rolledBack=${rolled}: ${message}`,
      );
    }

    this.logger.log(
      `batchId=${batchId} retrieved=${retrievedCount} lineFailures=${failedCount}`,
    );

    return { retrievedCount, failedCount, retrievedCountByRunId, skipped: false };
  }

  private async emitRetrievedTrigger(params: {
    runId: string;
    fetchedCount: number;
  }): Promise<void> {
    const payload = createRecipeIngestionRunTriggerPayload(params);
    const key = recipeIngestionRunTriggerKey(params.runId);

    try {
      await this.kafkaProducerService.emit(
        KAFKA_TOPICS.RECIPE_INGESTION_RETRIEVED,
        payload,
        key,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Retrieve completed trigger publish failed';
      this.logger.warn(
        `Retrieve completed trigger publish failed runId=${params.runId}: ${message}`,
      );
    }
  }
}

export function parseJsonlLines(jsonl: string): BatchOutputJsonlLine[] {
  const lines: BatchOutputJsonlLine[] = [];
  for (const raw of jsonl.split('\n')) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      continue;
    }
    lines.push(JSON.parse(trimmed) as BatchOutputJsonlLine);
  }
  return lines;
}

export function parseBatchOutputLine(
  line: BatchOutputJsonlLine,
): BatchOutputLineOutcome {
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
    return {
      ok: false,
      jobId,
      errorMessage: 'Empty completion content',
    };
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
