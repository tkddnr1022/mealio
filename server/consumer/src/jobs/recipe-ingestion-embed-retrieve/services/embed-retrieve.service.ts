import { Injectable, Logger } from '@nestjs/common';
import {
  formatRecipeNutritionSummary,
  MAX_RECIPE_INGESTION_RETRY_COUNT,
  RECIPE_INGESTION_RECIPE_SOURCE,
} from '@mealio/shared';
import { PrismaService } from '@mealio/shared';
import { Types } from 'mongoose';
import {
  isInProgressBatchStatus,
  OpenAIBatchError,
  OpenAIBatchService,
  type OpenAIBatchStatus,
} from 'src/integrations/openai/openai-batch.service';
import { resolveRecipeIngestionRetrieveBatchIds } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.target';
import type { RecipeIngestionRunScopeOnlyOptions } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.scope';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeEmbeddingRepository } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';
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

type RecipeInstructionStep = { step?: number; content?: string };

const TERMINAL_BATCH_FAILURE_STATUSES: ReadonlySet<OpenAIBatchStatus> = new Set(
  ['failed', 'expired'],
);

@Injectable()
export class EmbedRetrieveService {
  private readonly logger = new Logger(EmbedRetrieveService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly openAiBatchService: OpenAIBatchService,
    private readonly recipeEmbeddingRepository: RecipeEmbeddingRepository,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async retrieve(
    options: EmbedRetrieveOptions = {},
  ): Promise<EmbedRetrieveResult> {
    const startedAt = Date.now();
    const batchIds = await resolveRecipeIngestionRetrieveBatchIds(
      this.jobRepository,
      'embed_submitted',
      options,
    );
    if (batchIds.length === 0) {
      this.logger.log('No embed-submitted batches — no-op exit');
      this.metrics.recordIngestionStage('embed-retrieve', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'embed-retrieve',
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
        const result = await this.processBatch(batchId);
        retrievedCount += result.retrievedCount;
        failedCount += result.failedCount;
        if (result.skipped) skippedBatchCount++;
      } catch (error) {
        const message =
          error instanceof OpenAIBatchError || error instanceof Error
            ? error.message
            : 'Embed retrieve failed';
        this.logger.error(
          `batchId=${batchId} embed retrieve error: ${message}`,
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
    const submittedJobs = await this.jobRepository.findByBatchId(
      batchId,
      'embed_submitted',
    );
    if (submittedJobs.length === 0) {
      return { retrievedCount: 0, failedCount: 0, skipped: true };
    }
    const batch = await this.openAiBatchService.getBatch(batchId);
    if (isInProgressBatchStatus(batch.status)) {
      return { retrievedCount: 0, failedCount: 0, skipped: true };
    }
    if (TERMINAL_BATCH_FAILURE_STATUSES.has(batch.status)) {
      const failedCount = await this.rollbackEmbedSubmittedBatch(
        batchId,
        `Batch ${batch.status}`,
      );
      return { retrievedCount: 0, failedCount, skipped: false };
    }
    if (batch.status !== 'completed' || !batch.outputFileId) {
      return { retrievedCount: 0, failedCount: 0, skipped: true };
    }

    const locked = await this.jobRepository.transitionManyByBatchId(
      batchId,
      'embed_submitted',
      'embed_retrieving',
    );
    if (locked === 0) {
      return { retrievedCount: 0, failedCount: 0, skipped: true };
    }

    let retrievedCount = 0;
    let failedCount = 0;
    try {
      const jsonl = await this.openAiBatchService.downloadBatchOutput(
        batch.outputFileId,
      );
      const lines = parseEmbedJsonlLines(jsonl);
      for (const line of lines) {
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
        if (!job || job.status !== 'embed_retrieving') continue;
        const recipeId = await this.findRecipeIdBySourceId(job.sourceId);
        if (!recipeId) {
          const rolled = await this.rollbackEmbedRetrievingJob(
            outcome.jobId,
            'recipe not found',
          );
          if (rolled) failedCount++;
          continue;
        }
        const doc = await this.buildDocumentByRecipeId(recipeId);
        if (!doc) {
          const rolled = await this.rollbackEmbedRetrievingJob(
            outcome.jobId,
            'embedding document not found',
          );
          if (rolled) failedCount++;
          continue;
        }
        await this.recipeEmbeddingRepository.upsert({
          recipeId: doc.recipeId,
          embedding: outcome.embedding,
          documentText: doc.documentText,
          embeddingModel: this.openAiBatchService.getEmbeddingModel(),
          sourceUpdatedAt: doc.sourceUpdatedAt,
        });
        const done = await this.jobRepository.transitionStatus(
          outcome.jobId,
          'embed_retrieving',
          'embed_retrieved',
          { retrievedAt: new Date(), errorMessage: undefined },
        );
        if (done) retrievedCount++;
      }

      const remaining = await this.jobRepository.findByBatchId(
        batchId,
        'embed_retrieving',
      );
      for (const job of remaining) {
        const rolled = await this.rollbackEmbedRetrievingJob(
          String(job._id),
          'Missing from batch output',
        );
        if (rolled) failedCount++;
      }
    } catch (error) {
      const message =
        error instanceof OpenAIBatchError || error instanceof Error
          ? error.message
          : 'Embedding batch output processing failed';
      failedCount += await this.rollbackEmbedRetrievingBatch(batchId, message);
    }

    return { retrievedCount, failedCount, skipped: false };
  }

  private async findRecipeIdBySourceId(
    sourceId: number,
  ): Promise<number | null> {
    const row = await this.prisma.recipe.findUnique({
      where: {
        source_sourceRecipeId: {
          source: RECIPE_INGESTION_RECIPE_SOURCE,
          sourceRecipeId: String(sourceId),
        },
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  private async buildDocumentByRecipeId(recipeId: number): Promise<{
    recipeId: number;
    documentText: string;
    sourceUpdatedAt: Date;
  } | null> {
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return null;
    }
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        categoryMeta: { select: { key: true, name: true } },
        recipeIngredients: {
          include: {
            ingredient: {
              include: { categoryMeta: { select: { key: true, name: true } } },
            },
          },
        },
      },
    });
    if (!recipe) return null;
    return {
      recipeId: recipe.id,
      documentText: this.buildRecipeDocument(recipe),
      sourceUpdatedAt: recipe.updatedAt,
    };
  }

  private buildRecipeDocument(recipe: {
    id: number;
    title: string;
    description: string | null;
    instructions: unknown;
    cookTime: number;
    difficulty: number;
    servings: number;
    cookingMethod: string | null;
    dishType: string | null;
    nutrition: unknown;
    cookingTip: string | null;
    updatedAt: Date;
    categoryMeta: { key: string; name: string };
    recipeIngredients: Array<{
      ingredient: {
        id: number;
        name: string;
        categoryMeta: { key: string; name: string };
      };
      amount: unknown;
      unit: string | null;
      isOptional: boolean;
    }>;
  }): string {
    const ingredients = recipe.recipeIngredients
      .map((row) => {
        const amountText =
          row.amount != null
            ? ` ${
                typeof row.amount === 'string' ||
                typeof row.amount === 'number' ||
                typeof row.amount === 'boolean'
                  ? String(row.amount)
                  : JSON.stringify(row.amount)
              }`
            : '';
        const unitText = row.unit ?? '';
        const optionalText = row.isOptional ? ' optional' : '';
        return `${row.ingredient.name}${amountText}${unitText}${optionalText} (${row.ingredient.categoryMeta.name})`;
      })
      .join(', ');

    const lines = [
      `recipe_id: ${recipe.id}`,
      `title: ${recipe.title}`,
      `description: ${recipe.description ?? ''}`,
      `category: ${recipe.categoryMeta.name} (${recipe.categoryMeta.key})`,
      `cook_time_minutes: ${recipe.cookTime}`,
      `difficulty: ${recipe.difficulty}`,
      `servings: ${recipe.servings}`,
    ];
    if (recipe.cookingMethod)
      lines.push(`cooking_method: ${recipe.cookingMethod}`);
    if (recipe.dishType) lines.push(`dish_type: ${recipe.dishType}`);

    const nutritionText = formatRecipeNutritionSummary(recipe.nutrition, {
      locale: 'en',
    });
    if (nutritionText) lines.push(`nutrition_per_serving: ${nutritionText}`);
    if (recipe.cookingTip) lines.push(`cooking_tip: ${recipe.cookingTip}`);
    lines.push(`ingredients: ${ingredients}`);

    const instructionsText = this.formatInstructions(recipe.instructions);
    if (instructionsText) lines.push(`instructions: ${instructionsText}`);
    return lines.join('\n');
  }

  private formatInstructions(instructions: unknown): string {
    if (!Array.isArray(instructions) || instructions.length === 0) {
      return '';
    }
    return instructions
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const step = item as RecipeInstructionStep;
        const stepNum =
          typeof step.step === 'number' && step.step > 0
            ? step.step
            : index + 1;
        const content =
          typeof step.content === 'string' ? step.content.trim() : '';
        if (!content) return null;
        return `${stepNum}. ${content}`;
      })
      .filter((line): line is string => line != null)
      .join(' ');
  }

  private async rollbackEmbedSubmittedBatch(
    batchId: string,
    errorMessage: string,
  ): Promise<number> {
    const jobs = await this.jobRepository.findByBatchId(
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
    const jobs = await this.jobRepository.findByBatchId(
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
        ...(!failed ? { batchId: undefined, submittedAt: undefined } : {}),
      },
    );
    return !!updated;
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
