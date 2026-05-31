import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RecipeIngestionRetrieveModule } from './recipe-ingestion-retrieve.module';
import { RetrieveService } from './services/retrieve.service';

/**
 * Recipe ingestion retrieve CLI (standalone job).
 *
 * Usage:
 *   pnpm --filter consumer run job:recipe-ingestion-retrieve
 *
 * submit → retrieve 순서·빈도는 구현 레이어가 아닌 운영 레이어(cron/ECS)에서 조율한다.
 *
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §2.2, §5.3
 */
async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionRetrieveCLI');

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionRetrieveModule,
    { logger: ['log', 'error', 'warn'] },
  );

  try {
    const service = app.get(RetrieveService);
    logger.log('Starting retrieve');
    const result = await service.retrieve();
    logger.log(
      `Retrieve complete batchCount=${result.batchCount} retrievedCount=${result.retrievedCount} failedCount=${result.failedCount} skippedBatchCount=${result.skippedBatchCount}`,
    );
  } finally {
    await app.close();
  }
}

void main();
