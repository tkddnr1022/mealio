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
import { RecipeIngestionParseSubmitModule } from './recipe-ingestion-parse-submit.module';
import {
  ParseSubmitJobIdError,
  ParseSubmitRetryFailedLimitError,
  ParseSubmitRunIdError,
  ParseSubmitService,
} from './services/parse-submit.service';

async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionParseSubmitCLI');
  const correlationId = generateCorrelationId();
  const stage = 'parse-submit' as const;
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [
      { name: '--run-id', takesValue: true },
      { name: '--run-id-count', takesValue: true },
      { name: '--job-id', takesValue: true },
      { name: '--retry-failed' },
      { name: '--retry-failed-limit', takesValue: true },
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

  const force = parseForceCliArg(args, (message) => new ParseSubmitRunIdError(message));
  const target = parseRecipeIngestionTargetCliArgs(args, (message) => {
    if (message.startsWith('--job-id')) {
      return new ParseSubmitJobIdError(message);
    }
    return new ParseSubmitRunIdError(message);
  });
  const retryFailed = args.includes('--retry-failed');
  const retryFailedLimit = parseRetryFailedLimit(args);

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionParseSubmitModule,
    { logger: ['log', 'error', 'warn', 'debug'] },
  );

  try {
    const service = app.get(ParseSubmitService);
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
        retryFailed,
        retryFailedLimit,
        force,
      },
    );
    const result = await service.submit({
      ...target,
      retryFailed,
      retryFailedLimit,
      force,
      correlationId,
    });
    logRecipeIngestionCli(
      logger,
      'log',
      RECIPE_INGESTION_LOG_EVENTS.CLI_COMPLETED,
      stage,
      correlationId,
      {
        outcome: result.submittedCount > 0 ? 'success' : 'skipped',
        submittedCount: result.submittedCount,
        batchId: result.batchId,
        skippedCount: result.skippedCount,
      },
    );
  } finally {
    const metrics = app.get(ConsumerMetricsService);
    const obs = app.get<ObservabilityConfig>(OBSERVABILITY_CONFIG);
    await pushCliMetrics(metrics, obs.pushgatewayUrl, stage, logger);
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
    throw new ParseSubmitRetryFailedLimitError(
      `--retry-failed-limit must be a positive integer, received "${raw ?? ''}"`,
    );
  }
  return parsed;
}

void main();
