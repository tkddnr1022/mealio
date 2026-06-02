import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeCreationTransaction } from 'src/persistence/transactions/recipe-creation.transaction';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';
import { RetrievedDataValidationError } from 'src/consumers/recipe-ingestion-persist/validators/retrieved-data.validator';
import {
  PersistBatchSizeError,
  PersistService,
} from '../../services/persist.service';

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

describe('PersistService', () => {
  let service: PersistService;
  let jobRepository: jest.Mocked<
    Pick<
      RecipeIngestionJobRepository,
      | 'findById'
      | 'transitionStatus'
      | 'rollbackPersistingJobWithRetry'
      | 'findByStatus'
    >
  >;
  let recipeCreationTransaction: jest.Mocked<
    Pick<RecipeCreationTransaction, 'execute'>
  >;
  let metrics: jest.Mocked<
    Pick<
      ConsumerMetricsService,
      | 'recordIngestionStage'
      | 'observeIngestionStageLatency'
      | 'recordParseConfidence'
      | 'recordIngredientMatchMethod'
    >
  >;

  beforeEach(async () => {
    jobRepository = {
      findById: jest.fn(),
      transitionStatus: jest.fn(),
      rollbackPersistingJobWithRetry: jest.fn(),
      findByStatus: jest.fn(),
    };
    recipeCreationTransaction = {
      execute: jest.fn().mockResolvedValue({ recipeId: 1, matchMethods: [] }),
    };
    metrics = {
      recordIngestionStage: jest.fn(),
      observeIngestionStageLatency: jest.fn(),
      recordParseConfidence: jest.fn(),
      recordIngredientMatchMethod: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersistService,
        { provide: RecipeIngestionJobRepository, useValue: jobRepository },
        {
          provide: RecipeCreationTransaction,
          useValue: recipeCreationTransaction,
        },
        { provide: ConsumerMetricsService, useValue: metrics },
      ],
    }).compile();

    service = module.get(PersistService);
  });

  it('should skip when job not found', async () => {
    jobRepository.findById.mockResolvedValue(null);
    await expect(service.persistByJobId(JOB_ID)).resolves.toBe('skipped');
  });

  it('should persist on happy path', async () => {
    const job = mockJob();
    jobRepository.findById.mockResolvedValue(job as never);
    jobRepository.transitionStatus
      .mockResolvedValueOnce({ ...job, status: 'persisting' } as never)
      .mockResolvedValueOnce({ ...job, status: 'persisted' } as never);

    await expect(service.persistByJobId(JOB_ID)).resolves.toBe('persisted');
    expect(recipeCreationTransaction.execute).toHaveBeenCalled();
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

    await expect(service.persistByJobId(JOB_ID)).rejects.toThrow(
      RetrievedDataValidationError,
    );
    expect(jobRepository.rollbackPersistingJobWithRetry).toHaveBeenCalledWith(
      JOB_ID,
      'bad data',
    );
  });

  it('should reject invalid persistBatchSize', async () => {
    await expect(service.persist({ persistBatchSize: 0 })).rejects.toThrow(
      PersistBatchSizeError,
    );
  });
});
