import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionTargetCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import { RecipeIngestionSubmitModule } from './recipe-ingestion-submit.module';
import {
  SubmitJobIdError,
  SubmitRetryFailedLimitError,
  SubmitRunIdError,
  SubmitService,
} from './services/submit.service';

/**
 * Recipe ingestion submit CLI (standalone job).
 *
 * Usage:
 *   pnpm --filter consumer run job:recipe-ingestion-submit
 *   pnpm --filter consumer run job:recipe-ingestion-submit --run-id <runId>
 *   pnpm --filter consumer run job:recipe-ingestion-submit --run-id-count 2
 *   pnpm --filter consumer run job:recipe-ingestion-submit --job-id <jobId>
 *
 * fetch → submit 순서·빈도는 구현 레이어가 아닌 운영 레이어(cron/ECS)에서 조율한다.
 *
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §2.2, §5.2
 */
async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionSubmitCLI');
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [
      { name: '--run-id', takesValue: true },
      { name: '--run-id-count', takesValue: true },
      { name: '--job-id', takesValue: true },
      { name: '--retry-failed' },
      { name: '--retry-failed-limit', takesValue: true },
    ],
  });
  if (unknownArgs.length > 0) {
    logger.error(`Unknown CLI argument(s): ${unknownArgs.join(', ')}`);
    return;
  }

  const target = parseRecipeIngestionTargetCliArgs(args, (message) => {
    if (message.startsWith('--job-id')) {
      return new SubmitJobIdError(message);
    }
    return new SubmitRunIdError(message);
  });
  const retryFailed = args.includes('--retry-failed');
  const retryFailedLimit = parseRetryFailedLimit(args);

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionSubmitModule,
    { logger: ['log', 'error', 'warn'] },
  );

  try {
    const service = app.get(SubmitService);
    logger.log(
      `Starting submit jobId=${target.jobId ?? 'n/a'} runId=${target.runId ?? 'n/a'} runIdCount=${target.runIdCount ?? 'n/a'} retryFailed=${retryFailed} retryFailedLimit=${retryFailedLimit}`,
    );
    const result = await service.submit({
      ...target,
      retryFailed,
      retryFailedLimit,
    });
    logger.log(
      `Submit complete submittedCount=${result.submittedCount} batchId=${result.batchId ?? 'n/a'} skippedCount=${result.skippedCount}`,
    );
  } finally {
    await app.close();
  }
}

function parseRetryFailedLimit(args: string[]): number {
  const flagIdx = args.indexOf('--retry-failed-limit');
  if (flagIdx === -1) {
    return 100;
  }
  const raw = args[flagIdx + 1];
  const parsed = parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new SubmitRetryFailedLimitError(
      `--retry-failed-limit must be a positive integer, received "${raw ?? ''}"`,
    );
  }
  return parsed;
}

void main();
