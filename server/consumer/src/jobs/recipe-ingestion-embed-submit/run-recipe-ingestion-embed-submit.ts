import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { generateCorrelationId } from '@mealio/shared';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionTargetCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import {
  logRecipeIngestionCli,
  RECIPE_INGESTION_LOG_EVENTS,
} from '../recipe-ingestion/recipe-ingestion-logger';
import { RecipeIngestionEmbedSubmitModule } from './recipe-ingestion-embed-submit.module';
import {
  EmbedSubmitJobIdError,
  EmbedSubmitRunIdError,
  EmbedSubmitService,
} from './services/embed-submit.service';

async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionEmbedSubmitCLI');
  const correlationId = generateCorrelationId();
  const stage = 'embed-submit' as const;
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
    if (message.startsWith('--job-id'))
      return new EmbedSubmitJobIdError(message);
    return new EmbedSubmitRunIdError(message);
  });

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionEmbedSubmitModule,
    { logger: ['log', 'error', 'warn', 'debug'] },
  );
  try {
    const service = app.get(EmbedSubmitService);
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
    const result = await service.submit({ ...target, correlationId });
    logRecipeIngestionCli(
      logger,
      'log',
      RECIPE_INGESTION_LOG_EVENTS.CLI_COMPLETED,
      stage,
      correlationId,
      {
        outcome: result.submittedCount > 0 ? 'success' : 'skipped',
        submittedCount: result.submittedCount,
        skippedCount: result.skippedCount,
        batchId: result.batchId,
      },
    );
  } finally {
    await app.close();
  }
}

void main();
