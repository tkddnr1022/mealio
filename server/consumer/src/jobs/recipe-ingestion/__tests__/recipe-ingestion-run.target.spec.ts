import { Types } from 'mongoose';
import type { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeIngestionRunScopeError } from '../recipe-ingestion-run.scope';
import {
  distinctBatchIdsFromJobs,
  findRecipeIngestionJobsByRunIds,
  resolveRecipeIngestionRetrieveBatchIds,
  resolveRecipeIngestionTargetJobs,
} from '../recipe-ingestion-run.target';

const JOB_ID = '507f1f77bcf86cd799439011';

function makeJob(status: string, extras: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(JOB_ID),
    status,
    runId: 'run-1',
    batchId: 'batch-1',
    ...extras,
  };
}

describe('recipe-ingestion-run.target', () => {
  describe('findRecipeIngestionJobsByRunIds', () => {
    it('returns empty array for no runIds', async () => {
      const repository = {
        findByStatusAndRunId: jest.fn(),
        findByStatusAndRunIds: jest.fn(),
      };

      await expect(
        findRecipeIngestionJobsByRunIds(repository, 'fetched', []),
      ).resolves.toEqual([]);
      expect(repository.findByStatusAndRunId).not.toHaveBeenCalled();
    });

    it('uses findByStatusAndRunId for a single runId', async () => {
      const job = makeJob('fetched');
      const repository = {
        findByStatusAndRunId: jest.fn().mockResolvedValue([job]),
        findByStatusAndRunIds: jest.fn(),
      };

      await expect(
        findRecipeIngestionJobsByRunIds(repository, 'fetched', ['run-1']),
      ).resolves.toEqual([job]);
      expect(repository.findByStatusAndRunId).toHaveBeenCalledWith(
        'fetched',
        'run-1',
      );
    });

    it('uses findByStatusAndRunIds for multiple runIds', async () => {
      const repository = {
        findByStatusAndRunId: jest.fn(),
        findByStatusAndRunIds: jest.fn().mockResolvedValue([]),
      };

      await findRecipeIngestionJobsByRunIds(repository, 'parse_retrieved', [
        'run-1',
        'run-2',
      ]);

      expect(repository.findByStatusAndRunIds).toHaveBeenCalledWith(
        'parse_retrieved',
        ['run-1', 'run-2'],
      );
    });
  });

  describe('distinctBatchIdsFromJobs', () => {
    it('returns unique non-empty batchIds', () => {
      expect(
        distinctBatchIdsFromJobs([
          { batchId: 'batch-a' },
          { batchId: 'batch-a' },
          { batchId: 'batch-b' },
          { batchId: '' },
          {},
        ]),
      ).toEqual(['batch-a', 'batch-b']);
    });
  });

  describe('resolveRecipeIngestionTargetJobs', () => {
    let repository: jest.Mocked<
      Pick<
        RecipeIngestionJobRepository,
        | 'findById'
        | 'findDistinctRunIdsByStatus'
        | 'findByStatusAndRunId'
        | 'findByStatusAndRunIds'
        | 'findByRunId'
        | 'findByRunIds'
      >
    >;

    beforeEach(() => {
      repository = {
        findById: jest.fn(),
        findDistinctRunIdsByStatus: jest.fn(),
        findByStatusAndRunId: jest.fn(),
        findByStatusAndRunIds: jest.fn(),
        findByRunId: jest.fn(),
        findByRunIds: jest.fn(),
      };
    });

    it('returns a single fetched job for jobId mode', async () => {
      const job = makeJob('fetched');
      repository.findById.mockResolvedValue(job as never);

      await expect(
        resolveRecipeIngestionTargetJobs(repository, 'fetched', {
          jobId: JOB_ID,
        }),
      ).resolves.toEqual([job]);
      expect(repository.findDistinctRunIdsByStatus).not.toHaveBeenCalled();
    });

    it('returns empty when jobId status does not match', async () => {
      repository.findById.mockResolvedValue(
        makeJob('parse_submitted') as never,
      );

      await expect(
        resolveRecipeIngestionTargetJobs(repository, 'fetched', {
          jobId: JOB_ID,
        }),
      ).resolves.toEqual([]);
    });

    it('returns job for jobId mode when force is enabled', async () => {
      const job = makeJob('parse_submitted');
      repository.findById.mockResolvedValue(job as never);

      await expect(
        resolveRecipeIngestionTargetJobs(repository, 'fetched', {
          jobId: JOB_ID,
          force: true,
        }),
      ).resolves.toEqual([job]);
    });

    it('resolves jobs by run scope', async () => {
      const job = makeJob('parse_retrieved');
      repository.findDistinctRunIdsByStatus.mockResolvedValue(['run-1']);
      repository.findByStatusAndRunId.mockResolvedValue([job] as never);

      await expect(
        resolveRecipeIngestionTargetJobs(repository, 'parse_retrieved', {
          runId: 'run-1',
        }),
      ).resolves.toEqual([job]);
    });

    it('rejects jobId with run scope', async () => {
      await expect(
        resolveRecipeIngestionTargetJobs(repository, 'fetched', {
          jobId: JOB_ID,
          runId: 'run-1',
        }),
      ).rejects.toThrow(RecipeIngestionRunScopeError);
    });
  });

  describe('resolveRecipeIngestionRetrieveBatchIds', () => {
    let repository: jest.Mocked<
      Pick<
        RecipeIngestionJobRepository,
        | 'findDistinctRunIdsByStatus'
        | 'findDistinctBatchIdsByStatus'
        | 'findDistinctBatchIdsByRunIds'
      >
    >;

    beforeEach(() => {
      repository = {
        findDistinctRunIdsByStatus: jest.fn(),
        findDistinctBatchIdsByStatus: jest.fn(),
        findDistinctBatchIdsByRunIds: jest.fn(),
      };
    });

    it('resolves runIds then queries distinct batchIds', async () => {
      repository.findDistinctRunIdsByStatus.mockResolvedValue([
        'run-1',
        'run-2',
      ]);
      repository.findDistinctBatchIdsByStatus.mockResolvedValue([
        'batch-1',
        'batch-2',
      ]);

      await expect(
        resolveRecipeIngestionRetrieveBatchIds(repository, 'parse_submitted', {
          runIdCount: 2,
        }),
      ).resolves.toEqual(['batch-1', 'batch-2']);

      expect(repository.findDistinctBatchIdsByStatus).toHaveBeenCalledWith(
        'parse_submitted',
        ['run-1', 'run-2'],
      );
    });

    it('uses single runId without distinct run lookup', async () => {
      repository.findDistinctBatchIdsByStatus.mockResolvedValue(['batch-1']);

      await expect(
        resolveRecipeIngestionRetrieveBatchIds(repository, 'parse_submitted', {
          runId: 'run-1',
        }),
      ).resolves.toEqual(['batch-1']);

      expect(repository.findDistinctRunIdsByStatus).not.toHaveBeenCalled();
      expect(repository.findDistinctBatchIdsByStatus).toHaveBeenCalledWith(
        'parse_submitted',
        ['run-1'],
      );
    });

    it('uses batchIds by runIds when force is enabled', async () => {
      repository.findDistinctBatchIdsByRunIds.mockResolvedValue(['batch-1']);

      await expect(
        resolveRecipeIngestionRetrieveBatchIds(repository, 'parse_submitted', {
          runId: 'run-1',
          force: true,
        }),
      ).resolves.toEqual(['batch-1']);

      expect(repository.findDistinctBatchIdsByStatus).not.toHaveBeenCalled();
      expect(repository.findDistinctBatchIdsByRunIds).toHaveBeenCalledWith([
        'run-1',
      ]);
    });
  });
});
