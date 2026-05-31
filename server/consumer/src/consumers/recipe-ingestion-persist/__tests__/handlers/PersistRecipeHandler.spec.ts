import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeCreationTransaction } from 'src/persistence/transactions/recipe-creation.transaction';
import { PersistRecipeHandler } from '../../handlers/PersistRecipeHandler';
import { RetrievedDataValidationError } from '../../validators/retrieved-data.validator';

const JOB_ID = '507f1f77bcf86cd799439011';

const validRetrievedData = {
  recipe: {
    title: '된장찌개',
    steps: ['물을 넣어 끓여요.'],
    categoryId: 1,
  },
  ingredients: [
    {
      rawName: '된장',
      normalizedName: '된장',
      ingredientAlias: '된장',
      categoryId: 3,
    },
  ],
  parseConfidence: 'high',
};

function mockJob(overrides: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(JOB_ID),
    sourceId: 12345,
    status: 'retrieved',
    retrievedData: validRetrievedData,
    retryCount: 0,
    ...overrides,
  };
}

describe('PersistRecipeHandler', () => {
  let handler: PersistRecipeHandler;
  let jobRepository: jest.Mocked<
    Pick<
      RecipeIngestionJobRepository,
      | 'findById'
      | 'transitionStatus'
      | 'rollbackPersistingJobWithRetry'
    >
  >;
  let recipeCreationTransaction: jest.Mocked<
    Pick<RecipeCreationTransaction, 'execute'>
  >;

  beforeEach(async () => {
    jobRepository = {
      findById: jest.fn(),
      transitionStatus: jest.fn(),
      rollbackPersistingJobWithRetry: jest.fn(),
    };
    recipeCreationTransaction = {
      execute: jest.fn().mockResolvedValue({ recipeId: 1, matchMethods: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersistRecipeHandler,
        { provide: RecipeIngestionJobRepository, useValue: jobRepository },
        {
          provide: RecipeCreationTransaction,
          useValue: recipeCreationTransaction,
        },
      ],
    }).compile();

    handler = module.get(PersistRecipeHandler);
  });

  it('should skip when job not found', async () => {
    jobRepository.findById.mockResolvedValue(null);

    await handler.execute({ jobId: JOB_ID });

    expect(jobRepository.transitionStatus).not.toHaveBeenCalled();
  });

  it('should skip when status is persisted', async () => {
    jobRepository.findById.mockResolvedValue(
      mockJob({ status: 'persisted' }) as never,
    );

    await handler.execute({ jobId: JOB_ID });

    expect(jobRepository.transitionStatus).not.toHaveBeenCalled();
  });

  it('should skip when status is persisting', async () => {
    jobRepository.findById.mockResolvedValue(
      mockJob({ status: 'persisting' }) as never,
    );

    await handler.execute({ jobId: JOB_ID });

    expect(jobRepository.transitionStatus).not.toHaveBeenCalled();
  });

  it('should skip when status is not retrieved', async () => {
    jobRepository.findById.mockResolvedValue(
      mockJob({ status: 'fetched' }) as never,
    );

    await handler.execute({ jobId: JOB_ID });

    expect(jobRepository.transitionStatus).not.toHaveBeenCalled();
  });

  it('should persist on happy path', async () => {
    const job = mockJob();
    jobRepository.findById.mockResolvedValue(job as never);
    jobRepository.transitionStatus
      .mockResolvedValueOnce({ ...job, status: 'persisting' } as never)
      .mockResolvedValueOnce({ ...job, status: 'persisted' } as never);

    await handler.execute({ jobId: JOB_ID });

    expect(jobRepository.transitionStatus).toHaveBeenNthCalledWith(
      1,
      JOB_ID,
      'retrieved',
      'persisting',
    );
    expect(recipeCreationTransaction.execute).toHaveBeenCalled();
    expect(jobRepository.transitionStatus).toHaveBeenNthCalledWith(
      2,
      JOB_ID,
      'persisting',
      'persisted',
      expect.objectContaining({ persistedAt: expect.any(Date) }),
    );
  });

  it('should skip when retrieved→persisting transition fails', async () => {
    jobRepository.findById.mockResolvedValue(mockJob() as never);
    jobRepository.transitionStatus.mockResolvedValue(null);

    await handler.execute({ jobId: JOB_ID });

    expect(recipeCreationTransaction.execute).not.toHaveBeenCalled();
  });

  it('should rollback and rethrow on persist failure', async () => {
    const job = mockJob();
    jobRepository.findById.mockResolvedValue(job as never);
    jobRepository.transitionStatus.mockResolvedValueOnce({
      ...job,
      status: 'persisting',
    } as never);
    recipeCreationTransaction.execute.mockRejectedValue(
      new RetrievedDataValidationError('bad data'),
    );
    jobRepository.rollbackPersistingJobWithRetry.mockResolvedValue(true);

    await expect(handler.execute({ jobId: JOB_ID })).rejects.toThrow(
      RetrievedDataValidationError,
    );

    expect(jobRepository.rollbackPersistingJobWithRetry).toHaveBeenCalledWith(
      JOB_ID,
      'bad data',
    );
  });
});
