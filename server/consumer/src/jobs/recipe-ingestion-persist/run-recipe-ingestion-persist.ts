import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionTargetCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import {
  PersistJobIdError,
  PersistRunIdError,
  PersistService,
} from './services/persist.service';
import { RecipeIngestionPersistJobModule } from './recipe-ingestion-persist.module';

/**
 * Recipe ingestion persist CLI (standalone job).
 *
 * Usage:
 *   pnpm --filter consumer run job:recipe-ingestion-persist
 *   pnpm --filter consumer run job:recipe-ingestion-persist --run-id <runId>
 *   pnpm --filter consumer run job:recipe-ingestion-persist --run-id-count 2
 *   pnpm --filter consumer run job:recipe-ingestion-persist --job-id <jobId>
 */
async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionPersistCLI');
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [
      { name: '--run-id', takesValue: true },
      { name: '--run-id-count', takesValue: true },
      { name: '--job-id', takesValue: true },
    ],
  });
  if (unknownArgs.length > 0) {
    logger.error(`Unknown CLI argument(s): ${unknownArgs.join(', ')}`);
    return;
  }

  const target = parseRecipeIngestionTargetCliArgs(args, (message) => {
    if (message.startsWith('--job-id')) {
      return new PersistJobIdError(message);
    }
    return new PersistRunIdError(message);
  });

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionPersistJobModule,
    { logger: ['log', 'error', 'warn'] },
  );

  try {
    const service = app.get(PersistService);
    logger.log(
      `Starting persist jobId=${target.jobId ?? 'n/a'} runId=${target.runId ?? 'n/a'} runIdCount=${target.runIdCount ?? 'n/a'}`,
    );
    const result = await service.persist(target);
    logger.log(
      `Persist complete persistedCount=${result.persistedCount} skippedCount=${result.skippedCount} failedCount=${result.failedCount}`,
    );
  } finally {
    await app.close();
  }
}

void main();
