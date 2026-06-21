import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_RECIPE_RETRY_FAILED_LIMIT,
  type RecipeIngestionJobDocument,
} from '@mealio/shared';
import {
  OpenAIBatchError,
  OpenAIBatchService,
} from 'src/integrations/openai/openai-batch.service';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';
import {
  resolveRecipeIngestionTargetJobs,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-run.target';
import { CategoryContextService } from './category-context.service';
import { buildRecipeIngestionSystemPrompt } from '../prompts/recipe-ingestion.system-prompt';
import {
  RECIPE_INGESTION_OPENAI_BATCH_MAX_TOKENS,
  RECIPE_INGESTION_OPENAI_BATCH_REASONING_EFFORT,
  RECIPE_INGESTION_OPENAI_BATCH_VERBOSITY,
} from '@mealio/shared';

export class SubmitRunIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmitRunIdError';
  }
}

export class SubmitRetryFailedLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmitRetryFailedLimitError';
  }
}

export class SubmitJobIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmitJobIdError';
  }
}

export interface SubmitOptions {
  jobId?: string;
  runId?: string;
  runIdCount?: number;
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
    const retryFailedLimit = Math.max(
      1,
      options.retryFailedLimit ?? DEFAULT_RECIPE_RETRY_FAILED_LIMIT,
    );

    if (options.retryFailed) {
      const requeued =
        await this.jobRepository.requeueFailedToFetched(retryFailedLimit);
      if (requeued > 0) {
        this.logger.log(`Requeued failed jobs count=${requeued}`);
      }
    }

    const fetchedJobs = await resolveRecipeIngestionTargetJobs(
      this.jobRepository,
      'fetched',
      options,
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
    const baseSkippedCount = fetchedJobs.length - eligibleJobs.length;
    const jobsByRunId = this.groupEligibleJobsByRunId(eligibleJobs);
    const runIdMissingSkipped = eligibleJobs.length - jobsByRunId.totalJobs;
    const skippedCount = baseSkippedCount + runIdMissingSkipped;

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

    if (jobsByRunId.groups.size === 0) {
      this.logger.warn(
        `All ${eligibleJobs.length} fetched jobs missing runId — no-op exit`,
      );
      this.metrics.recordIngestionStage('submit', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'submit',
        Date.now() - startedAt,
      );
      return { submittedCount: 0, skippedCount };
    }

    try {
      const categories = await this.categoryContextService.getCategoryContext();
      const systemPrompt = buildRecipeIngestionSystemPrompt(categories);
      const model = this.openAiBatchService.getBatchModel();
      let submittedCount = 0;
      const submittedBatchIds: string[] = [];

      for (const [runId, jobs] of jobsByRunId.groups.entries()) {
        const groupResult = await this.submitRunGroup({
          runId,
          jobs,
          systemPrompt,
          model,
        });
        submittedCount += groupResult.submittedCount;
        if (groupResult.batchId) {
          submittedBatchIds.push(groupResult.batchId);
        }
      }

      this.logger.log(
        `Submitted ${submittedCount} jobs batches=${submittedBatchIds.length} skipped=${skippedCount}`,
      );
      if (submittedCount > 0) {
        this.metrics.recordIngestionStage('submit', 'success', submittedCount);
      } else {
        this.metrics.recordIngestionStage('submit', 'skipped');
      }
      this.metrics.observeIngestionStageLatency(
        'submit',
        Date.now() - startedAt,
      );

      return {
        submittedCount,
        batchId: submittedBatchIds.length === 1 ? submittedBatchIds[0] : undefined,
        skippedCount,
      };
    } catch (error) {
      this.metrics.recordIngestionStage('submit', 'failed');
      this.metrics.observeIngestionStageLatency(
        'submit',
        Date.now() - startedAt,
      );
      throw error;
    }
  }

  private hasRawData(job: RecipeIngestionJobDocument): boolean {
    return (
      job.rawData !== undefined &&
      job.rawData !== null &&
      typeof job.rawData === 'object'
    );
  }

  private hasRunId(job: RecipeIngestionJobDocument): job is RecipeIngestionJobDocument & {
    runId: string;
  } {
    return typeof job.runId === 'string' && job.runId.length > 0;
  }

  private groupEligibleJobsByRunId(jobs: RecipeIngestionJobDocument[]): {
    groups: Map<string, RecipeIngestionJobDocument[]>;
    totalJobs: number;
  } {
    const groups = new Map<string, RecipeIngestionJobDocument[]>();
    let totalJobs = 0;

    for (const job of jobs) {
      if (!this.hasRunId(job)) {
        continue;
      }
      totalJobs++;
      const group = groups.get(job.runId);
      if (group) {
        group.push(job);
      } else {
        groups.set(job.runId, [job]);
      }
    }

    return { groups, totalJobs };
  }

  private async submitRunGroup(params: {
    runId: string;
    jobs: RecipeIngestionJobDocument[];
    systemPrompt: string;
    model: string;
  }): Promise<{ submittedCount: number; batchId?: string }> {
    const jobIds = params.jobs.map((job) => String(job._id));
    const lockedCount = await this.jobRepository.transitionManyByIds(
      jobIds,
      'fetched',
      'submitting',
    );

    if (lockedCount === 0) {
      this.logger.warn(
        `runId=${params.runId} no jobs transitioned to submitting — concurrent run?`,
      );
      return { submittedCount: 0 };
    }

    const lockedJobs = await this.jobRepository.findManyByIdsAndStatus(
      jobIds,
      'submitting',
    );
    const lockedIds = lockedJobs.map((job) => String(job._id));
    const jsonlContent = buildBatchJsonlContent(
      lockedJobs,
      params.systemPrompt,
      params.model,
    );

    try {
      const { batchId } =
        await this.openAiBatchService.submitBatchJsonl(jsonlContent);
      const submittedCount = await this.jobRepository.transitionManyByIds(
        lockedIds,
        'submitting',
        'submitted',
        {
          batchId,
          submittedAt: new Date(),
          errorMessage: undefined,
        },
      );
      this.logger.log(
        `runId=${params.runId} submitted=${submittedCount} batchId=${batchId}`,
      );
      return { submittedCount, batchId };
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
        `runId=${params.runId} batch submit failed, rolledBack=${rolledBack}: ${message}`,
      );
      throw error;
    }
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
      max_completion_tokens: RECIPE_INGESTION_OPENAI_BATCH_MAX_TOKENS,
      reasoning_effort: RECIPE_INGESTION_OPENAI_BATCH_REASONING_EFFORT,
      verbosity: RECIPE_INGESTION_OPENAI_BATCH_VERBOSITY,
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
