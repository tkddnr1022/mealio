import {
  DEFAULT_RECIPE_INGESTION_RUN_ID_COUNT,
  MAX_RECIPE_INGESTION_RUN_ID_COUNT,
} from '@mealio/shared';
import type { RecipeIngestionJobStatus } from '@mealio/shared';
import type { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';

export class RecipeIngestionRunScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecipeIngestionRunScopeError';
  }
}

export interface RecipeIngestionRunScopeOptions {
  jobId?: string;
  runId?: string;
  runIdCount?: number;
}

/** parse-retrieve 등 run scope만 사용하는 단계용 (`jobId` 제외). */
export type RecipeIngestionRunScopeOnlyOptions = Omit<
  RecipeIngestionRunScopeOptions,
  'jobId'
>;

export function assertRunScopeAndJobIdMutuallyExclusive(
  options: RecipeIngestionRunScopeOptions,
): void {
  const hasJobId = options.jobId !== undefined;
  const hasRunScope =
    options.runId !== undefined || options.runIdCount !== undefined;
  if (hasJobId && hasRunScope) {
    throw new RecipeIngestionRunScopeError(
      'jobId and runId/runIdCount are mutually exclusive',
    );
  }
}

export type RecipeIngestionRunScope =
  | { mode: 'single'; runId: string }
  | { mode: 'count'; runIdCount: number };

export function resolveRecipeIngestionRunScope(
  options: RecipeIngestionRunScopeOptions,
): RecipeIngestionRunScope {
  const hasRunId = options.runId !== undefined;
  const hasRunIdCount = options.runIdCount !== undefined;

  if (hasRunId && hasRunIdCount) {
    throw new RecipeIngestionRunScopeError(
      'runId and runIdCount are mutually exclusive',
    );
  }

  if (hasRunId) {
    const runId = options.runId!.trim();
    if (runId.length === 0) {
      throw new RecipeIngestionRunScopeError(
        'runId must be a non-empty string',
      );
    }
    return { mode: 'single', runId };
  }

  return { mode: 'count', runIdCount: resolveRunIdCount(options.runIdCount) };
}

export function resolveRunIdCount(count?: number): number {
  const resolved = count ?? DEFAULT_RECIPE_INGESTION_RUN_ID_COUNT;
  if (!Number.isFinite(resolved) || resolved < 1) {
    throw new RecipeIngestionRunScopeError(
      `runIdCount must be >= 1, received ${count ?? 'undefined'}`,
    );
  }
  if (resolved > MAX_RECIPE_INGESTION_RUN_ID_COUNT) {
    throw new RecipeIngestionRunScopeError(
      `runIdCount (${resolved}) exceeds maximum ${MAX_RECIPE_INGESTION_RUN_ID_COUNT}`,
    );
  }
  return resolved;
}

export async function resolveRecipeIngestionTargetRunIds(
  repository: Pick<RecipeIngestionJobRepository, 'findDistinctRunIdsByStatus'>,
  status: RecipeIngestionJobStatus,
  options: RecipeIngestionRunScopeOptions,
): Promise<string[]> {
  assertRunScopeAndJobIdMutuallyExclusive(options);
  const scope = resolveRecipeIngestionRunScope(options);
  if (scope.mode === 'single') {
    return [scope.runId];
  }
  return repository.findDistinctRunIdsByStatus(status, scope.runIdCount);
}
