import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { generateCorrelationId } from '@mealio/shared';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionTargetCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import {
  logRecipeIngestionCli,
  RECIPE_INGESTION_LOG_EVENTS,
} from '../recipe-ingestion/recipe-ingestion-logger';
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
  const correlationId = generateCorrelationId();
  const stage = 'persist' as const;
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [
      { name: '--run-id', takesValue: true },
      { name: '--run-id-count', takesValue: true },
      { name: '--job-id', takesValue: true },
    ],
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

  const target = parseRecipeIngestionTargetCliArgs(args, (message) => {
    if (message.startsWith('--job-id')) {
      return new PersistJobIdError(message);
    }
    return new PersistRunIdError(message);
  });

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionPersistJobModule,
    { logger: ['log', 'error', 'warn', 'debug'] },
  );

  try {
    const service = app.get(PersistService);
    logRecipeIngestionCli(
      logger,
      'log',
      RECIPE_INGESTION_LOG_EVENTS.CLI_STARTED,
      stage,
      correlationId,
      {
        jobId: target.jobId,
        runId: target.runId,
        runIdCount: target.runIdCount,
      },
    );
    const result = await service.persist({ ...target, correlationId });
    logRecipeIngestionCli(
      logger,
      'log',
      RECIPE_INGESTION_LOG_EVENTS.CLI_COMPLETED,
      stage,
      correlationId,
      {
        outcome:
          result.failedCount > 0
            ? 'failed'
            : result.persistedCount > 0
              ? 'success'
              : 'skipped',
        persistedCount: result.persistedCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
      },
    );
  } finally {
    await app.close();
  }
}

void main();
