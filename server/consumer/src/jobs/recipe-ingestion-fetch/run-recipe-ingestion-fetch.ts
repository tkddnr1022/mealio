import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DEFAULT_RECIPE_FETCH_LIMIT,
  MAX_RECIPE_FETCH_LIMIT,
  generateCorrelationId,
  type ObservabilityConfig,
} from '@mealio/shared';
import { findUnknownCliArgs } from '../cli-args.util';
import { PublicDataFetchLimitError } from '../../integrations/public-data/public-data-api.client';
import {
  logRecipeIngestionCli,
  RECIPE_INGESTION_LOG_EVENTS,
} from '../recipe-ingestion/recipe-ingestion-logger';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from '../../reliability/monitoring/consumer-metrics.service';
import { pushCliMetrics } from '../../reliability/monitoring/metrics-push';
import { RecipeIngestionFetchModule } from './recipe-ingestion-fetch.module';
import { FetchService } from './services/fetch.service';

/**
 * Recipe ingestion fetch CLI (standalone job).
 *
 * Usage:
 *   pnpm --filter consumer run job:recipe-ingestion-fetch
 *   pnpm --filter consumer run job:recipe-ingestion-fetch --fetch-limit 100
 *
 * fetch → parse-submit 순서·빈도는 구현 레이어가 아닌 운영 레이어(cron/ECS)에서 조율한다.
 *
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §2.2, §5.1
 */
async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionFetchCLI');
  const correlationId = generateCorrelationId();
  const stage = 'fetch' as const;
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [{ name: '--fetch-limit', takesValue: true }],
  });
  if (unknownArgs.length > 0) {
    logRecipeIngestionCli(
      logger,
      'error',
      RECIPE_INGESTION_LOG_EVENTS.CLI_UNKNOWN_ARGS,
      stage,
      correlationId,
      { message: `Unknown CLI argument(s): ${unknownArgs.join(', ')}` },
    );
    return;
  }

  const fetchLimit = parseFetchLimit(args);

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionFetchModule,
    { logger: ['log', 'error', 'warn', 'debug'] },
  );

  try {
    const service = app.get(FetchService);
    logRecipeIngestionCli(
      logger,
      'log',
      RECIPE_INGESTION_LOG_EVENTS.CLI_STARTED,
      stage,
      correlationId,
      { fetchLimit },
    );
    const result = await service.fetch({ fetchLimit, correlationId });
    logRecipeIngestionCli(
      logger,
      'log',
      RECIPE_INGESTION_LOG_EVENTS.CLI_COMPLETED,
      stage,
      correlationId,
      {
        outcome: result.exhausted && result.fetchedCount === 0 ? 'no_op' : 'success',
        startIdx: result.startIdx,
        endIdx: result.endIdx,
        runId: result.runId,
        fetchedCount: result.fetchedCount,
        exhausted: result.exhausted,
      },
    );
  } finally {
    const metrics = app.get(ConsumerMetricsService);
    const obs = app.get<ObservabilityConfig>(OBSERVABILITY_CONFIG);
    await pushCliMetrics(metrics, obs.pushgatewayUrl, stage, logger);
    await app.close();
  }
}

function parseFetchLimit(args: string[]): number {
  const flagIdx = args.indexOf('--fetch-limit');
  if (flagIdx === -1) {
    return DEFAULT_RECIPE_FETCH_LIMIT;
  }

  const raw = args[flagIdx + 1];
  const parsed = parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new PublicDataFetchLimitError(
      `--fetch-limit must be a positive integer, received "${raw ?? ''}"`,
    );
  }
  if (parsed > MAX_RECIPE_FETCH_LIMIT) {
    throw new PublicDataFetchLimitError(
      `--fetch-limit (${parsed}) exceeds maximum ${MAX_RECIPE_FETCH_LIMIT} (ERROR-336)`,
    );
  }
  return parsed;
}

void main();
