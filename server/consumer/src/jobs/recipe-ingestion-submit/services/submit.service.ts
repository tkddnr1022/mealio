import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_RECIPE_SUBMIT_BATCH_SIZE,
  MAX_RECIPE_SUBMIT_BATCH_SIZE,
  type RecipeIngestionJobDocument,
} from '@mealio/shared';
import {
  OpenAIBatchError,
  OpenAIBatchService,
} from 'src/integrations/openai/openai-batch.service';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';
import { CategoryContextService } from './category-context.service';
import { buildRecipeIngestionSystemPrompt } from '../prompts/recipe-ingestion.system-prompt';

export class SubmitBatchSizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmitBatchSizeError';
  }
}

export interface SubmitOptions {
  submitBatchSize?: number;
  retryFailed?: boolean;
  retryFailedLimit?: number;
}

export interface SubmitResult {
  submittedCount: number;
  batchId?: string;
  skippedCount: number;
}

/** OpenAI Batch JSONL 한 줄 요청 형식 */
export interface BatchJsonlRequestLine {
  custom_id: string;
  method: 'POST';
  url: '/v1/chat/completions';
  body: {
    model: string;
    max_completion_tokens: number;
    reasoning_effort: 'minimal' | 'low' | 'medium' | 'high';
    verbosity: 'low' | 'medium' | 'high';
    response_format: { type: 'json_object' };
    messages: Array<{ role: 'system' | 'user'; content: string }>;
  };
}

const BATCH_MAX_TOKENS = 8192;
const BATCH_REASONING_EFFORT = 'low' as const;
const BATCH_VERBOSITY = 'low' as const;

/**
 * OpenAI Batch 제출 — fetched job을 JSONL로 변환해 Batch API에 제출한다.
 * FetchService를 호출하지 않는 standalone 단계.
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §5.2
 */
@Injectable()
export class SubmitService {
  private readonly logger = new Logger(SubmitService.name);

  constructor(
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly categoryContextService: CategoryContextService,
    private readonly openAiBatchService: OpenAIBatchService,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async submit(options: SubmitOptions = {}): Promise<SubmitResult> {
    const startedAt = Date.now();
    const submitBatchSize = this.resolveSubmitBatchSize(
      options.submitBatchSize,
    );
    const retryFailedLimit = Math.max(1, options.retryFailedLimit ?? 100);

    if (options.retryFailed) {
      const requeued =
        await this.jobRepository.requeueFailedToFetched(retryFailedLimit);
      if (requeued > 0) {
        this.logger.log(`Requeued failed jobs count=${requeued}`);
      }
    }

    const fetchedJobs = await this.jobRepository.findByStatus(
      'fetched',
      submitBatchSize,
    );

    if (fetchedJobs.length === 0) {
      this.logger.log('No fetched jobs — no-op exit');
      this.metrics.recordIngestionStage('submit', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'submit',
        Date.now() - startedAt,
      );
      return { submittedCount: 0, skippedCount: 0 };
    }

    const eligibleJobs = fetchedJobs.filter((job) => this.hasRawData(job));
    const skippedCount = fetchedJobs.length - eligibleJobs.length;

    if (eligibleJobs.length === 0) {
      this.logger.warn(
        `All ${fetchedJobs.length} fetched jobs missing rawData — no-op exit`,
      );
      this.metrics.recordIngestionStage('submit', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'submit',
        Date.now() - startedAt,
      );
      return { submittedCount: 0, skippedCount };
    }

    const jobIds = eligibleJobs.map((job) => String(job._id));

    const lockedCount = await this.jobRepository.transitionManyByIds(
      jobIds,
      'fetched',
      'submitting',
    );

    if (lockedCount === 0) {
      this.logger.warn('No jobs transitioned to submitting — concurrent run?');
      this.metrics.recordIngestionStage('submit', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'submit',
        Date.now() - startedAt,
      );
      return { submittedCount: 0, skippedCount };
    }

    const lockedJobs = await this.jobRepository.findManyByIdsAndStatus(
      jobIds,
      'submitting',
    );
    const lockedIds = lockedJobs.map((job) => String(job._id));

    try {
      const categories = await this.categoryContextService.getCategoryContext();
      const systemPrompt = buildRecipeIngestionSystemPrompt(categories);
      const model = this.openAiBatchService.getBatchModel();

      const jsonlContent = buildBatchJsonlContent(
        lockedJobs,
        systemPrompt,
        model,
      );

      const { batchId } =
        await this.openAiBatchService.submitBatchJsonl(jsonlContent);

      const now = new Date();
      const submittedCount = await this.jobRepository.transitionManyByIds(
        lockedIds,
        'submitting',
        'submitted',
        {
          batchId,
          submittedAt: now,
          errorMessage: undefined,
        },
      );

      this.logger.log(
        `Submitted ${submittedCount} jobs batchId=${batchId} skipped=${skippedCount}`,
      );
      this.metrics.recordIngestionStage('submit', 'success', submittedCount);
      this.metrics.observeIngestionStageLatency(
        'submit',
        Date.now() - startedAt,
      );

      return {
        submittedCount,
        batchId,
        skippedCount,
      };
    } catch (error) {
      const message =
        error instanceof OpenAIBatchError || error instanceof Error
          ? error.message
          : 'Batch submit failed';

      const rolledBack = await this.jobRepository.rollbackSubmittingWithRetry(
        lockedIds,
        message,
      );

      this.logger.error(
        `Batch submit failed, rolled back ${rolledBack} jobs: ${message}`,
      );
      this.metrics.recordIngestionStage('submit', 'failed');
      this.metrics.observeIngestionStageLatency(
        'submit',
        Date.now() - startedAt,
      );
      throw error;
    }
  }

  private resolveSubmitBatchSize(size?: number): number {
    const resolved = size ?? DEFAULT_RECIPE_SUBMIT_BATCH_SIZE;
    if (resolved < 1) {
      throw new SubmitBatchSizeError(
        `submitBatchSize must be >= 1, received ${resolved}`,
      );
    }
    if (resolved > MAX_RECIPE_SUBMIT_BATCH_SIZE) {
      throw new SubmitBatchSizeError(
        `submitBatchSize (${resolved}) exceeds maximum ${MAX_RECIPE_SUBMIT_BATCH_SIZE}`,
      );
    }
    return resolved;
  }

  private hasRawData(job: RecipeIngestionJobDocument): boolean {
    return (
      job.rawData !== undefined &&
      job.rawData !== null &&
      typeof job.rawData === 'object'
    );
  }
}

/** 테스트·검증용 JSONL 생성 (한 job → 한 라인) */
export function buildBatchJsonlLine(
  job: Pick<RecipeIngestionJobDocument, '_id' | 'rawData'>,
  systemPrompt: string,
  model: string,
): BatchJsonlRequestLine {
  return {
    custom_id: String(job._id),
    method: 'POST',
    url: '/v1/chat/completions',
    body: {
      model,
      max_completion_tokens: BATCH_MAX_TOKENS,
      reasoning_effort: BATCH_REASONING_EFFORT,
      verbosity: BATCH_VERBOSITY,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: JSON.stringify(job.rawData ?? {}),
        },
      ],
    },
  };
}

export function buildBatchJsonlContent(
  jobs: Array<Pick<RecipeIngestionJobDocument, '_id' | 'rawData'>>,
  systemPrompt: string,
  model: string,
): string {
  return jobs
    .map((job) => JSON.stringify(buildBatchJsonlLine(job, systemPrompt, model)))
    .join('\n');
}
