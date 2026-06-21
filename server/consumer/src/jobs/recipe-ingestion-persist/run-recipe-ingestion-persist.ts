import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { findUnknownCliArgs } from '../cli-args.util';
import {
  PersistBatchSizeError,
  PersistService,
} from './services/persist.service';
import { RecipeIngestionPersistJobModule } from './recipe-ingestion-persist.module';

/**
 * Recipe ingestion persist CLI (standalone job).
 *
 * Usage:
 *   pnpm --filter consumer run job:recipe-ingestion-persist
 *   pnpm --filter consumer run job:recipe-ingestion-persist --persist-batch-size 100
 *   pnpm --filter consumer run job:recipe-ingestion-persist --job-id <jobId>
 */
async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionPersistCLI');
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [
      { name: '--persist-batch-size', takesValue: true },
      { name: '--job-id', takesValue: true },
    ],
  });
  if (unknownArgs.length > 0) {
    logger.error(`Unknown CLI argument(s): ${unknownArgs.join(', ')}`);
    return;
  }

  const persistBatchSize = parsePersistBatchSize(args);
  const jobId = parseJobId(args);

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionPersistJobModule,
    { logger: ['log', 'error', 'warn'] },
  );

  try {
    const service = app.get(PersistService);
    logger.log(
      `Starting persist persistBatchSize=${persistBatchSize} jobId=${jobId ?? 'n/a'}`,
    );
    const result = await service.persist({ persistBatchSize, jobId });
    logger.log(
      `Persist complete persistedCount=${result.persistedCount} skippedCount=${result.skippedCount} failedCount=${result.failedCount}`,
    );
  } finally {
    await app.close();
  }
}

function parsePersistBatchSize(args: string[]): number {
  const flagIdx = args.indexOf('--persist-batch-size');
  if (flagIdx === -1) {
    return 100;
  }

  const raw = args[flagIdx + 1];
  const parsed = parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new PersistBatchSizeError(
      `--persist-batch-size must be a positive integer, received "${
        raw ?? ''
      }"`,
    );
  }
  return parsed;
}

function parseJobId(args: string[]): string | undefined {
  const flagIdx = args.indexOf('--job-id');
  if (flagIdx === -1) {
    return undefined;
  }

  const value = args[flagIdx + 1]?.trim();
  if (!value) {
    throw new PersistBatchSizeError('--job-id requires a non-empty value');
  }
  return value;
}

void main();
