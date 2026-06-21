import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionRunCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import { RecipeIngestionRetrieveModule } from './recipe-ingestion-retrieve.module';
import {
  RetrieveRunIdError,
  RetrieveService,
} from './services/retrieve.service';

/**
 * Recipe ingestion retrieve CLI (standalone job).
 *
 * Usage:
 *   pnpm --filter consumer run job:recipe-ingestion-retrieve
 *   pnpm --filter consumer run job:recipe-ingestion-retrieve --run-id <runId>
 *   pnpm --filter consumer run job:recipe-ingestion-retrieve --run-id-count 2
 *
 * submit → retrieve 순서·빈도는 구현 레이어가 아닌 운영 레이어(cron/ECS)에서 조율한다.
 *
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §2.2, §5.3
 */
async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionRetrieveCLI');
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [
      { name: '--run-id', takesValue: true },
      { name: '--run-id-count', takesValue: true },
    ],
  });
  if (unknownArgs.length > 0) {
    logger.error(`Unknown CLI argument(s): ${unknownArgs.join(', ')}`);
    return;
  }

  const target = parseRecipeIngestionRunCliArgs(args, (message) => {
    return new RetrieveRunIdError(message);
  });

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionRetrieveModule,
    { logger: ['log', 'error', 'warn'] },
  );

  try {
    const service = app.get(RetrieveService);
    logger.log(
      `Starting retrieve runId=${target.runId ?? 'n/a'} runIdCount=${target.runIdCount ?? 'n/a'}`,
    );
    const result = await service.retrieve(target);
    logger.log(
      `Retrieve complete batchCount=${result.batchCount} retrievedCount=${result.retrievedCount} failedCount=${result.failedCount} skippedBatchCount=${result.skippedBatchCount}`,
    );
  } finally {
    await app.close();
  }
}

void main();
