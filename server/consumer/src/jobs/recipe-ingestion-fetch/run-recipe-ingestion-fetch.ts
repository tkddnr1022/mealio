import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DEFAULT_RECIPE_FETCH_LIMIT,
  MAX_RECIPE_FETCH_LIMIT,
} from '@mealio/shared';
import { findUnknownCliArgs } from '../cli-args.util';
import { PublicDataFetchLimitError } from '../../integrations/public-data/public-data-api.client';
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
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [{ name: '--fetch-limit', takesValue: true }],
  });
  if (unknownArgs.length > 0) {
    logger.error(`Unknown CLI argument(s): ${unknownArgs.join(', ')}`);
    return;
  }

  const fetchLimit = parseFetchLimit(args);

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionFetchModule,
    { logger: ['log', 'error', 'warn'] },
  );

  try {
    const service = app.get(FetchService);
    logger.log(`Starting fetch fetchLimit=${fetchLimit}`);
    const result = await service.fetch({ fetchLimit });
    logger.log(
      `Fetch complete startIdx=${result.startIdx} endIdx=${result.endIdx} runId=${result.runId ?? 'n/a'} fetchedCount=${result.fetchedCount} exhausted=${result.exhausted}`,
    );
  } finally {
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
