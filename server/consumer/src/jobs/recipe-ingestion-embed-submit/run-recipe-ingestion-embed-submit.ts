import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  generateCorrelationId,
  type ObservabilityConfig,
} from '@mealio/shared';
import { findUnknownCliArgs } from '../cli-args.util';
import {
  parseRecipeIngestionTargetCliArgs,
  parseForceCliArg,
  RECIPE_INGESTION_FORCE_CLI_FLAG_DEFINITION,
} from '../recipe-ingestion/recipe-ingestion-run.cli';
import {
  logRecipeIngestionCli,
  RECIPE_INGESTION_LOG_EVENTS,
} from '../recipe-ingestion/recipe-ingestion-logger';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from '../../reliability/monitoring/consumer-metrics.service';
import { pushCliMetrics } from '../../reliability/monitoring/metrics-push';
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
      RECIPE_INGESTION_FORCE_CLI_FLAG_DEFINITION,
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

  const force = parseForceCliArg(args, (message) => new EmbedSubmitRunIdError(message));
  const target = parseRecipeIngestionTargetCliArgs(args, (message) => {
    if (message.startsWith('--job-id'))
      return new EmbedSubmitJobIdError(message);
    return new EmbedSubmitRunIdError(message);
  });

  const force = parseForceCliArg(args, (message) => new EmbedSubmitRunIdError(message));

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
        force,
      },
    );
    const result = await service.submit({ ...target, force, correlationId });
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
    const metrics = app.get(ConsumerMetricsService);
    const obs = app.get<ObservabilityConfig>(OBSERVABILITY_CONFIG);
    await pushCliMetrics(metrics, obs.pushgatewayUrl, stage, logger);
    await app.close();
  }
}

void main();
