import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import {
  OpenAIBatchError,
  OpenAIBatchService,
} from 'src/integrations/openai/openai-batch.service';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { CategoryContextService } from '../../services/category-context.service';
import {
  SubmitBatchSizeError,
  SubmitService,
  buildBatchJsonlContent,
  buildBatchJsonlLine,
} from '../../services/submit.service';
import { buildRecipeIngestionSystemPrompt } from '../../prompts/recipe-ingestion.system-prompt';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';

const MOCK_BATCH_MODEL = 'gpt-4o-mini-batch';

const mockCategories = {
  recipeCategories: [{ id: 1, key: 'korean', name: '한식', displayOrder: 1 }],
  ingredientCategories: [
    { id: 10, key: 'vegetable', name: '채소', displayOrder: 1 },
  ],
};

function makeJob(
  id: string,
  rawData: Record<string, unknown> = { RCP_SEQ: '1', RCP_NM: 'test' },
) {
  return {
    _id: new Types.ObjectId(id),
    rawData,
  };
}

describe('SubmitService', () => {
  let service: SubmitService;
  let jobRepository: jest.Mocked<
    Pick<
      RecipeIngestionJobRepository,
      | 'findByStatus'
      | 'requeueFailedToFetched'
      | 'transitionManyByIds'
      | 'findManyByIdsAndStatus'
      | 'rollbackSubmittingWithRetry'
    >
  >;
  let categoryContextService: jest.Mocked<
    Pick<CategoryContextService, 'getCategoryContext'>
  >;
  let openAiBatchService: jest.Mocked<
    Pick<OpenAIBatchService, 'getBatchModel' | 'submitBatchJsonl'>
  >;
  let metrics: jest.Mocked<
    Pick<
      ConsumerMetricsService,
      'recordIngestionStage' | 'observeIngestionStageLatency'
    >
  >;

  beforeEach(async () => {
    jobRepository = {
      findByStatus: jest.fn(),
      requeueFailedToFetched: jest.fn(),
      transitionManyByIds: jest.fn(),
      findManyByIdsAndStatus: jest.fn(),
      rollbackSubmittingWithRetry: jest.fn(),
    };
    categoryContextService = {
      getCategoryContext: jest.fn(),
    };
    openAiBatchService = {
      getBatchModel: jest.fn().mockReturnValue(MOCK_BATCH_MODEL),
      submitBatchJsonl: jest.fn(),
    };
    metrics = {
      recordIngestionStage: jest.fn(),
      observeIngestionStageLatency: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitService,
        { provide: RecipeIngestionJobRepository, useValue: jobRepository },
        {
          provide: CategoryContextService,
          useValue: categoryContextService,
        },
        { provide: OpenAIBatchService, useValue: openAiBatchService },
        { provide: ConsumerMetricsService, useValue: metrics },
      ],
    }).compile();

    service = module.get(SubmitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('no-op', () => {
    it('should exit without OpenAI call when no fetched jobs', async () => {
      jobRepository.findByStatus.mockResolvedValue([]);

      const result = await service.submit();

      expect(result).toEqual({ submittedCount: 0, skippedCount: 0 });
      expect(openAiBatchService.submitBatchJsonl).not.toHaveBeenCalled();
      expect(jobRepository.transitionManyByIds).not.toHaveBeenCalled();
    });

    it('should skip jobs without rawData', async () => {
      jobRepository.findByStatus.mockResolvedValue([
        { _id: new Types.ObjectId('507f1f77bcf86cd799439011') },
      ] as never);

      const result = await service.submit();

      expect(result).toEqual({ submittedCount: 0, skippedCount: 1 });
      expect(jobRepository.transitionManyByIds).not.toHaveBeenCalled();
    });
  });

  describe('successful submit', () => {
    const jobId = '507f1f77bcf86cd799439011';
    const job = makeJob(jobId);

    beforeEach(() => {
      jobRepository.findByStatus.mockResolvedValue([job] as never);
      jobRepository.transitionManyByIds
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      jobRepository.findManyByIdsAndStatus.mockResolvedValue([job] as never);
      categoryContextService.getCategoryContext.mockResolvedValue(
        mockCategories,
      );
      openAiBatchService.submitBatchJsonl.mockResolvedValue({
        fileId: 'file-abc',
        batchId: 'batch-xyz',
      });
    });

    it('should upload JSONL, create batch, and mark jobs submitted', async () => {
      const result = await service.submit({ submitBatchSize: 50 });

      expect(jobRepository.findByStatus).toHaveBeenCalledWith('fetched', 50);
      expect(jobRepository.transitionManyByIds).toHaveBeenNthCalledWith(
        1,
        [jobId],
        'fetched',
        'submitting',
      );
      expect(categoryContextService.getCategoryContext).toHaveBeenCalled();

      const jsonlArg = openAiBatchService.submitBatchJsonl.mock.calls[0]?.[0];
      expect(typeof jsonlArg).toBe('string');
      const line = JSON.parse(jsonlArg.split('\n')[0]);
      expect(line.custom_id).toBe(jobId);
      expect(line.body.model).toBe(MOCK_BATCH_MODEL);
      expect(line.body.response_format).toEqual({ type: 'json_object' });

      expect(jobRepository.transitionManyByIds).toHaveBeenNthCalledWith(
        2,
        [jobId],
        'submitting',
        'submitted',
        expect.objectContaining({
          batchId: 'batch-xyz',
          submittedAt: expect.any(Date),
        }),
      );

      expect(result).toEqual({
        submittedCount: 1,
        batchId: 'batch-xyz',
        skippedCount: 0,
      });
    });
  });

  describe('batch failure rollback', () => {
    const jobId = '507f1f77bcf86cd799439011';
    const job = makeJob(jobId);

    beforeEach(() => {
      jobRepository.findByStatus.mockResolvedValue([job] as never);
      jobRepository.transitionManyByIds.mockResolvedValueOnce(1);
      jobRepository.findManyByIdsAndStatus.mockResolvedValue([job] as never);
      categoryContextService.getCategoryContext.mockResolvedValue(
        mockCategories,
      );
      openAiBatchService.submitBatchJsonl.mockRejectedValue(
        new OpenAIBatchError('upload failed'),
      );
      jobRepository.rollbackSubmittingWithRetry.mockResolvedValue(1);
    });

    it('should rollback submitting jobs and increment retry on batch failure', async () => {
      await expect(service.submit()).rejects.toThrow(OpenAIBatchError);

      expect(jobRepository.rollbackSubmittingWithRetry).toHaveBeenCalledWith(
        [jobId],
        'upload failed',
      );
      expect(jobRepository.transitionManyByIds).toHaveBeenCalledTimes(1);
    });
  });

  describe('submitBatchSize validation', () => {
    it('should reject submitBatchSize above maximum', async () => {
      await expect(service.submit({ submitBatchSize: 1001 })).rejects.toThrow(
        SubmitBatchSizeError,
      );
      expect(jobRepository.findByStatus).not.toHaveBeenCalled();
    });
  });
});

describe('buildBatchJsonlLine', () => {
  it('should produce OpenAI Batch JSONL request format', () => {
    const jobId = '507f1f77bcf86cd799439011';
    const rawData = { RCP_SEQ: '42', RCP_NM: '된장찌개' };
    const systemPrompt = buildRecipeIngestionSystemPrompt(mockCategories);

    const line = buildBatchJsonlLine(
      { _id: new Types.ObjectId(jobId), rawData },
      systemPrompt,
      MOCK_BATCH_MODEL,
    );

    expect(line).toEqual({
      custom_id: jobId,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: MOCK_BATCH_MODEL,
        max_completion_tokens: 8192,
        reasoning_effort: 'low',
        verbosity: 'low',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(rawData) },
        ],
      },
    });
  });

  it('should join multiple jobs into JSONL content', () => {
    const systemPrompt = 'test prompt';
    const jobs = [
      makeJob('507f1f77bcf86cd799439011'),
      makeJob('507f1f77bcf86cd799439012'),
    ];

    const content = buildBatchJsonlContent(
      jobs,
      systemPrompt,
      MOCK_BATCH_MODEL,
    );
    const lines = content.split('\n');

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).custom_id).toBe('507f1f77bcf86cd799439011');
    expect(JSON.parse(lines[1]).custom_id).toBe('507f1f77bcf86cd799439012');
  });
});

describe('buildRecipeIngestionSystemPrompt', () => {
  it('should include category lists and parse confidence instructions', () => {
    const prompt = buildRecipeIngestionSystemPrompt(mockCategories);

    expect(prompt).toContain('parseConfidence');
    expect(prompt).toContain('parseIssues');
    expect(prompt).toContain('ingredientAlias');
    expect(prompt).toContain('id=1, key="korean", name="한식"');
    expect(prompt).toContain('id=10, key="vegetable", name="채소"');
    expect(prompt).toContain('~요체');
    expect(prompt).toContain('Servings inference');
    expect(prompt).toContain('Infer from ingredient quantities');
    expect(prompt).toContain('Count over weight/volume');
    expect(prompt).toContain('달걀 30g(1/2개)');
  });
});
