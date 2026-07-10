import {
  DEFAULT_RECIPE_INGESTION_RUN_ID_COUNT,
  MAX_RECIPE_INGESTION_RUN_ID_COUNT,
} from '@mealio/shared';
import type { CliFlagDefinition } from '../cli-args.util';
import type { RecipeIngestionRunScopeOptions } from './recipe-ingestion-run.scope';

export const RECIPE_INGESTION_NO_KAFKA_CLI_FLAG = '--no-kafka';

export function parseNoKafkaCliFlag(args: string[]): boolean {
  return args.includes(RECIPE_INGESTION_NO_KAFKA_CLI_FLAG);
}

export const RECIPE_INGESTION_NO_KAFKA_CLI_FLAG_DEFINITION: CliFlagDefinition = {
  name: RECIPE_INGESTION_NO_KAFKA_CLI_FLAG,
};

export const RECIPE_INGESTION_FORCE_CLI_FLAG = '--force';

export function parseForceCliFlag(args: string[]): boolean {
  return args.includes(RECIPE_INGESTION_FORCE_CLI_FLAG);
}

export const RECIPE_INGESTION_FORCE_REQUIRES_TARGET_MESSAGE =
  '--force requires --job-id or --run-id';

export function parseForceCliArg(
  args: string[],
  createError: (message: string) => Error,
): boolean {
  if (!parseForceCliFlag(args)) {
    return false;
  }
  if (!args.includes('--job-id') && !args.includes('--run-id')) {
    throw createError(RECIPE_INGESTION_FORCE_REQUIRES_TARGET_MESSAGE);
  }
  return true;
}

export const RECIPE_INGESTION_FORCE_CLI_FLAG_DEFINITION: CliFlagDefinition = {
  name: RECIPE_INGESTION_FORCE_CLI_FLAG,
};

export function parseJobIdCliArg(
  args: string[],
  createError: (message: string) => Error,
): string | undefined {
  const flagIdx = args.indexOf('--job-id');
  if (flagIdx === -1) {
    return undefined;
  }

  const value = args[flagIdx + 1]?.trim();
  if (!value) {
    throw createError('--job-id requires a non-empty value');
  }
  return value;
}

export function parseRecipeIngestionTargetCliArgs(
  args: string[],
  createError: (message: string) => Error,
): RecipeIngestionRunScopeOptions {
  const hasJobIdFlag = args.includes('--job-id');
  const hasRunIdFlag = args.includes('--run-id');
  const hasRunIdCountFlag = args.includes('--run-id-count');

  if (hasJobIdFlag && (hasRunIdFlag || hasRunIdCountFlag)) {
    throw createError(
      '--job-id cannot be used with --run-id or --run-id-count',
    );
  }

  if (hasJobIdFlag) {
    return { jobId: parseJobIdCliArg(args, createError)! };
  }

  return parseRecipeIngestionRunCliArgs(args, createError);
}

export function parseRecipeIngestionRunCliArgs(
  args: string[],
  createError: (message: string) => Error,
): RecipeIngestionRunScopeOptions {
  const hasRunIdFlag = args.includes('--run-id');
  const hasRunIdCountFlag = args.includes('--run-id-count');

  if (hasRunIdFlag && hasRunIdCountFlag) {
    throw createError('--run-id and --run-id-count cannot be used together');
  }

  if (hasRunIdFlag) {
    const flagIdx = args.indexOf('--run-id');
    const value = args[flagIdx + 1]?.trim();
    if (!value) {
      throw createError('--run-id requires a non-empty value');
    }
    return { runId: value };
  }

  if (!hasRunIdCountFlag) {
    return { runIdCount: DEFAULT_RECIPE_INGESTION_RUN_ID_COUNT };
  }

  const flagIdx = args.indexOf('--run-id-count');
  const raw = args[flagIdx + 1];
  const parsed = parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw createError(
      `--run-id-count must be a positive integer, received "${raw ?? ''}"`,
    );
  }
  if (parsed > MAX_RECIPE_INGESTION_RUN_ID_COUNT) {
    throw createError(
      `--run-id-count (${parsed}) exceeds maximum ${MAX_RECIPE_INGESTION_RUN_ID_COUNT}`,
    );
  }
  return { runIdCount: parsed };
}
