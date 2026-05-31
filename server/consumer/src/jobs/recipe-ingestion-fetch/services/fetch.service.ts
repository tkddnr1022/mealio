import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_RECIPE_FETCH_LIMIT,
  MAX_RECIPE_FETCH_LIMIT,
} from '@mealio/shared';
import {
  PublicDataApiClient,
  PublicDataApiError,
  PublicDataFetchLimitError,
} from 'src/integrations/public-data/public-data-api.client';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeIngestionStateRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-state.repository';

export interface FetchOptions {
  fetchLimit?: number;
  maxApiRetries?: number;
}

export interface FetchResult {
  startIdx: number;
  endIdx: number;
  fetchedCount: number;
  exhausted: boolean;
}

const DEFAULT_MAX_API_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;

/**
 * 공공데이터 API fetch — recipe_ingestion_jobs에 status: fetched 적재.
 * submit·retrieve와 결합하지 않는 standalone 단계.
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §5.1
 */
@Injectable()
export class FetchService {
  private readonly logger = new Logger(FetchService.name);

  constructor(
    private readonly publicDataApiClient: PublicDataApiClient,
    private readonly jobRepository: RecipeIngestionJobRepository,
    private readonly stateRepository: RecipeIngestionStateRepository,
  ) {}

  async fetch(options: FetchOptions = {}): Promise<FetchResult> {
    const fetchLimit = this.resolveFetchLimit(options.fetchLimit);
    const maxApiRetries = options.maxApiRetries ?? DEFAULT_MAX_API_RETRIES;

    const lastEndIdx = await this.stateRepository.getLastEndIdx();
    const startIdx = lastEndIdx + 1;
    const endIdx = startIdx + fetchLimit - 1;

    this.publicDataApiClient.assertFetchRangeValid(
      startIdx,
      endIdx,
      fetchLimit,
    );

    const response = await this.fetchWithRetry(startIdx, endIdx, maxApiRetries);

    if (response.kind === 'empty') {
      this.logger.log(
        `No more recipes (INFO-200) startIdx=${startIdx} endIdx=${endIdx}`,
      );
      return {
        startIdx,
        endIdx,
        fetchedCount: 0,
        exhausted: true,
      };
    }

    let fetchedCount = 0;
    for (const row of response.rows) {
      const sourceId = this.extractSourceId(row);
      if (!sourceId) {
        this.logger.warn('Skipping row without RCP_SEQ');
        continue;
      }

      try {
        await this.jobRepository.upsertFetched(sourceId, row);
        fetchedCount++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown fetch error';
        await this.jobRepository.recordFetchFailure(sourceId, message);
        this.logger.warn(`Failed to upsert sourceId=${sourceId}: ${message}`);
      }
    }

    await this.stateRepository.setLastEndIdx(endIdx);
    this.logger.log(
      `Fetched ${fetchedCount} recipes startIdx=${startIdx} endIdx=${endIdx}`,
    );

    return {
      startIdx,
      endIdx,
      fetchedCount,
      exhausted: false,
    };
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

        const delayMs = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
        this.logger.warn(
          `Recoverable API error code=${error.code} attempt=${attempt}/${maxAttempts}, retrying in ${delayMs}ms`,
        );
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
}
