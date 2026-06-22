import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionRunCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import { RecipeIngestionParseRetrieveModule } from './recipe-ingestion-parse-retrieve.module';
import {
  ParseRetrieveRunIdError,
  ParseRetrieveService,
} from './services/parse-retrieve.service';

async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionParseRetrieveCLI');
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
    (message) => new ParseRetrieveRunIdError(message),
  );

  const app = await NestFactory.createApplicationContext(
    RecipeIngestionParseRetrieveModule,
    { logger: ['log', 'error', 'warn'] },
  );

  try {
    const service = app.get(ParseRetrieveService);
    logger.log(
      `Starting parse-retrieve runId=${target.runId ?? 'n/a'} runIdCount=${target.runIdCount ?? 'n/a'}`,
    );
    const result = await service.retrieve(target);
    logger.log(
      `Parse retrieve complete batchCount=${result.batchCount} retrievedCount=${result.retrievedCount} failedCount=${result.failedCount} skippedBatchCount=${result.skippedBatchCount}`,
    );
  } finally {
    await app.close();
  }
}

void main();
