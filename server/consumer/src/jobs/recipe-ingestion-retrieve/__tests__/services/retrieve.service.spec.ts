import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { KAFKA_TOPICS } from '@mealio/shared';
import {
  OpenAIBatchError,
  OpenAIBatchService,
} from 'src/integrations/openai/openai-batch.service';
import { KafkaProducerService } from 'src/integrations/kafka/kafka-producer.service';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import {
  RetrieveService,
  parseBatchOutputLine,
  parseJsonlLines,
} from '../../services/retrieve.service';

const JOB_ID_1 = '507f1f77bcf86cd799439011';
const JOB_ID_2 = '507f1f77bcf86cd799439012';
const BATCH_ID = 'batch-xyz';

function successLine(jobId: string, data: Record<string, unknown>) {
  return {
    custom_id: jobId,
    error: null,
    response: {
      status_code: 200,
      body: {
        choices: [
          {
            message: {
              role: 'assistant',
              content: JSON.stringify(data),
            },
          },
        ],
      },
    },
  };
}

function failureLine(jobId: string, statusCode = 500) {
  return {
    custom_id: jobId,
    error: null,
    response: { status_code: statusCode, body: {} },
  };
}

describe('RetrieveService', () => {
  let service: RetrieveService;
  let jobRepository: jest.Mocked<
    Pick<
      RecipeIngestionJobRepository,
      | 'findDistinctBatchIdsByStatus'
      | 'rollbackSubmittedBatchWithRetry'
      | 'transitionManyByBatchId'
      | 'transitionStatus'
      | 'rollbackRetrievingJobWithRetry'
      | 'rollbackRetrievingBatchWithRetry'
      | 'findByBatchId'
    >
  >;
  let openAiBatchService: jest.Mocked<
    Pick<OpenAIBatchService, 'getBatch' | 'downloadBatchOutput'>
  >;
  let kafkaProducerService: jest.Mocked<Pick<KafkaProducerService, 'emit'>>;

  beforeEach(async () => {
    jobRepository = {
      findDistinctBatchIdsByStatus: jest.fn(),
      rollbackSubmittedBatchWithRetry: jest.fn(),
      transitionManyByBatchId: jest.fn(),
      transitionStatus: jest.fn(),
      rollbackRetrievingJobWithRetry: jest.fn(),
      rollbackRetrievingBatchWithRetry: jest.fn(),
      findByBatchId: jest.fn(),
    };
    openAiBatchService = {
      getBatch: jest.fn(),
      downloadBatchOutput: jest.fn(),
    };
    kafkaProducerService = {
      emit: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetrieveService,
        { provide: RecipeIngestionJobRepository, useValue: jobRepository },
        { provide: OpenAIBatchService, useValue: openAiBatchService },
        { provide: KafkaProducerService, useValue: kafkaProducerService },
      ],
    }).compile();

    service = module.get(RetrieveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('no-op', () => {
    it('should exit when no submitted batches', async () => {
      jobRepository.findDistinctBatchIdsByStatus.mockResolvedValue([]);

      const result = await service.retrieve();

      expect(result).toEqual({
        batchCount: 0,
        retrievedCount: 0,
        failedCount: 0,
        skippedBatchCount: 0,
      });
      expect(openAiBatchService.getBatch).not.toHaveBeenCalled();
    });
  });

  describe('in_progress batch', () => {
    it('should skip without state change', async () => {
      jobRepository.findDistinctBatchIdsByStatus.mockResolvedValue([BATCH_ID]);
      openAiBatchService.getBatch.mockResolvedValue({
        id: BATCH_ID,
        status: 'in_progress',
      });

      const result = await service.retrieve();

      expect(result.skippedBatchCount).toBe(1);
      expect(jobRepository.transitionManyByBatchId).not.toHaveBeenCalled();
      expect(jobRepository.rollbackSubmittedBatchWithRetry).not.toHaveBeenCalled();
    });
  });

  describe('expired batch', () => {
    it('should rollback submitted jobs with retry', async () => {
      jobRepository.findDistinctBatchIdsByStatus.mockResolvedValue([BATCH_ID]);
      openAiBatchService.getBatch.mockResolvedValue({
        id: BATCH_ID,
        status: 'expired',
      });
      jobRepository.rollbackSubmittedBatchWithRetry.mockResolvedValue(2);

      const result = await service.retrieve();

      expect(jobRepository.rollbackSubmittedBatchWithRetry).toHaveBeenCalledWith(
        BATCH_ID,
        'Batch expired',
      );
      expect(result.failedCount).toBe(2);
      expect(result.retrievedCount).toBe(0);
    });
  });

  describe('completed batch', () => {
    const retrievedData = { title: '된장찌개', parseConfidence: 'high' };

    beforeEach(() => {
      jobRepository.findDistinctBatchIdsByStatus.mockResolvedValue([BATCH_ID]);
      openAiBatchService.getBatch.mockResolvedValue({
        id: BATCH_ID,
        status: 'completed',
        outputFileId: 'file-output',
      });
      jobRepository.transitionManyByBatchId.mockResolvedValue(2);
      jobRepository.findByBatchId.mockResolvedValue([]);
    });

    it('should mark jobs retrieved and emit Kafka per success line', async () => {
      const jsonl = [
        JSON.stringify(successLine(JOB_ID_1, retrievedData)),
        JSON.stringify(successLine(JOB_ID_2, { title: '김치찌개' })),
      ].join('\n');
      openAiBatchService.downloadBatchOutput.mockResolvedValue(jsonl);
      jobRepository.transitionStatus.mockResolvedValue({
        _id: new Types.ObjectId(JOB_ID_1),
      } as never);

      const result = await service.retrieve();

      expect(jobRepository.transitionManyByBatchId).toHaveBeenCalledWith(
        BATCH_ID,
        'submitted',
        'retrieving',
      );
      expect(jobRepository.transitionStatus).toHaveBeenCalledTimes(2);
      expect(jobRepository.transitionStatus).toHaveBeenCalledWith(
        JOB_ID_1,
        'retrieving',
        'retrieved',
        expect.objectContaining({
          retrievedData,
          retrievedAt: expect.any(Date),
        }),
      );
      expect(kafkaProducerService.emit).toHaveBeenCalledTimes(2);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.RECIPE_INGESTION_RETRIEVED,
        { jobId: JOB_ID_1 },
        JOB_ID_1,
      );
      expect(result.retrievedCount).toBe(2);
    });

    it('should handle partial failure in JSONL', async () => {
      const jsonl = [
        JSON.stringify(successLine(JOB_ID_1, retrievedData)),
        JSON.stringify(failureLine(JOB_ID_2)),
      ].join('\n');
      openAiBatchService.downloadBatchOutput.mockResolvedValue(jsonl);
      jobRepository.transitionStatus.mockResolvedValue({
        _id: new Types.ObjectId(JOB_ID_1),
      } as never);
      jobRepository.rollbackRetrievingJobWithRetry.mockResolvedValue(true);

      const result = await service.retrieve();

      expect(result.retrievedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(jobRepository.rollbackRetrievingJobWithRetry).toHaveBeenCalledWith(
        JOB_ID_2,
        expect.stringContaining('status_code=500'),
      );
      expect(kafkaProducerService.emit).toHaveBeenCalledTimes(1);
    });

    it('should rollback remaining retrieving jobs missing from output', async () => {
      const jsonl = JSON.stringify(successLine(JOB_ID_1, retrievedData));
      openAiBatchService.downloadBatchOutput.mockResolvedValue(jsonl);
      jobRepository.transitionStatus.mockResolvedValue({
        _id: new Types.ObjectId(JOB_ID_1),
      } as never);
      jobRepository.findByBatchId.mockResolvedValue([
        { _id: new Types.ObjectId(JOB_ID_2) },
      ] as never);
      jobRepository.rollbackRetrievingJobWithRetry.mockResolvedValue(true);

      const result = await service.retrieve();

      expect(jobRepository.rollbackRetrievingJobWithRetry).toHaveBeenCalledWith(
        JOB_ID_2,
        'Missing from batch output',
      );
      expect(result.failedCount).toBe(1);
    });

    it('should rollback retrieving batch on download failure', async () => {
      openAiBatchService.downloadBatchOutput.mockRejectedValue(
        new OpenAIBatchError('download failed'),
      );
      jobRepository.rollbackRetrievingBatchWithRetry.mockResolvedValue(2);

      const result = await service.retrieve();

      expect(jobRepository.rollbackRetrievingBatchWithRetry).toHaveBeenCalledWith(
        BATCH_ID,
        'download failed',
      );
      expect(result.failedCount).toBe(2);
    });
  });
});

describe('parseBatchOutputLine', () => {
  it('should parse successful completion content as retrievedData', () => {
    const data = { title: 'test', parseConfidence: 'high' };
    const outcome = parseBatchOutputLine(successLine(JOB_ID_1, data));

    expect(outcome).toEqual({ ok: true, jobId: JOB_ID_1, retrievedData: data });
  });

  it('should fail on non-200 status_code', () => {
    const outcome = parseBatchOutputLine(failureLine(JOB_ID_1));

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.jobId).toBe(JOB_ID_1);
      expect(outcome.errorMessage).toContain('status_code=500');
    }
  });

  it('should fail on invalid custom_id', () => {
    const outcome = parseBatchOutputLine({ custom_id: 'not-an-object-id' });

    expect(outcome.ok).toBe(false);
  });

  it('should fail on invalid JSON content', () => {
    const outcome = parseBatchOutputLine({
      custom_id: JOB_ID_1,
      error: null,
      response: {
        status_code: 200,
        body: {
          choices: [{ message: { content: 'not-json' } }],
        },
      },
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.errorMessage).toContain('Invalid JSON');
    }
  });
});

describe('parseJsonlLines', () => {
  it('should skip empty lines', () => {
    const jsonl = `${JSON.stringify(successLine(JOB_ID_1, { a: 1 }))}\n\n`;
    const lines = parseJsonlLines(jsonl);
    expect(lines).toHaveLength(1);
  });
});
