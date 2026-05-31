import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DEFAULT_RECIPE_SUBMIT_BATCH_SIZE } from '@mealio/shared';
import { RecipeIngestionSubmitModule } from './recipe-ingestion-submit.module';
import { SubmitBatchSizeError, SubmitService } from './services/submit.service';

/**
 * Recipe ingestion submit CLI (standalone job).
 *
 * Usage:
 *   pnpm --filter consumer run job:recipe-ingestion-submit
 *   pnpm --filter consumer run job:recipe-ingestion-submit --submit-batch-size 50
 *
 * fetch → submit 순서·빈도는 구현 레이어가 아닌 운영 레이어(cron/ECS)에서 조율한다.
 *
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §2.2, §5.2
 */
async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionSubmitCLI');
  const submitBatchSize = parseSubmitBatchSize(process.argv.slice(2));

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionSubmitModule,
    { logger: ['log', 'error', 'warn'] },
  );

  try {
    const service = app.get(SubmitService);
    logger.log(`Starting submit submitBatchSize=${submitBatchSize}`);
    const result = await service.submit({ submitBatchSize });
    logger.log(
      `Submit complete submittedCount=${result.submittedCount} batchId=${result.batchId ?? 'n/a'} skippedCount=${result.skippedCount}`,
    );
  } finally {
    await app.close();
  }
}

function parseSubmitBatchSize(args: string[]): number {
  const flagIdx = args.indexOf('--submit-batch-size');
  if (flagIdx === -1) {
    return DEFAULT_RECIPE_SUBMIT_BATCH_SIZE;
  }

  const raw = args[flagIdx + 1];
  const parsed = parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new SubmitBatchSizeError(
      `--submit-batch-size must be a positive integer, received "${raw ?? ''}"`,
    );
  }
  return parsed;
}

void main();
