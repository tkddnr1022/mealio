import { Logger } from '@nestjs/common';
import {
  formatStructuredLog,
  logStructured,
  type StructuredLogLevel,
} from '@mealio/shared';

export const RECIPE_INGESTION_STAGES = [
  'fetch',
  'parse-submit',
  'parse-retrieve',
  'persist',
  'embed-submit',
  'embed-retrieve',
] as const;

export type RecipeIngestionStage = (typeof RECIPE_INGESTION_STAGES)[number];

export const RECIPE_INGESTION_LOG_EVENTS = {
  STAGE_STARTED: 'recipe_ingestion_stage_started',
  STAGE_COMPLETED: 'recipe_ingestion_stage_completed',
  STAGE_NO_OP: 'recipe_ingestion_stage_no_op',
  BATCH_SUBMITTED: 'recipe_ingestion_batch_submitted',
  BATCH_RETRIEVED: 'recipe_ingestion_batch_retrieved',
  BATCH_SKIPPED: 'recipe_ingestion_batch_skipped',
  JOB_TRANSITION_FAILED: 'recipe_ingestion_job_transition_failed',
  JOB_FAILED: 'recipe_ingestion_job_failed',
  BATCH_FAILED: 'recipe_ingestion_batch_failed',
  TRIGGER_PUBLISH_FAILED: 'recipe_ingestion_trigger_publish_failed',
  ROW_SKIPPED: 'recipe_ingestion_row_skipped',
  DEGRADED: 'recipe_ingestion_degraded',
  CLI_STARTED: 'recipe_ingestion_cli_started',
  CLI_COMPLETED: 'recipe_ingestion_cli_completed',
  CLI_UNKNOWN_ARGS: 'recipe_ingestion_cli_unknown_args',
} as const;

export type RecipeIngestionLogOutcome = 'success' | 'skipped' | 'failed' | 'no_op';

export interface RecipeIngestionLoggingOptions {
  correlationId?: string;
}

export interface RecipeIngestionLogFields {
  event: string;
  stage: RecipeIngestionStage;
  correlationId?: string;
  runId?: string;
  jobId?: string;
  batchId?: string;
  sourceRecipeId?: number;
  durationMs?: number;
  outcome?: RecipeIngestionLogOutcome;
  count?: number;
  message?: string;
  errorName?: string;
  [key: string]: unknown;
}

export function logIngestion(
  logger: Logger,
  level: StructuredLogLevel,
  fields: RecipeIngestionLogFields,
): void {
  logStructured(logger, level, {
    service: 'consumer',
    ...fields,
  });
}

export function logIngestionError(
  logger: Logger,
  fields: RecipeIngestionLogFields,
  error: unknown,
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const payload = formatStructuredLog({
    service: 'consumer',
    ...fields,
    message: fields.message ?? err.message,
    errorName: err.name,
  });
  logger.error(payload, err.stack);
}

export function logRecipeIngestionCli(
  logger: Logger,
  level: StructuredLogLevel,
  event:
    | typeof RECIPE_INGESTION_LOG_EVENTS.CLI_STARTED
    | typeof RECIPE_INGESTION_LOG_EVENTS.CLI_COMPLETED
    | typeof RECIPE_INGESTION_LOG_EVENTS.CLI_UNKNOWN_ARGS,
  stage: RecipeIngestionStage,
  correlationId: string,
  fields: Omit<
    RecipeIngestionLogFields,
    'event' | 'stage' | 'correlationId' | 'service'
  > = {},
): void {
  logIngestion(logger, level, {
    event,
    stage,
    correlationId,
    ...fields,
  });
}
