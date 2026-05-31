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
    };
  };
}

export type BatchOutputLineOutcome =
  | { ok: true; jobId: string; retrievedData: Record<string, unknown> }
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
  ) {}

  async retrieve(): Promise<RetrieveResult> {
    const batchIds =
      await this.jobRepository.findDistinctBatchIdsByStatus('submitted');

    if (batchIds.length === 0) {
      this.logger.log('No submitted batches — no-op exit');
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
        if (outcome.skipped) {
          skippedBatchCount++;
        }
      } catch (error) {
        const message =
          error instanceof OpenAIBatchError || error instanceof Error
            ? error.message
            : 'Batch retrieve failed';
        this.logger.error(`batchId=${batchId} retrieve error: ${message}`);
      }
    }

    this.logger.log(
      `Retrieve complete batches=${batchIds.length} retrieved=${retrievedCount} failed=${failedCount} skipped=${skippedBatchCount}`,
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
    skipped: boolean;
  }> {
    const batch = await this.openAiBatchService.getBatch(batchId);

    if (isInProgressBatchStatus(batch.status)) {
      this.logger.debug(`batchId=${batchId} status=${batch.status} — skip`);
      return { retrievedCount: 0, failedCount: 0, skipped: true };
    }

    if (TERMINAL_BATCH_FAILURE_STATUSES.has(batch.status)) {
      const rolled = await this.jobRepository.rollbackSubmittedBatchWithRetry(
        batchId,
        `Batch ${batch.status}`,
      );
      this.logger.warn(
        `batchId=${batchId} status=${batch.status} rolledBack=${rolled}`,
      );
      return { retrievedCount: 0, failedCount: rolled, skipped: false };
    }

    if (batch.status !== 'completed') {
      this.logger.debug(
        `batchId=${batchId} status=${batch.status} — no action`,
      );
      return { retrievedCount: 0, failedCount: 0, skipped: true };
    }

    if (!batch.outputFileId) {
      const rolled = await this.jobRepository.rollbackSubmittedBatchWithRetry(
        batchId,
        'Batch completed without output_file_id',
      );
      return { retrievedCount: 0, failedCount: rolled, skipped: false };
    }

    return this.processCompletedBatch(batchId, batch.outputFileId);
  }

  private async processCompletedBatch(
    batchId: string,
    outputFileId: string,
  ): Promise<{
    retrievedCount: number;
    failedCount: number;
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
      return { retrievedCount: 0, failedCount: 0, skipped: false };
    }

    let retrievedCount = 0;
    let failedCount = 0;

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

        await this.kafkaProducerService.emit(
          KAFKA_TOPICS.RECIPE_INGESTION_RETRIEVED,
          { jobId: outcome.jobId },
          outcome.jobId,
        );
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

    return { retrievedCount, failedCount, skipped: false };
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
    return { ok: true, jobId, retrievedData };
  } catch {
    return {
      ok: false,
      jobId,
      errorMessage: 'Invalid JSON in completion content',
    };
  }
}
