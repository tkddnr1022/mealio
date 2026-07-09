import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { KAFKA_TOPICS } from '@mealio/shared';
import { KafkaProducerService } from 'src/integrations/kafka/kafka-producer.service';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeCreationService } from '../../domains/recipe-creation.domain';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';
import { RetrievedDataValidationError } from '../../validators/retrieved-data.validator';
import { PersistService } from '../../services/persist.service';

const JOB_ID = '507f1f77bcf86cd799439011';
const JOB_ID_2 = '507f1f77bcf86cd799439012';

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
    status: 'parse_retrieved',
    retrievedData: validRetrievedData,
    retryCount: 0,
    runId: 'run-1',
    ...overrides,
  };
}

function mockPersistSuccess(
  jobRepository: jest.Mocked<
    Pick<RecipeIngestionJobRepository, 'findById' | 'transitionStatus'>
  >,
  job: ReturnType<typeof mockJob>,
) {
  jobRepository.findById.mockResolvedValue(job as never);
  jobRepository.transitionStatus
    .mockResolvedValueOnce({ ...job, status: 'persisting' } as never)
    .mockResolvedValueOnce({
      ...job,
      status: 'persisted',
      runId: job.runId,
    } as never);
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
      | 'findDistinctRunIdsByStatus'
      | 'findByStatusAndRunId'
      | 'findByStatusAndRunIds'
    >
  >;
  let recipeCreationService: jest.Mocked<
    Pick<RecipeCreationService, 'execute'>
  >;
  let kafkaProducerService: jest.Mocked<Pick<KafkaProducerService, 'emit'>>;
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
      findDistinctRunIdsByStatus: jest.fn(),
      findByStatusAndRunId: jest.fn(),
      findByStatusAndRunIds: jest.fn(),
    };
    recipeCreationService = {
      execute: jest.fn().mockResolvedValue({
        recipeId: 1,
        matchMethods: [],
        newIngredientIds: [],
      }),
    };
    kafkaProducerService = {
      emit: jest.fn().mockResolvedValue(undefined),
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
          provide: RecipeCreationService,
          useValue: recipeCreationService,
        },
        { provide: KafkaProducerService, useValue: kafkaProducerService },
        { provide: ConsumerMetricsService, useValue: metrics },
      ],
    }).compile();

    service = module.get(PersistService);
  });

  it('should skip when job not found', async () => {
    jobRepository.findById.mockResolvedValue(null);
    await expect(service.persistByJobId(JOB_ID)).resolves.toEqual({
      outcome: 'skipped',
    });
    expect(kafkaProducerService.emit).not.toHaveBeenCalled();
  });

  it('should persist on happy path without emitting kafka from persistByJobId', async () => {
    const job = mockJob();
    mockPersistSuccess(jobRepository, job);
    recipeCreationService.execute.mockResolvedValue({
      recipeId: 1,
      matchMethods: ['exact'],
      newIngredientIds: [42],
    });

    await expect(service.persistByJobId(JOB_ID)).resolves.toEqual({
      outcome: 'persisted',
      runId: 'run-1',
    });
    expect(recipeCreationService.execute).toHaveBeenCalled();
    expect(jobRepository.transitionStatus).toHaveBeenNthCalledWith(
      2,
      JOB_ID,
      'persisting',
      'persisted',
      {
        persistedAt: expect.any(Date),
        newIngredientIds: [42],
      },
    );
    expect(kafkaProducerService.emit).not.toHaveBeenCalled();
  });

  it('should emit embed-submit trigger once when persisting by jobId', async () => {
    const job = mockJob();
    mockPersistSuccess(jobRepository, job);

    await service.persist({ jobId: JOB_ID });

    expect(kafkaProducerService.emit).toHaveBeenCalledTimes(1);
    expect(kafkaProducerService.emit).toHaveBeenCalledWith(
      KAFKA_TOPICS.RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED,
      expect.objectContaining({
        runId: 'run-1',
        fetchedCount: 1,
        triggeredAt: expect.any(String),
      }),
      'run-1',
    );
  });

  it('should emit one embed-submit trigger per runId after batch persist', async () => {
    const job1 = mockJob({ _id: new Types.ObjectId(JOB_ID) });
    const job2 = mockJob({
      _id: new Types.ObjectId(JOB_ID_2),
      sourceId: 67890,
    });
    jobRepository.findByStatusAndRunId.mockResolvedValue([job1, job2] as never);
    mockPersistSuccess(jobRepository, job1);
    mockPersistSuccess(jobRepository, job2);

    await service.persist({ runId: 'run-1' });

    expect(kafkaProducerService.emit).toHaveBeenCalledTimes(1);
    expect(kafkaProducerService.emit).toHaveBeenCalledWith(
      KAFKA_TOPICS.RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED,
      expect.objectContaining({
        runId: 'run-1',
        fetchedCount: 2,
        triggeredAt: expect.any(String),
      }),
      'run-1',
    );
  });

  it('should rollback and rethrow on persist failure', async () => {
    const job = mockJob();
    jobRepository.findById.mockResolvedValue(job as never);
    jobRepository.transitionStatus.mockResolvedValueOnce({
      ...job,
      status: 'persisting',
    } as never);
    recipeCreationService.execute.mockRejectedValue(
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
    expect(kafkaProducerService.emit).not.toHaveBeenCalled();
  });
});
