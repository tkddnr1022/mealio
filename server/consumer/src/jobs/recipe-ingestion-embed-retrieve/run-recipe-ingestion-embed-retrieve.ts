import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionRunCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import { RecipeIngestionEmbedRetrieveModule } from './recipe-ingestion-embed-retrieve.module';
import { EmbedRetrieveService } from './services/embed-retrieve.service';

async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionEmbedRetrieveCLI');
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

  const target = parseRecipeIngestionRunCliArgs(
    args,
    (message) => new Error(message),
  );
  const app = await NestFactory.createApplicationContext(
    RecipeIngestionEmbedRetrieveModule,
    { logger: ['log', 'error', 'warn'] },
  );
  try {
    const service = app.get(EmbedRetrieveService);
    const result = await service.retrieve(target);
    logger.log(
      `Embed retrieve complete batchCount=${result.batchCount} retrievedCount=${result.retrievedCount} failedCount=${result.failedCount} skippedBatchCount=${result.skippedBatchCount}`,
    );
  } finally {
    await app.close();
  }
}

void main();
