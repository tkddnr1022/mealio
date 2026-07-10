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
  parseNoKafkaCliFlag,
  RECIPE_INGESTION_NO_KAFKA_CLI_FLAG_DEFINITION,
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
 *   pnpm --filter consumer run job:recipe-ingestion-persist --no-kafka
 *   pnpm --filter consumer run job:recipe-ingestion-persist --force --job-id <jobId>
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
      RECIPE_INGESTION_NO_KAFKA_CLI_FLAG_DEFINITION,
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

  const force = parseForceCliArg(args, (message) => {
    if (message.startsWith('--job-id')) {
      return new PersistJobIdError(message);
    }
    return new PersistRunIdError(message);
  });
  const target = parseRecipeIngestionTargetCliArgs(args, (message) => {
    if (message.startsWith('--job-id')) {
      return new PersistJobIdError(message);
    }
    return new PersistRunIdError(message);
  });
  const noKafka = parseNoKafkaCliFlag(args);

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionPersistJobModule.register({ noKafka }),
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
        noKafka,
        force,
      },
    );
    const result = await service.persist({ ...target, force, correlationId });
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
    const metrics = app.get(ConsumerMetricsService);
    const obs = app.get<ObservabilityConfig>(OBSERVABILITY_CONFIG);
    await pushCliMetrics(metrics, obs.pushgatewayUrl, stage, logger);
    await app.close();
  }
}

void main();
