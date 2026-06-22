import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { findUnknownCliArgs } from '../cli-args.util';
import { parseRecipeIngestionTargetCliArgs } from '../recipe-ingestion/recipe-ingestion-run.cli';
import { RecipeIngestionParseSubmitModule } from './recipe-ingestion-parse-submit.module';
import {
  ParseSubmitJobIdError,
  ParseSubmitRetryFailedLimitError,
  ParseSubmitRunIdError,
  ParseSubmitService,
} from './services/parse-submit.service';

async function main(): Promise<void> {
  const logger = new Logger('RecipeIngestionParseSubmitCLI');
  const args = process.argv.slice(2);
  const unknownArgs = findUnknownCliArgs(args, {
    flags: [
      { name: '--run-id', takesValue: true },
      { name: '--run-id-count', takesValue: true },
      { name: '--job-id', takesValue: true },
      { name: '--retry-failed' },
      { name: '--retry-failed-limit', takesValue: true },
    ],
  });
  if (unknownArgs.length > 0) {
    logger.error(`Unknown CLI argument(s): ${unknownArgs.join(', ')}`);
    return;
  }

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
    { logger: ['log', 'error', 'warn'] },
  );

  try {
    const service = app.get(ParseSubmitService);
    logger.log(
      `Starting parse-submit jobId=${target.jobId ?? 'n/a'} runId=${target.runId ?? 'n/a'} runIdCount=${target.runIdCount ?? 'n/a'} retryFailed=${retryFailed} retryFailedLimit=${retryFailedLimit}`,
    );
    const result = await service.submit({
      ...target,
      retryFailed,
      retryFailedLimit,
    });
    logger.log(
      `Parse submit complete submittedCount=${result.submittedCount} batchId=${result.batchId ?? 'n/a'} skippedCount=${result.skippedCount}`,
    );
  } finally {
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
