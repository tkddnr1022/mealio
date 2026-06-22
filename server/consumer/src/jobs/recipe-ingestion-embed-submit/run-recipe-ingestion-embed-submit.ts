import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionTargetCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import { RecipeIngestionEmbedSubmitModule } from './recipe-ingestion-embed-submit.module';
import {
  EmbedSubmitJobIdError,
  EmbedSubmitRunIdError,
  EmbedSubmitService,
} from './services/embed-submit.service';

async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionEmbedSubmitCLI');
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [
      { name: '--run-id', takesValue: true },
      { name: '--run-id-count', takesValue: true },
      { name: '--job-id', takesValue: true },
    ],
  });
  if (unknownArgs.length > 0) {
    logger.error(`Unknown CLI argument(s): ${unknownArgs.join(', ')}`);
    return;
  }

  const target = parseRecipeIngestionTargetCliArgs(args, (message) => {
    if (message.startsWith('--job-id'))
      return new EmbedSubmitJobIdError(message);
    return new EmbedSubmitRunIdError(message);
  });

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionEmbedSubmitModule,
    { logger: ['log', 'error', 'warn'] },
  );
  try {
    const service = app.get(EmbedSubmitService);
    const result = await service.submit(target);
    logger.log(
      `Embed submit complete submittedCount=${result.submittedCount} skippedCount=${result.skippedCount} batchId=${result.batchId ?? 'n/a'}`,
    );
  } finally {
    await app.close();
  }
}

void main();
