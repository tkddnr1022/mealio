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
import {
  logIngestion,
  logIngestionError,
  RECIPE_INGESTION_LOG_EVENTS,
  type RecipeIngestionLoggingOptions,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-logger';
import { resolveRecipeIngestionTargetJobs } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.target';
import {
  findIngestionJobsByIds,
  transitionIngestionJobsByIds,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-status-transition';
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

export interface ParseSubmitOptions extends RecipeIngestionLoggingOptions {
  jobId?: string;
  runId?: string;
  runIdCount?: number;
  retryFailed?: boolean;
  retryFailedLimit?: number;
  force?: boolean;
}

export interface ParseSubmitResult {
  submittedCount: number;
  batchId?: string;
  skippedCount: number;
}

export interface ParseBatchJsonlRequestLine {
  custom_id: string;
  method: 'POST';
  url: '/v1/responses';
  body: {
    model: string;
    max_output_tokens: number;
    reasoning: { effort: 'minimal' | 'low' | 'medium' | 'high' };
    text: {
      format: { type: 'json_object' };
      verbosity: 'low' | 'medium' | 'high';
    };
    instructions: string;
    input: string;
  };
}

@Injectable()
export class ParseSubmitService {
  private readonly logger = new Logger(ParseSubmitService.name);
  private static readonly STAGE = 'parse-submit' as const;

  constructor(
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly categoryContextService: CategoryContextService,
    private readonly openAiBatchService: OpenAIBatchService,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async submit(options: ParseSubmitOptions = {}): Promise<ParseSubmitResult> {
    const startedAt = Date.now();
    const logBase = {
      stage: ParseSubmitService.STAGE,
      correlationId: options.correlationId,
    };

    logIngestion(this.logger, 'log', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_STARTED,
      ...logBase,
      runId: options.runId,
      jobId: options.jobId,
    });

    const retryFailedLimit = Math.max(
      1,
      options.retryFailedLimit ?? DEFAULT_RECIPE_RETRY_FAILED_LIMIT,
    );

    if (options.retryFailed) {
      const requeued =
        await this.jobRepository.requeueFailedToFetched(retryFailedLimit);
      if (requeued > 0) {
        logIngestion(this.logger, 'log', {
          event: RECIPE_INGESTION_LOG_EVENTS.STAGE_STARTED,
          ...logBase,
          count: requeued,
          message: 'Requeued failed jobs to fetched',
        });
      }
    }

    const fetchedJobs = await resolveRecipeIngestionTargetJobs(
      this.jobRepository,
      'fetched',
      options,
    );

    if (fetchedJobs.length === 0) {
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_NO_OP,
        outcome: 'no_op',
        ...logBase,
        message: 'No fetched jobs',
      });
      this.metrics.recordIngestionStage('parse-submit', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'parse-submit',
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

    const eligibleJobs = fetchedJobs.filter((job) => this.hasRawData(job));
    const baseSkippedCount = fetchedJobs.length - eligibleJobs.length;
    const jobsByRunId = this.groupEligibleJobsByRunId(eligibleJobs);
    const runIdMissingSkipped = eligibleJobs.length - jobsByRunId.totalJobs;
    const skippedCount = baseSkippedCount + runIdMissingSkipped;

    if (baseSkippedCount > 0) {
      logIngestion(this.logger, 'warn', {
        event: RECIPE_INGESTION_LOG_EVENTS.ROW_SKIPPED,
        ...logBase,
        count: baseSkippedCount,
        message: 'Jobs skipped due to missing rawData',
      });
    }
    if (runIdMissingSkipped > 0) {
      logIngestion(this.logger, 'warn', {
        event: RECIPE_INGESTION_LOG_EVENTS.ROW_SKIPPED,
        ...logBase,
        count: runIdMissingSkipped,
        message: 'Jobs skipped due to missing runId',
      });
    }

    if (eligibleJobs.length === 0 || jobsByRunId.groups.size === 0) {
      this.metrics.recordIngestionStage('parse-submit', 'skipped');
      this.metrics.observeIngestionStageLatency(
        'parse-submit',
        Date.now() - startedAt,
      );
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
        durationMs: Date.now() - startedAt,
        ...logBase,
        outcome: 'skipped',
        submittedCount: 0,
        skippedCount,
      });
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
          correlationId: options.correlationId,
          force: options.force,
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
    } catch (error) {
      this.metrics.recordIngestionStage('parse-submit', 'failed');
      this.metrics.observeIngestionStageLatency(
        'parse-submit',
        Date.now() - startedAt,
      );
      logIngestionError(
        this.logger,
        {
          event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
          outcome: 'failed',
          ...logBase,
          durationMs: Date.now() - startedAt,
        },
        error,
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
    correlationId?: string;
    force?: boolean;
  }): Promise<{ submittedCount: number; batchId?: string }> {
    const logBase = {
      stage: ParseSubmitService.STAGE,
      correlationId: params.correlationId,
      runId: params.runId,
    };
    const jobIds = params.jobs.map((job) => String(job._id));
    const lockedCount = await transitionIngestionJobsByIds(this.jobRepository, {
      ids: jobIds,
      fromStatus: 'fetched',
      toStatus: 'parse_submitting',
      force: params.force,
    });
    if (lockedCount === 0) {
      return { submittedCount: 0 };
    }

    const lockedJobs = await findIngestionJobsByIds(
      this.jobRepository,
      jobIds,
      'parse_submitting',
      params.force,
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
      const submittedCount = await transitionIngestionJobsByIds(
        this.jobRepository,
        {
          ids: lockedIds,
          fromStatus: 'parse_submitting',
          toStatus: 'parse_submitted',
          updates: {
            parseBatchId: batchId,
            parseSubmittedAt: new Date(),
            errorMessage: undefined,
          },
          force: params.force,
        },
      );
      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.BATCH_SUBMITTED,
        ...logBase,
        batchId,
        count: submittedCount,
        jobCount: lockedIds.length,
      });
      return { submittedCount, batchId };
    } catch (error) {
      const message =
        error instanceof OpenAIBatchError || error instanceof Error
          ? error.message
          : 'Batch submit failed';
      await this.jobRepository.rollbackSubmittingWithRetry(lockedIds, message);
      logIngestionError(
        this.logger,
        {
          event: RECIPE_INGESTION_LOG_EVENTS.BATCH_FAILED,
          ...logBase,
          count: lockedIds.length,
          message,
        },
        error,
      );
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
    url: '/v1/responses',
    body: {
      model,
      max_output_tokens: RECIPE_INGESTION_OPENAI_BATCH_MAX_TOKENS,
      reasoning: { effort: RECIPE_INGESTION_OPENAI_BATCH_REASONING_EFFORT },
      text: {
        format: { type: 'json_object' },
        verbosity: RECIPE_INGESTION_OPENAI_BATCH_VERBOSITY,
      },
      instructions: systemPrompt,
      input: JSON.stringify(job.rawData ?? {}),
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
