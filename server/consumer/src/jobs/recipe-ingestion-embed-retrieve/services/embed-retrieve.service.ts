import { Injectable, Logger } from '@nestjs/common';
import {
  MAX_RECIPE_INGESTION_RETRY_COUNT,
  RECIPE_INGESTION_RECIPE_SOURCE,
} from '@mealio/shared';
import { Types } from 'mongoose';
import {
  isInProgressBatchStatus,
  OpenAIBatchError,
  OpenAIBatchService,
  type OpenAIBatchStatus,
} from 'src/integrations/openai/openai-batch.service';
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
import { IngredientEmbeddingRepository } from 'src/persistence/repositories/postgresql/ingredient-embedding.repository';
import { RecipeEmbeddingRepository } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';
import { RecipeRepository } from 'src/persistence/repositories/postgresql/recipe.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';

export type EmbedRetrieveOptions = RecipeIngestionRunScopeOnlyOptions;

export interface EmbedRetrieveResult {
  batchCount: number;
  retrievedCount: number;
  failedCount: number;
  skippedBatchCount: number;
}

type EmbedBatchLine = {
  custom_id?: string;
  error?: unknown;
  response?: {
    status_code?: number;
    body?: {
      data?: Array<{ embedding?: number[] }>;
    };
  };
};

type EmbedBatchOutcome =
  | { ok: true; jobId: string; embedding: number[] }
  | { ok: false; jobId: string; errorMessage: string };

type IngredientEmbedBatchOutcome =
  | { ok: true; ingredientId: number; embedding: number[] }
  | { ok: false; ingredientId: number | null; errorMessage: string };

const TERMINAL_BATCH_FAILURE_STATUSES: ReadonlySet<OpenAIBatchStatus> = new Set(
  ['failed', 'expired'],
);

@Injectable()
export class EmbedRetrieveService {
  private readonly logger = new Logger(EmbedRetrieveService.name);
  private static readonly STAGE = 'embed-retrieve' as const;

  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly openAiBatchService: OpenAIBatchService,
    private readonly ingredientEmbeddingRepository: IngredientEmbeddingRepository,
    private readonly recipeEmbeddingRepository: RecipeEmbeddingRepository,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async retrieve(
    options: EmbedRetrieveOptions = {},
  ): Promise<EmbedRetrieveResult> {
    const startedAt = Date.now();
    const logBase = {
      stage: EmbedRetrieveService.STAGE,
      correlationId: options.correlationId,
      runId: options.runId,
    };

    logIngestion(this.logger, 'log', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_STARTED,
      ...logBase,
    });

    const batchIds = await resolveRecipeIngestionRetrieveBatchIds(
      this.jobRepository,
      'embed_submitted',
      'embed',
      options,
    );
    if (batchIds.length === 0) {
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_NO_OP,
        outcome: 'no_op',
        ...logBase,
        message: 'No embed_submitted batches',
      });
      this.metrics.recordIngestionStage('embed-retrieve', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'embed-retrieve',
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
        const result = await this.processBatch(
          batchId,
          options.correlationId,
          options.force,
        );
        retrievedCount += result.retrievedCount;
        failedCount += result.failedCount;
        if (result.skipped) skippedBatchCount++;
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
        this.metrics.recordIngestionStage('embed-retrieve', 'failed');
      }
    }

    if (retrievedCount > 0) {
      this.metrics.recordIngestionStage(
        'embed-retrieve',
        'success',
        retrievedCount,
      );
    }
    if (failedCount > 0) {
      this.metrics.recordIngestionStage(
        'embed-retrieve',
        'failed',
        failedCount,
      );
    }
    if (skippedBatchCount > 0 && retrievedCount === 0 && failedCount === 0) {
      this.metrics.recordIngestionStage(
        'embed-retrieve',
        'skipped',
        skippedBatchCount,
      );
    }
    this.metrics.observeIngestionStageLatency(
      'embed-retrieve',
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
    skipped: boolean;
  }> {
    const logBase = {
      stage: EmbedRetrieveService.STAGE,
      correlationId,
      batchId,
    };
    const submittedJobs = await this.jobRepository.findByEmbedBatchId(
      batchId,
      force ? undefined : 'embed_submitted',
    );
    if (submittedJobs.length === 0) {
      return { retrievedCount: 0, failedCount: 0, skipped: true };
    }
    const batch = await this.openAiBatchService.getBatch(batchId);
    if (isInProgressBatchStatus(batch.status)) {
      logIngestion(this.logger, 'debug', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_SKIPPED,
        ...logBase,
        batchStatus: batch.status,
        message: 'Batch still in progress',
      });
      return { retrievedCount: 0, failedCount: 0, skipped: true };
    }
    if (TERMINAL_BATCH_FAILURE_STATUSES.has(batch.status)) {
      const failedCount = await this.rollbackEmbedSubmittedBatch(
        batchId,
        `Batch ${batch.status}`,
      );
      logIngestion(this.logger, 'error', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_FAILED,
        ...logBase,
        batchStatus: batch.status,
        count: failedCount,
        message: `Batch ${batch.status}`,
      });
      return { retrievedCount: 0, failedCount, skipped: false };
    }
    if (batch.status !== 'completed' || !batch.outputFileId) {
      logIngestion(this.logger, 'debug', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_SKIPPED,
        ...logBase,
        batchStatus: batch.status,
        message: 'Batch not completed or missing output file',
      });
      return { retrievedCount: 0, failedCount: 0, skipped: true };
    }

    const locked = await transitionIngestionJobsByBatchId(this.jobRepository, {
      stage: 'embed',
      batchId,
      fromStatus: 'embed_submitted',
      toStatus: 'embed_retrieving',
      force,
    });
    if (locked === 0) {
      return { retrievedCount: 0, failedCount: 0, skipped: true };
    }

    let retrievedCount = 0;
    let failedCount = 0;
    let ingredientLineSkippedCount = 0;
    let ingredientUpsertFailedCount = 0;

    try {
      const jsonl = await this.openAiBatchService.downloadBatchOutput(
        batch.outputFileId,
      );
      const lines = parseEmbedJsonlLines(jsonl);
      for (const line of lines) {
        const customId = line.custom_id ?? '';
        if (customId.startsWith('ingredient:')) {
          const outcome = await this.upsertIngredientEmbeddingLine(
            line,
            correlationId,
          );
          if (outcome === 'skipped') ingredientLineSkippedCount++;
          if (outcome === 'upsert_failed') ingredientUpsertFailedCount++;
          continue;
        }
        const outcome = parseEmbedBatchLine(line);
        if (!outcome.ok) {
          const rolled = await this.rollbackEmbedRetrievingJob(
            outcome.jobId,
            outcome.errorMessage,
          );
          if (rolled) failedCount++;
          continue;
        }

        const job = await this.jobRepository.findById(outcome.jobId);
        if (!job) continue;
        if (!force && job.status !== 'embed_retrieving') continue;
        const recipeId = await this.findRecipeIdBySourceId(job.sourceId);
        if (!recipeId) {
          const rolled = await this.rollbackEmbedRetrievingJob(
            outcome.jobId,
            'recipe not found',
          );
          if (rolled) failedCount++;
          continue;
        }
        await this.recipeEmbeddingRepository.upsert({
          recipeId,
          embedding: outcome.embedding,
          embeddingModel: this.openAiBatchService.getEmbeddingModel(),
        });
        const done = await transitionIngestionJobStatus(this.jobRepository, {
          id: outcome.jobId,
          fromStatus: 'embed_retrieving',
          toStatus: 'embed_retrieved',
          updates: { embedRetrievedAt: new Date(), errorMessage: undefined },
          force,
        });
        if (done) retrievedCount++;
      }

      const remaining = await this.jobRepository.findByEmbedBatchId(
        batchId,
        force ? undefined : 'embed_retrieving',
      );
      for (const job of remaining) {
        const rolled = await this.rollbackEmbedRetrievingJob(
          String(job._id),
          'Missing from batch output',
        );
        if (rolled) failedCount++;
      }

      if (ingredientLineSkippedCount > 0 || ingredientUpsertFailedCount > 0) {
        logIngestion(this.logger, 'warn', {
          event: RECIPE_INGESTION_LOG_EVENTS.DEGRADED,
          ...logBase,
          ingredientLineSkippedCount,
          ingredientUpsertFailedCount,
          message: 'Ingredient embedding lines partially failed',
        });
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
          : 'Embedding batch output processing failed';
      failedCount += await this.rollbackEmbedRetrievingBatch(batchId, message);
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

    return { retrievedCount, failedCount, skipped: false };
  }

  private async findRecipeIdBySourceId(
    sourceId: number,
  ): Promise<number | null> {
    return this.recipeRepository.findIdBySource(
      RECIPE_INGESTION_RECIPE_SOURCE,
      String(sourceId),
    );
  }

  private async rollbackEmbedSubmittedBatch(
    batchId: string,
    errorMessage: string,
  ): Promise<number> {
    const jobs = await this.jobRepository.findByEmbedBatchId(
      batchId,
      'embed_submitted',
    );
    let count = 0;
    for (const job of jobs) {
      const done = await this.rollbackEmbedJobStatus(
        String(job._id),
        'embed_submitted',
        errorMessage,
      );
      if (done) count++;
    }
    return count;
  }

  private async rollbackEmbedRetrievingBatch(
    batchId: string,
    errorMessage: string,
  ): Promise<number> {
    const jobs = await this.jobRepository.findByEmbedBatchId(
      batchId,
      'embed_retrieving',
    );
    let count = 0;
    for (const job of jobs) {
      const done = await this.rollbackEmbedJobStatus(
        String(job._id),
        'embed_retrieving',
        errorMessage,
      );
      if (done) count++;
    }
    return count;
  }

  private async rollbackEmbedRetrievingJob(
    jobId: string,
    errorMessage: string,
  ): Promise<boolean> {
    return this.rollbackEmbedJobStatus(jobId, 'embed_retrieving', errorMessage);
  }

  private async rollbackEmbedJobStatus(
    jobId: string,
    fromStatus: 'embed_submitted' | 'embed_retrieving',
    errorMessage: string,
  ): Promise<boolean> {
    const current = await this.jobRepository.findById(jobId);
    if (!current || current.status !== fromStatus) return false;
    const nextRetryCount = (current.retryCount ?? 0) + 1;
    const failed = nextRetryCount >= MAX_RECIPE_INGESTION_RETRY_COUNT;
    const updated = await this.jobRepository.transitionStatus(
      jobId,
      fromStatus,
      failed ? 'failed' : 'persisted',
      {
        retryCount: nextRetryCount,
        errorMessage,
        ...(failed ? { failedAt: new Date() } : {}),
        ...(!failed
          ? { embedBatchId: undefined, embedSubmittedAt: undefined }
          : {}),
      },
    );
    return !!updated;
  }

  private async upsertIngredientEmbeddingLine(
    line: EmbedBatchLine,
    correlationId?: string,
  ): Promise<'ok' | 'skipped' | 'upsert_failed'> {
    const outcome = parseIngredientEmbedBatchLine(line);
    if (!outcome.ok) {
      logIngestion(this.logger, 'debug', {
        event: RECIPE_INGESTION_LOG_EVENTS.ROW_SKIPPED,
        stage: EmbedRetrieveService.STAGE,
        correlationId,
        ingredientId: outcome.ingredientId ?? undefined,
        message: outcome.errorMessage,
      });
      return 'skipped';
    }
    try {
      await this.ingredientEmbeddingRepository.upsert({
        ingredientId: outcome.ingredientId,
        embedding: outcome.embedding,
        embeddingModel: this.openAiBatchService.getEmbeddingModel(),
      });
      return 'ok';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logIngestion(this.logger, 'warn', {
        event: RECIPE_INGESTION_LOG_EVENTS.DEGRADED,
        stage: EmbedRetrieveService.STAGE,
        correlationId,
        ingredientId: outcome.ingredientId,
        message: `Ingredient embedding upsert failed: ${message}`,
      });
      return 'upsert_failed';
    }
  }
}

export function parseEmbedJsonlLines(jsonl: string): EmbedBatchLine[] {
  const lines: EmbedBatchLine[] = [];
  for (const raw of jsonl.split('\n')) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    lines.push(JSON.parse(trimmed) as EmbedBatchLine);
  }
  return lines;
}

export function parseEmbedBatchLine(line: EmbedBatchLine): EmbedBatchOutcome {
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
  const embedding = line.response?.body?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    return { ok: false, jobId, errorMessage: 'Embedding vector missing' };
  }
  return { ok: true, jobId, embedding };
}

export function parseIngredientEmbedBatchLine(
  line: EmbedBatchLine,
): IngredientEmbedBatchOutcome {
  const customId = line.custom_id ?? '';
  if (!customId.startsWith('ingredient:')) {
    return {
      ok: false,
      ingredientId: null,
      errorMessage: 'Invalid ingredient custom_id prefix',
    };
  }
  const ingredientIdText = customId.slice('ingredient:'.length);
  const ingredientId = Number.parseInt(ingredientIdText, 10);
  if (!Number.isInteger(ingredientId) || ingredientId <= 0) {
    return {
      ok: false,
      ingredientId: null,
      errorMessage: 'Invalid ingredient custom_id value',
    };
  }
  if (line.error != null) {
    return {
      ok: false,
      ingredientId,
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
      ingredientId,
      errorMessage: `Batch line status_code=${statusCode ?? 'missing'}`,
    };
  }
  const embedding = line.response?.body?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    return {
      ok: false,
      ingredientId,
      errorMessage: 'Embedding vector missing',
    };
  }
  return { ok: true, ingredientId, embedding };
}
