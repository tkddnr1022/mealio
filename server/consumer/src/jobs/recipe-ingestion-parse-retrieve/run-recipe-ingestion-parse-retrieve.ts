import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  generateCorrelationId,
  type ObservabilityConfig,
} from '@mealio/shared';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionRunCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import {
  logRecipeIngestionCli,
  RECIPE_INGESTION_LOG_EVENTS,
} from '../recipe-ingestion/recipe-ingestion-logger';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from '../../reliability/monitoring/consumer-metrics.service';
import { pushCliMetrics } from '../../reliability/monitoring/metrics-push';
import { RecipeIngestionParseRetrieveModule } from './recipe-ingestion-parse-retrieve.module';
import {
  ParseRetrieveRunIdError,
  ParseRetrieveService,
} from './services/parse-retrieve.service';

async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionParseRetrieveCLI');
  const correlationId = generateCorrelationId();
  const stage = 'parse-retrieve' as const;
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
    (message) => new ParseRetrieveRunIdError(message),
  );

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionParseRetrieveModule,
    { logger: ['log', 'error', 'warn', 'debug'] },
  );

  try {
    const service = app.get(ParseRetrieveService);
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
    const metrics = app.get(ConsumerMetricsService);
    const obs = app.get<ObservabilityConfig>(OBSERVABILITY_CONFIG);
    await pushCliMetrics(metrics, obs.pushgatewayUrl, stage, logger);
    await app.close();
  }
}

void main();
