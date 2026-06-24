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
import { resolveRecipeIngestionTargetJobs } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.target';
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

export interface EmbedSubmitOptions {
  jobId?: string;
  runId?: string;
  runIdCount?: number;
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
    const persistedJobs = await resolveRecipeIngestionTargetJobs(
      this.jobRepository,
      'persisted',
      options,
    );
    if (persistedJobs.length === 0) {
      this.logger.log('No persisted jobs — no-op exit');
      this.metrics.recordIngestionStage('embed-submit', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'embed-submit',
        Date.now() - startedAt,
      );
      return { submittedCount: 0, skippedCount: 0 };
    }

    const jobsByRunId = this.groupJobsByRunId(persistedJobs);
    let submittedCount = 0;
    let skippedCount = persistedJobs.length - jobsByRunId.totalJobs;
    if (skippedCount > 0) {
      this.logger.warn(`Skipped jobs without runId count=${skippedCount}`);
    }
    const submittedBatchIds: string[] = [];

    for (const [runId, jobs] of jobsByRunId.groups.entries()) {
      const result = await this.submitRunGroup(runId, jobs);
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
  ): Promise<{
    submittedCount: number;
    skippedCount: number;
    batchId?: string;
  }> {
    const jobIds = jobs.map((job) => String(job._id));
    const lockedCount = await this.jobRepository.transitionManyByIds(
      jobIds,
      'persisted',
      'embed_submitting',
    );
    if (lockedCount === 0) {
      return { submittedCount: 0, skippedCount: jobs.length };
    }
    const lockedJobs = await this.jobRepository.findManyByIdsAndStatus(
      jobIds,
      'embed_submitting',
    );

    const lines: EmbedBatchJsonlRequestLine[] = [];
    const lineJobIds: string[] = [];
    const queuedIngredientIdSet = new Set<number>();
    for (const job of lockedJobs) {
      const recipeId = await this.findRecipeIdBySourceId(job.sourceId);
      if (!recipeId) {
        await this.rollbackEmbedStatus(String(job._id), 'recipe not found');
        continue;
      }
      const doc =
        await this.recipeEmbeddingDocumentService.buildDocumentByRecipeId(recipeId);
      if (!doc) {
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
        await this.ingredientEmbeddingDocumentService.buildDocumentsByRecipeId(
          recipeId,
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

    if (lines.length === 0) {
      return { submittedCount: 0, skippedCount: jobs.length };
    }

    const jsonl = lines.map((line) => JSON.stringify(line)).join('\n');
    try {
      const { batchId } =
        await this.openAiBatchService.submitEmbeddingBatchJsonl(jsonl);
      const submittedCount = await this.jobRepository.transitionManyByIds(
        lineJobIds,
        'embed_submitting',
        'embed_submitted',
        {
          batchId,
          submittedAt: new Date(),
          errorMessage: undefined,
        },
      );
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
      this.logger.error(
        `runId=${runId} embed submit failed for ${lineJobIds.length} jobs: ${message}`,
      );
      for (const jobId of lineJobIds) {
        await this.rollbackEmbedStatus(jobId, message);
      }
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
