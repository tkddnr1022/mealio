import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_RECIPE_FETCH_LIMIT,
  KAFKA_TOPICS,
  MAX_RECIPE_FETCH_LIMIT,
  MAX_RECIPE_INGESTION_RETRY_COUNT,
  RECIPE_INGESTION_RETRY_BASE_DELAY_MS,
} from '@mealio/shared';
import {
  createRecipeIngestionRunTriggerPayload,
  recipeIngestionRunTriggerKey,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload';
import {
  logIngestion,
  logIngestionError,
  RECIPE_INGESTION_LOG_EVENTS,
  type RecipeIngestionLoggingOptions,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-logger';
import { randomUUID } from 'node:crypto';
import {
  PublicDataApiClient,
  PublicDataApiError,
  PublicDataFetchLimitError,
} from 'src/integrations/public-data/public-data-api.client';
import { KafkaProducerService } from 'src/integrations/kafka/kafka-producer.service';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeIngestionStateRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-state.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';

export interface FetchOptions extends RecipeIngestionLoggingOptions {
  fetchLimit?: number;
  maxApiRetries?: number;
}

export interface FetchResult {
  startIdx: number;
  endIdx: number;
  runId?: string;
  fetchedCount: number;
  exhausted: boolean;
}

/**
 * 공공데이터 API fetch — recipe_ingestion_jobs에 status: fetched 적재.
 * parse-submit·parse-retrieve와 결합하지 않는 standalone 단계.
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §5.1
 */
@Injectable()
export class FetchService {
  private readonly logger = new Logger(FetchService.name);
  private static readonly STAGE = 'fetch' as const;

  constructor(
    private readonly publicDataApiClient: PublicDataApiClient,
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly stateRepository: RecipeIngestionStateRepository,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly metrics: ConsumerMetricsService,
  ) {}

  async fetch(options: FetchOptions = {}): Promise<FetchResult> {
    const startedAt = Date.now();
    const logBase = {
      stage: FetchService.STAGE,
      correlationId: options.correlationId,
    };

    logIngestion(this.logger, 'log', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_STARTED,
      ...logBase,
    });

    try {
      const fetchLimit = this.resolveFetchLimit(options.fetchLimit);
      const maxApiRetries =
        options.maxApiRetries ?? MAX_RECIPE_INGESTION_RETRY_COUNT;

      const lastEndIdx = await this.stateRepository.getLastEndIdx();
      const startIdx = lastEndIdx + 1;
      const endIdx = startIdx + fetchLimit - 1;

      this.publicDataApiClient.assertFetchRangeValid(
        startIdx,
        endIdx,
        fetchLimit,
      );

      const response = await this.fetchWithRetry(
        startIdx,
        endIdx,
        maxApiRetries,
        options.correlationId,
      );

      if (response.kind === 'empty') {
        logIngestion(this.logger, 'log', {
          event: RECIPE_INGESTION_LOG_EVENTS.STAGE_NO_OP,
          outcome: 'no_op',
          ...logBase,
          startIdx,
          endIdx,
          message: 'No more recipes (INFO-200)',
        });
        this.metrics.recordIngestionStage('fetch', 'skipped');
        this.metrics.observeIngestionStageLatency(
          'fetch',
          Date.now() - startedAt,
        );
        logIngestion(this.logger, 'log', {
          event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
          durationMs: Date.now() - startedAt,
          ...logBase,
          outcome: 'no_op',
          startIdx,
          endIdx,
          fetchedCount: 0,
          exhausted: true,
        });
        return {
          startIdx,
          endIdx,
          fetchedCount: 0,
          exhausted: true,
        };
      }

      const runId = randomUUID();
      let fetchedCount = 0;
      let rowSkippedCount = 0;
      let upsertFailedCount = 0;

      for (const row of response.rows) {
        const sourceId = this.extractSourceId(row);
        if (!sourceId) {
          rowSkippedCount++;
          logIngestion(this.logger, 'warn', {
            event: RECIPE_INGESTION_LOG_EVENTS.ROW_SKIPPED,
            ...logBase,
            runId,
            message: 'Skipping row without RCP_SEQ',
          });
          continue;
        }

        try {
          await this.jobRepository.upsertFetched(sourceId, row, runId);
          fetchedCount++;
        } catch (error) {
          upsertFailedCount++;
          const message =
            error instanceof Error ? error.message : 'Unknown fetch error';
          await this.jobRepository.recordFetchFailure(sourceId, message);
          logIngestion(this.logger, 'warn', {
            event: RECIPE_INGESTION_LOG_EVENTS.ROW_SKIPPED,
            ...logBase,
            runId,
            sourceRecipeId: sourceId,
            message,
          });
        }
      }

      await this.stateRepository.setLastEndIdx(endIdx);
      if (fetchedCount > 0) {
        await this.emitFetchCompletedTrigger({
          runId,
          fetchedCount,
          correlationId: options.correlationId,
        });
      }
      this.metrics.recordIngestionStage('fetch', 'success', fetchedCount);
      this.metrics.observeIngestionStageLatency(
        'fetch',
        Date.now() - startedAt,
      );

      logIngestion(this.logger, 'log', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
        durationMs: Date.now() - startedAt,
        ...logBase,
        outcome: 'success',
        runId,
        startIdx,
        endIdx,
        fetchedCount,
        rowSkippedCount,
        upsertFailedCount,
        exhausted: false,
      });

      return {
        startIdx,
        endIdx,
        runId,
        fetchedCount,
        exhausted: false,
      };
    } catch (error) {
      this.metrics.recordIngestionStage('fetch', 'failed');
      this.metrics.observeIngestionStageLatency(
        'fetch',
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

  private resolveFetchLimit(limit?: number): number {
    const resolved = limit ?? DEFAULT_RECIPE_FETCH_LIMIT;
    if (resolved < 1) {
      throw new PublicDataFetchLimitError(
        `fetchLimit must be >= 1, received ${resolved}`,
      );
    }
    if (resolved > MAX_RECIPE_FETCH_LIMIT) {
      throw new PublicDataFetchLimitError(
        `fetchLimit (${resolved}) exceeds maximum ${MAX_RECIPE_FETCH_LIMIT} (ERROR-336)`,
      );
    }
    return resolved;
  }

  private extractSourceId(row: Record<string, unknown>): number | null {
    const value = row.RCP_SEQ;
    if (value === undefined || value === null || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') {
        return null;
      }
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private async fetchWithRetry(
    startIdx: number,
    endIdx: number,
    maxAttempts: number,
    correlationId?: string,
  ) {
    let lastError: PublicDataApiError | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.publicDataApiClient.fetchRecipes(startIdx, endIdx);
      } catch (error) {
        if (!(error instanceof PublicDataApiError)) {
          throw error;
        }
        lastError = error;

        if (!error.recoverable || attempt >= maxAttempts) {
          throw error;
        }

        const delayMs =
          RECIPE_INGESTION_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
        logIngestion(this.logger, 'warn', {
          event: RECIPE_INGESTION_LOG_EVENTS.DEGRADED,
          stage: FetchService.STAGE,
          correlationId,
          startIdx,
          endIdx,
          apiErrorCode: error.code,
          attempt,
          maxAttempts,
          delayMs,
          message: 'Recoverable API error, retrying',
        });
        await this.sleep(delayMs);
      }
    }

    throw (
      lastError ??
      new PublicDataApiError('UNKNOWN', 'Recipe fetch failed', false)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async emitFetchCompletedTrigger(params: {
    runId: string;
    fetchedCount: number;
    correlationId?: string;
  }): Promise<void> {
    const payload = createRecipeIngestionRunTriggerPayload(params);
    const key = recipeIngestionRunTriggerKey(params.runId);

    try {
      await this.kafkaProducerService.emit(
        KAFKA_TOPICS.RECIPE_INGESTION_PARSE_SUBMIT_TRIGGERED,
        payload,
        key,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Fetch completed trigger publish failed';
      logIngestion(this.logger, 'warn', {
        event: RECIPE_INGESTION_LOG_EVENTS.TRIGGER_PUBLISH_FAILED,
        stage: FetchService.STAGE,
        correlationId: params.correlationId,
        runId: params.runId,
        topic: KAFKA_TOPICS.RECIPE_INGESTION_PARSE_SUBMIT_TRIGGERED,
        message,
      });
    }
  }
}
