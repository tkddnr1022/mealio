import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { generateCorrelationId } from '@mealio/shared';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionRunCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import {
  logRecipeIngestionCli,
  RECIPE_INGESTION_LOG_EVENTS,
} from '../recipe-ingestion/recipe-ingestion-logger';
import { RecipeIngestionEmbedRetrieveModule } from './recipe-ingestion-embed-retrieve.module';
import { EmbedRetrieveService } from './services/embed-retrieve.service';

async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionEmbedRetrieveCLI');
  const correlationId = generateCorrelationId();
  const stage = 'embed-retrieve' as const;
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [
      { name: '--run-id', takesValue: true },
      { name: '--run-id-count', takesValue: true },
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

  const target = parseRecipeIngestionRunCliArgs(
    args,
    (message) => new Error(message),
  );
  const app = await NestFactory.createApplicationContext(
    RecipeIngestionEmbedRetrieveModule,
    { logger: ['log', 'error', 'warn', 'debug'] },
  );
  try {
    const service = app.get(EmbedRetrieveService);
    logRecipeIngestionCli(
      logger,
      'log',
      RECIPE_INGESTION_LOG_EVENTS.CLI_STARTED,
      stage,
      correlationId,
      {
        runId: target.runId,
        runIdCount: target.runIdCount,
      },
    );
    const result = await service.retrieve({ ...target, correlationId });
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
            : result.retrievedCount > 0
              ? 'success'
              : result.skippedBatchCount > 0
                ? 'skipped'
                : 'no_op',
        batchCount: result.batchCount,
        retrievedCount: result.retrievedCount,
        failedCount: result.failedCount,
        skippedBatchCount: result.skippedBatchCount,
      },
    );
  } finally {
    await app.close();
  }
}

void main();
