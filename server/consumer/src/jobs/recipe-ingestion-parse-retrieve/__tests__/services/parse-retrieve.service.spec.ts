import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { KAFKA_TOPICS } from '@mealio/shared';
import {
  OpenAIBatchError,
  OpenAIBatchService,
} from 'src/integrations/openai/openai-batch.service';
import { KafkaProducerService } from 'src/integrations/kafka/kafka-producer.service';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';
import {
  ParseRetrieveService,
  parseParseBatchOutputLine,
  parseParseJsonlLines,
} from '../../services/parse-retrieve.service';
import { RecipeIngestionRunScopeError } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.scope';

const JOB_ID_1 = '507f1f77bcf86cd799439011';
const JOB_ID_2 = '507f1f77bcf86cd799439012';
const BATCH_ID = 'batch-xyz';

function mockSubmittedJobsForBatch(
  jobRepository: {
    findDistinctRunIdsByStatus: jest.Mock;
    findDistinctParseBatchIdsByStatus: jest.Mock;
    findByParseBatchId: jest.Mock;
  },
  batchId = BATCH_ID,
  runId = 'run-1',
) {
  jobRepository.findDistinctRunIdsByStatus.mockResolvedValue([runId]);
  jobRepository.findDistinctParseBatchIdsByStatus.mockResolvedValue([batchId]);
  jobRepository.findByParseBatchId.mockImplementation(
    async (_batchId: string, status?: string) => {
      if (status === 'parse_submitted') {
        return [
          {
            _id: new Types.ObjectId(JOB_ID_1),
            status: 'parse_submitted',
            parseBatchId: batchId,
            runId,
          },
        ] as never;
      }
      return [] as never;
    },
  );
}

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
        usage: {
          prompt_tokens: 11,
          completion_tokens: 7,
          total_tokens: 18,
        },
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

describe('ParseRetrieveService', () => {
  let service: ParseRetrieveService;
  let jobRepository: jest.Mocked<
    Pick<
      RecipeIngestionJobRepository,
      | 'findDistinctRunIdsByStatus'
      | 'findDistinctParseBatchIdsByStatus'
      | 'rollbackSubmittedBatchWithRetry'
      | 'transitionManyByParseBatchId'
      | 'transitionStatus'
      | 'rollbackRetrievingJobWithRetry'
      | 'rollbackRetrievingBatchWithRetry'
      | 'findByParseBatchId'
    >
  >;
  let openAiBatchService: jest.Mocked<
    Pick<OpenAIBatchService, 'getBatch' | 'downloadBatchOutput'>
  >;
  let kafkaProducerService: jest.Mocked<Pick<KafkaProducerService, 'emit'>>;
  let metrics: jest.Mocked<
    Pick<
      ConsumerMetricsService,
      | 'recordIngestionStage'
      | 'observeIngestionStageLatency'
      | 'recordLlmTokenUsage'
    >
  >;

  beforeEach(async () => {
    jobRepository = {
      findDistinctRunIdsByStatus: jest.fn(),
      findDistinctParseBatchIdsByStatus: jest.fn(),
      rollbackSubmittedBatchWithRetry: jest.fn(),
      transitionManyByParseBatchId: jest.fn(),
      transitionStatus: jest.fn(),
      rollbackRetrievingJobWithRetry: jest.fn(),
      rollbackRetrievingBatchWithRetry: jest.fn(),
      findByParseBatchId: jest.fn(),
    };
    openAiBatchService = {
      getBatch: jest.fn(),
      downloadBatchOutput: jest.fn(),
    };
    kafkaProducerService = {
      emit: jest.fn().mockResolvedValue(undefined),
    };
    metrics = {
      recordIngestionStage: jest.fn(),
      observeIngestionStageLatency: jest.fn(),
      recordLlmTokenUsage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParseRetrieveService,
        { provide: RecipeIngestionJobRepository, useValue: jobRepository },
        { provide: OpenAIBatchService, useValue: openAiBatchService },
        { provide: KafkaProducerService, useValue: kafkaProducerService },
        { provide: ConsumerMetricsService, useValue: metrics },
      ],
    }).compile();

    service = module.get(ParseRetrieveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('no-op', () => {
    it('should exit when no parse_submitted batches', async () => {
      jobRepository.findDistinctRunIdsByStatus.mockResolvedValue([]);
      jobRepository.findDistinctParseBatchIdsByStatus.mockResolvedValue([]);

      const result = await service.retrieve();

      expect(jobRepository.findDistinctRunIdsByStatus).toHaveBeenCalledWith(
        'parse_submitted',
        1,
      );
      expect(
        jobRepository.findDistinctParseBatchIdsByStatus,
      ).toHaveBeenCalledWith(
        'parse_submitted',
        [],
      );
      expect(result).toEqual({
        batchCount: 0,
        retrievedCount: 0,
        failedCount: 0,
        skippedBatchCount: 0,
      });
      expect(openAiBatchService.getBatch).not.toHaveBeenCalled();
    });

    it('should query parse_submitted batches filtered by runId when runId provided', async () => {
      jobRepository.findDistinctParseBatchIdsByStatus.mockResolvedValue([]);

      await service.retrieve({ runId: 'run-1' });

      expect(jobRepository.findDistinctRunIdsByStatus).not.toHaveBeenCalled();
      expect(
        jobRepository.findDistinctParseBatchIdsByStatus,
      ).toHaveBeenCalledWith(
        'parse_submitted',
        ['run-1'],
      );
    });
  });

  describe('in_progress batch', () => {
    it('should skip without state change', async () => {
      mockSubmittedJobsForBatch(jobRepository);
      openAiBatchService.getBatch.mockResolvedValue({
        id: BATCH_ID,
        status: 'in_progress',
      });

      const result = await service.retrieve();

      expect(result.skippedBatchCount).toBe(1);
      expect(jobRepository.transitionManyByParseBatchId).not.toHaveBeenCalled();
      expect(
        jobRepository.rollbackSubmittedBatchWithRetry,
      ).not.toHaveBeenCalled();
    });
  });

  describe('expired batch', () => {
    it('should rollback parse_submitted jobs with retry', async () => {
      mockSubmittedJobsForBatch(jobRepository);
      openAiBatchService.getBatch.mockResolvedValue({
        id: BATCH_ID,
        status: 'expired',
      });
      jobRepository.rollbackSubmittedBatchWithRetry.mockResolvedValue(2);

      const result = await service.retrieve();

      expect(
        jobRepository.rollbackSubmittedBatchWithRetry,
      ).toHaveBeenCalledWith(BATCH_ID, 'Batch expired');
      expect(result.failedCount).toBe(2);
      expect(result.retrievedCount).toBe(0);
    });
  });

  describe('completed batch', () => {
    const retrievedData = { title: '된장찌개', parseConfidence: 'high' };

    beforeEach(() => {
      mockSubmittedJobsForBatch(jobRepository);
      openAiBatchService.getBatch.mockResolvedValue({
        id: BATCH_ID,
        status: 'completed',
        outputFileId: 'file-output',
      });
      jobRepository.transitionManyByParseBatchId.mockResolvedValue(2);
      jobRepository.findByParseBatchId.mockResolvedValue([]);
    });

    it('should mark jobs parse_retrieved and emit Kafka range payload', async () => {
      const jsonl = [
        JSON.stringify(successLine(JOB_ID_1, retrievedData)),
        JSON.stringify(successLine(JOB_ID_2, { title: '김치찌개' })),
      ].join('\n');
      openAiBatchService.downloadBatchOutput.mockResolvedValue(jsonl);
      jobRepository.transitionStatus
        .mockResolvedValueOnce({
          _id: new Types.ObjectId(JOB_ID_1),
          runId: 'run-1',
        } as never)
        .mockResolvedValueOnce({
          _id: new Types.ObjectId(JOB_ID_2),
          runId: 'run-1',
        } as never);

      const result = await service.retrieve();

      expect(jobRepository.transitionManyByParseBatchId).toHaveBeenCalledWith(
        BATCH_ID,
        'parse_submitted',
        'parse_retrieving',
        undefined,
      );
      expect(jobRepository.transitionStatus).toHaveBeenCalledTimes(2);
      expect(jobRepository.transitionStatus).toHaveBeenCalledWith(
        JOB_ID_1,
        'parse_retrieving',
        'parse_retrieved',
        expect.objectContaining({
          retrievedData,
          parseRetrievedAt: expect.any(Date),
        }),
      );
      expect(kafkaProducerService.emit).toHaveBeenCalledTimes(1);
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.RECIPE_INGESTION_PERSIST_TRIGGERED,
        expect.objectContaining({
          runId: 'run-1',
          fetchedCount: 2,
          triggeredAt: expect.any(String),
        }),
        'run-1',
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
        runId: 'run-1',
      } as never);
      jobRepository.rollbackRetrievingJobWithRetry.mockResolvedValue(true);

      const result = await service.retrieve();

      expect(result.retrievedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(jobRepository.rollbackRetrievingJobWithRetry).toHaveBeenCalledWith(
        JOB_ID_2,
        expect.stringContaining('status_code=500'),
      );
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.RECIPE_INGESTION_PERSIST_TRIGGERED,
        expect.objectContaining({
          runId: 'run-1',
          fetchedCount: 1,
          triggeredAt: expect.any(String),
        }),
        'run-1',
      );
    });

    it('should rollback remaining parse_retrieving jobs missing from output', async () => {
      const jsonl = JSON.stringify(successLine(JOB_ID_1, retrievedData));
      openAiBatchService.downloadBatchOutput.mockResolvedValue(jsonl);
      jobRepository.transitionStatus.mockResolvedValue({
        _id: new Types.ObjectId(JOB_ID_1),
        runId: 'run-1',
      } as never);
      jobRepository.findByParseBatchId.mockResolvedValue([
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

    it('should rollback parse_retrieving batch on download failure', async () => {
      openAiBatchService.downloadBatchOutput.mockRejectedValue(
        new OpenAIBatchError('download failed'),
      );
      jobRepository.rollbackRetrievingBatchWithRetry.mockResolvedValue(2);

      const result = await service.retrieve();

      expect(
        jobRepository.rollbackRetrievingBatchWithRetry,
      ).toHaveBeenCalledWith(BATCH_ID, 'download failed');
      expect(result.failedCount).toBe(2);
    });
  });

  it('should rollback parse_submitted jobs when batch contains multiple runIds', async () => {
    mockSubmittedJobsForBatch(jobRepository);
    jobRepository.findByParseBatchId.mockResolvedValueOnce([
      {
        _id: new Types.ObjectId(JOB_ID_1),
        status: 'parse_submitted',
        parseBatchId: BATCH_ID,
        runId: 'run-1',
      },
      {
        _id: new Types.ObjectId(JOB_ID_2),
        status: 'parse_submitted',
        parseBatchId: BATCH_ID,
        runId: 'run-2',
      },
    ] as never);
    jobRepository.rollbackSubmittedBatchWithRetry.mockResolvedValue(2);

    const result = await service.retrieve();

    expect(jobRepository.rollbackSubmittedBatchWithRetry).toHaveBeenCalledWith(
      BATCH_ID,
      expect.stringContaining('runId:parseBatchId invariant violation'),
    );
    expect(openAiBatchService.getBatch).not.toHaveBeenCalled();
    expect(result.failedCount).toBe(2);
  });

  it('should reject empty runId', async () => {
    await expect(service.retrieve({ runId: '   ' })).rejects.toThrow(
      RecipeIngestionRunScopeError,
    );
    expect(jobRepository.findDistinctRunIdsByStatus).not.toHaveBeenCalled();
  });
});

describe('parseParseBatchOutputLine', () => {
  it('should parse successful completion content as retrievedData', () => {
    const data = { title: 'test', parseConfidence: 'high' };
    const outcome = parseParseBatchOutputLine(successLine(JOB_ID_1, data));

    expect(outcome).toEqual({
      ok: true,
      jobId: JOB_ID_1,
      retrievedData: data,
      usage: { inputTokens: 11, outputTokens: 7, totalTokens: 18 },
    });
  });

  it('should fail on non-200 status_code', () => {
    const outcome = parseParseBatchOutputLine(failureLine(JOB_ID_1));

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.jobId).toBe(JOB_ID_1);
      expect(outcome.errorMessage).toContain('status_code=500');
    }
  });

  it('should fail on invalid custom_id', () => {
    const outcome = parseParseBatchOutputLine({
      custom_id: 'not-an-object-id',
    });

    expect(outcome.ok).toBe(false);
  });

  it('should fail on invalid JSON content', () => {
    const outcome = parseParseBatchOutputLine({
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

describe('parseParseJsonlLines', () => {
  it('should skip empty lines', () => {
    const jsonl = `${JSON.stringify(successLine(JOB_ID_1, { a: 1 }))}\n\n`;
    const lines = parseParseJsonlLines(jsonl);
    expect(lines).toHaveLength(1);
  });
});
