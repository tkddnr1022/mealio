import type {
  RecipeIngestionJobDocument,
  RecipeIngestionJobStatus,
} from '@mealio/shared';
import type { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import {
  assertRunScopeAndJobIdMutuallyExclusive,
  resolveRecipeIngestionTargetRunIds,
  type RecipeIngestionRunScopeOnlyOptions,
  type RecipeIngestionRunScopeOptions,
} from './recipe-ingestion-run.scope';

export type RecipeIngestionJobTargetRepository = Pick<
  RecipeIngestionJobRepository,
  | 'findById'
  | 'findDistinctRunIdsByStatus'
  | 'findByStatusAndRunId'
  | 'findByStatusAndRunIds'
  | 'findByRunId'
  | 'findByRunIds'
>;

type RecipeIngestionTargetScope =
  | { mode: 'job'; jobs: RecipeIngestionJobDocument[] }
  | { mode: 'run'; runIds: string[] };

async function resolveRecipeIngestionTargetScope(
  repository: Pick<
    RecipeIngestionJobRepository,
    'findById' | 'findDistinctRunIdsByStatus'
  >,
  status: RecipeIngestionJobStatus,
  options: RecipeIngestionRunScopeOptions,
): Promise<RecipeIngestionTargetScope> {
  assertRunScopeAndJobIdMutuallyExclusive(options);

  if (options.jobId) {
    const job = await repository.findById(options.jobId);
    if (!job) {
      return { mode: 'job', jobs: [] };
    }
    if (options.force) {
      return { mode: 'job', jobs: [job] };
    }
    return {
      mode: 'job',
      jobs: job.status === status ? [job] : [],
    };
  }

  const runIds = await resolveRecipeIngestionTargetRunIds(
    repository,
    status,
    options,
  );
  return { mode: 'run', runIds };
}

export async function findRecipeIngestionJobsByRunIds(
  repository: Pick<
    RecipeIngestionJobRepository,
    | 'findByStatusAndRunId'
    | 'findByStatusAndRunIds'
    | 'findByRunId'
    | 'findByRunIds'
  >,
  status: RecipeIngestionJobStatus,
  runIds: string[],
  force?: boolean,
): Promise<RecipeIngestionJobDocument[]> {
  if (runIds.length === 0) {
    return [];
  }
  if (force) {
    if (runIds.length === 1) {
      return repository.findByRunId(runIds[0]);
    }
    return repository.findByRunIds(runIds);
  }
  if (runIds.length === 1) {
    return repository.findByStatusAndRunId(status, runIds[0]);
  }
  return repository.findByStatusAndRunIds(status, runIds);
}

export function distinctBatchIdsFromJobs(
  jobs: Array<Pick<RecipeIngestionJobDocument, 'batchId'>>,
): string[] {
  const batchIds = new Set<string>();
  for (const job of jobs) {
    if (typeof job.batchId === 'string' && job.batchId.length > 0) {
      batchIds.add(job.batchId);
    }
  }
  return [...batchIds];
}

/**
 * parse-submit/persist — `jobId` 또는 `runId`/`runIdCount`에 따른 job 목록.
 */
export async function resolveRecipeIngestionTargetJobs(
  repository: RecipeIngestionJobTargetRepository,
  status: RecipeIngestionJobStatus,
  options: RecipeIngestionRunScopeOptions,
): Promise<RecipeIngestionJobDocument[]> {
  const scope = await resolveRecipeIngestionTargetScope(
    repository,
    status,
    options,
  );
  if (scope.mode === 'job') {
    return scope.jobs;
  }
  return findRecipeIngestionJobsByRunIds(
    repository,
    status,
    scope.runIds,
    options.force,
  );
}

export type RecipeIngestionRetrieveBatchRepository = Pick<
  RecipeIngestionJobRepository,
  | 'findDistinctRunIdsByStatus'
  | 'findDistinctBatchIdsByStatus'
  | 'findDistinctBatchIdsByRunIds'
>;

/**
 * parse-retrieve / embed-retrieve — run scope → submitted job의 distinct batchId.
 * runId:batchId 1:1 전제하에 batch 작업 단위를 조회한다.
 */
export async function resolveRecipeIngestionRetrieveBatchIds(
  repository: RecipeIngestionRetrieveBatchRepository,
  status: RecipeIngestionJobStatus,
  options: RecipeIngestionRunScopeOnlyOptions,
): Promise<string[]> {
  const runIds = await resolveRecipeIngestionTargetRunIds(
    repository,
    status,
    options,
  );
  if (options.force) {
    return repository.findDistinctBatchIdsByRunIds(runIds);
  }
  return repository.findDistinctBatchIdsByStatus(status, runIds);
}
