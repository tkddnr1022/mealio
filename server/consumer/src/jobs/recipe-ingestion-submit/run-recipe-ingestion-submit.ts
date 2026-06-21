import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DEFAULT_RECIPE_SUBMIT_BATCH_SIZE } from '@mealio/shared';
import { findUnknownCliArgs } from '../cli-args.util';
import { RecipeIngestionSubmitModule } from './recipe-ingestion-submit.module';
import {
  SubmitBatchSizeError,
  SubmitIndexRangeError,
  SubmitService,
} from './services/submit.service';

/**
 * Recipe ingestion submit CLI (standalone job).
 *
 * Usage:
 *   pnpm --filter consumer run job:recipe-ingestion-submit
 *   pnpm --filter consumer run job:recipe-ingestion-submit --submit-batch-size 50
 *   pnpm --filter consumer run job:recipe-ingestion-submit --start-source-id 1 --end-source-id 100
 *   pnpm --filter consumer run job:recipe-ingestion-submit --start-source-id 1
 *   pnpm --filter consumer run job:recipe-ingestion-submit --end-source-id 100
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
      { name: '--submit-batch-size', takesValue: true },
      { name: '--start-source-id', takesValue: true },
      { name: '--end-source-id', takesValue: true },
      { name: '--retry-failed' },
      { name: '--retry-failed-limit', takesValue: true },
    ],
  });
  if (unknownArgs.length > 0) {
    logger.error(`Unknown CLI argument(s): ${unknownArgs.join(', ')}`);
    return;
  }

  const submitBatchSize = parseSubmitBatchSize(args);
  const { startSourceId, endSourceId } = parseSourceIdRange(args);
  const retryFailed = args.includes('--retry-failed');
  const retryFailedLimit = parseRetryFailedLimit(args);

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionSubmitModule,
    { logger: ['log', 'error', 'warn'] },
  );

  try {
    const service = app.get(SubmitService);
    logger.log(
      `Starting submit submitBatchSize=${submitBatchSize} startSourceId=${startSourceId ?? 'n/a'} endSourceId=${endSourceId ?? 'n/a'} retryFailed=${retryFailed} retryFailedLimit=${retryFailedLimit}`,
    );
    const result = await service.submit({
      submitBatchSize,
      startSourceId,
      endSourceId,
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

function parseSubmitBatchSize(args: string[]): number {
  const flagIdx = args.indexOf('--submit-batch-size');
  if (flagIdx === -1) {
    return DEFAULT_RECIPE_SUBMIT_BATCH_SIZE;
  }

  const raw = args[flagIdx + 1];
  const parsed = parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new SubmitBatchSizeError(
      `--submit-batch-size must be a positive integer, received "${raw ?? ''}"`,
    );
  }
  return parsed;
}

function parseSourceIdRange(args: string[]): {
  startSourceId?: number;
  endSourceId?: number;
} {
  const startFlagIdx = args.indexOf('--start-source-id');
  const endFlagIdx = args.indexOf('--end-source-id');
  const hasStart = startFlagIdx !== -1;
  const hasEnd = endFlagIdx !== -1;

  if (!hasStart && !hasEnd) {
    return {};
  }

  const result: { startSourceId?: number; endSourceId?: number } = {};

  if (hasStart) {
    const startRaw = args[startFlagIdx + 1];
    const startSourceId = parseInt(startRaw ?? '', 10);
    if (!Number.isFinite(startSourceId) || startSourceId < 1) {
      throw new SubmitIndexRangeError(
        `--start-source-id must be a positive integer, received "${startRaw ?? ''}"`,
      );
    }
    result.startSourceId = startSourceId;
  }

  if (hasEnd) {
    const endRaw = args[endFlagIdx + 1];
    const endSourceId = parseInt(endRaw ?? '', 10);
    if (!Number.isFinite(endSourceId) || endSourceId < 1) {
      throw new SubmitIndexRangeError(
        `--end-source-id must be a positive integer, received "${endRaw ?? ''}"`,
      );
    }
    result.endSourceId = endSourceId;
  }

  return result;
}

function parseRetryFailedLimit(args: string[]): number {
  const flagIdx = args.indexOf('--retry-failed-limit');
  if (flagIdx === -1) {
    return 100;
  }
  const raw = args[flagIdx + 1];
  const parsed = parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new SubmitBatchSizeError(
      `--retry-failed-limit must be a positive integer, received "${raw ?? ''}"`,
    );
  }
  return parsed;
}

void main();
