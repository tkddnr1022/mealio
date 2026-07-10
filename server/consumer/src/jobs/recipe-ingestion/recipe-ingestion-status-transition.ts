import type { RecipeIngestionJobStatus } from '@mealio/shared';
import type {
  RecipeIngestionJobRepository,
  RecipeIngestionJobStatusUpdate,
} from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';

type TransitionRepository = Pick<
  RecipeIngestionJobRepository,
  | 'transitionStatus'
  | 'forceTransitionStatus'
  | 'transitionManyByIds'
  | 'forceTransitionManyByIds'
  | 'transitionManyByBatchId'
  | 'forceTransitionManyByBatchId'
>;

type FindByIdsRepository = Pick<
  RecipeIngestionJobRepository,
  'findManyByIdsAndStatus' | 'findManyByIds'
>;

export async function transitionIngestionJobStatus(
  repository: TransitionRepository,
  params: {
    id: string;
    fromStatus: RecipeIngestionJobStatus;
    toStatus: RecipeIngestionJobStatus;
    updates?: RecipeIngestionJobStatusUpdate;
    force?: boolean;
  },
) {
  if (params.force) {
    return repository.forceTransitionStatus(
      params.id,
      params.toStatus,
      params.updates,
    );
  }
  return repository.transitionStatus(
    params.id,
    params.fromStatus,
    params.toStatus,
    params.updates,
  );
}

export async function transitionIngestionJobsByIds(
  repository: TransitionRepository,
  params: {
    ids: string[];
    fromStatus: RecipeIngestionJobStatus;
    toStatus: RecipeIngestionJobStatus;
    updates?: RecipeIngestionJobStatusUpdate;
    force?: boolean;
  },
): Promise<number> {
  if (params.force) {
    return repository.forceTransitionManyByIds(
      params.ids,
      params.toStatus,
      params.updates,
    );
  }
  return repository.transitionManyByIds(
    params.ids,
    params.fromStatus,
    params.toStatus,
    params.updates,
  );
}

export async function transitionIngestionJobsByBatchId(
  repository: TransitionRepository,
  params: {
    batchId: string;
    fromStatus: RecipeIngestionJobStatus;
    toStatus: RecipeIngestionJobStatus;
    updates?: RecipeIngestionJobStatusUpdate;
    force?: boolean;
  },
): Promise<number> {
  if (params.force) {
    return repository.forceTransitionManyByBatchId(
      params.batchId,
      params.toStatus,
      params.updates,
    );
  }
  return repository.transitionManyByBatchId(
    params.batchId,
    params.fromStatus,
    params.toStatus,
    params.updates,
  );
}

export async function findIngestionJobsByIds(
  repository: FindByIdsRepository,
  ids: string[],
  status: RecipeIngestionJobStatus,
  force?: boolean,
) {
  if (force) {
    return repository.findManyByIds(ids);
  }
  return repository.findManyByIdsAndStatus(ids, status);
}
