import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_RECIPE_RETRY_FAILED_LIMIT,
  RECIPE_INGESTION_OPENAI_BATCH_MAX_TOKENS,
  RECIPE_INGESTION_OPENAI_BATCH_REASONING_EFFORT,
  RECIPE_INGESTION_OPENAI_BATCH_VERBOSITY,
  type RecipeIngestionJobDocument,
} from '@mealio/shared';
import {
  OpenAIBatchError,
  OpenAIBatchService,
} from 'src/integrations/openai/openai-batch.service';
import { resolveRecipeIngestionTargetJobs } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.target';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';
import { buildRecipeIngestionSystemPrompt } from '../prompts/recipe-ingestion.system-prompt';
import { CategoryContextService } from './category-context.service';

export class ParseSubmitRunIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseSubmitRunIdError';
  }
}

export class ParseSubmitRetryFailedLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseSubmitRetryFailedLimitError';
  }
}

export class ParseSubmitJobIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseSubmitJobIdError';
  }
}

export interface ParseSubmitOptions {
  jobId?: string;
  runId?: string;
  runIdCount?: number;
  retryFailed?: boolean;
  retryFailedLimit?: number;
}

export interface ParseSubmitResult {
  submittedCount: number;
  batchId?: string;
  skippedCount: number;
}

export interface ParseBatchJsonlRequestLine {
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

@Injectable()
export class ParseSubmitService {
  private readonly logger = new Logger(ParseSubmitService.name);

  constructor(
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly categoryContextService: CategoryContextService,
    private readonly openAiBatchService: OpenAIBatchService,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async submit(options: ParseSubmitOptions = {}): Promise<ParseSubmitResult> {
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
      this.metrics.recordIngestionStage('parse-submit', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'parse-submit',
        Date.now() - startedAt,
      );
      return { submittedCount: 0, skippedCount: 0 };
    }

    const eligibleJobs = fetchedJobs.filter((job) => this.hasRawData(job));
    const baseSkippedCount = fetchedJobs.length - eligibleJobs.length;
    const jobsByRunId = this.groupEligibleJobsByRunId(eligibleJobs);
    const runIdMissingSkipped = eligibleJobs.length - jobsByRunId.totalJobs;
    const skippedCount = baseSkippedCount + runIdMissingSkipped;

    if (eligibleJobs.length === 0 || jobsByRunId.groups.size === 0) {
      this.metrics.recordIngestionStage('parse-submit', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'parse-submit',
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

      if (submittedCount > 0) {
        this.metrics.recordIngestionStage(
          'parse-submit',
          'success',
          submittedCount,
        );
      } else {
        this.metrics.recordIngestionStage('parse-submit', 'skipped');
      }
      this.metrics.observeIngestionStageLatency(
        'parse-submit',
        Date.now() - startedAt,
      );

      return {
        submittedCount,
        batchId:
          submittedBatchIds.length === 1 ? submittedBatchIds[0] : undefined,
        skippedCount,
      };
    } catch (error) {
      this.metrics.recordIngestionStage('parse-submit', 'failed');
      this.metrics.observeIngestionStageLatency(
        'parse-submit',
        Date.now() - startedAt,
      );
      throw error;
    }
  }

  private hasRawData(job: RecipeIngestionJobDocument): boolean {
    return !!job.rawData && typeof job.rawData === 'object';
  }

  private hasRunId(
    job: RecipeIngestionJobDocument,
  ): job is RecipeIngestionJobDocument & { runId: string } {
    return typeof job.runId === 'string' && job.runId.length > 0;
  }

  private groupEligibleJobsByRunId(jobs: RecipeIngestionJobDocument[]): {
    groups: Map<string, RecipeIngestionJobDocument[]>;
    totalJobs: number;
  } {
    const groups = new Map<string, RecipeIngestionJobDocument[]>();
    let totalJobs = 0;

    for (const job of jobs) {
      if (!this.hasRunId(job)) continue;
      totalJobs++;
      const group = groups.get(job.runId);
      if (group) group.push(job);
      else groups.set(job.runId, [job]);
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
      'parse_submitting',
    );
    if (lockedCount === 0) {
      return { submittedCount: 0 };
    }

    const lockedJobs = await this.jobRepository.findManyByIdsAndStatus(
      jobIds,
      'parse_submitting',
    );
    const lockedIds = lockedJobs.map((job) => String(job._id));
    const jsonlContent = buildParseBatchJsonlContent(
      lockedJobs,
      params.systemPrompt,
      params.model,
    );

    try {
      const { batchId } =
        await this.openAiBatchService.submitBatchJsonl(jsonlContent);
      const submittedCount = await this.jobRepository.transitionManyByIds(
        lockedIds,
        'parse_submitting',
        'parse_submitted',
        {
          batchId,
          submittedAt: new Date(),
          errorMessage: undefined,
        },
      );
      return { submittedCount, batchId };
    } catch (error) {
      const message =
        error instanceof OpenAIBatchError || error instanceof Error
          ? error.message
          : 'Batch submit failed';
      await this.jobRepository.rollbackSubmittingWithRetry(lockedIds, message);
      throw error;
    }
  }
}

export function buildParseBatchJsonlLine(
  job: Pick<RecipeIngestionJobDocument, '_id' | 'rawData'>,
  systemPrompt: string,
  model: string,
): ParseBatchJsonlRequestLine {
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
        { role: 'user', content: JSON.stringify(job.rawData ?? {}) },
      ],
    },
  };
}

export function buildParseBatchJsonlContent(
  jobs: Array<Pick<RecipeIngestionJobDocument, '_id' | 'rawData'>>,
  systemPrompt: string,
  model: string,
): string {
  return jobs
    .map((job) =>
      JSON.stringify(buildParseBatchJsonlLine(job, systemPrompt, model)),
    )
    .join('\n');
}
