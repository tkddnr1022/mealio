import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import {
  OpenAIBatchError,
  OpenAIBatchService,
} from 'src/integrations/openai/openai-batch.service';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { CategoryContextService } from '../../services/category-context.service';
import {
  ParseSubmitService,
  buildParseBatchJsonlContent,
  buildParseBatchJsonlLine,
} from '../../services/parse-submit.service';
import { RecipeIngestionRunScopeError } from 'src/jobs/recipe-ingestion/recipe-ingestion-run.scope';
import { buildRecipeIngestionSystemPrompt } from '../../prompts/recipe-ingestion.system-prompt';
import { RECIPE_INGESTION_PARSE_TEXT_FORMAT } from '../../schemas/recipe-ingestion-parse.schema';
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
  runId = 'run-1',
) {
  return {
    _id: new Types.ObjectId(id),
    rawData,
    runId,
  };
}

describe('ParseSubmitService', () => {
  let service: ParseSubmitService;
  let jobRepository: jest.Mocked<
    Pick<
      RecipeIngestionJobRepository,
      | 'findByStatus'
      | 'findByStatusAndRunId'
      | 'findByStatusAndRunIds'
      | 'findById'
      | 'findDistinctRunIdsByStatus'
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
      findByStatusAndRunId: jest.fn(),
      findByStatusAndRunIds: jest.fn(),
      findById: jest.fn(),
      findDistinctRunIdsByStatus: jest.fn(),
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
        ParseSubmitService,
        { provide: RecipeIngestionJobRepository, useValue: jobRepository },
        {
          provide: CategoryContextService,
          useValue: categoryContextService,
        },
        { provide: OpenAIBatchService, useValue: openAiBatchService },
        { provide: ConsumerMetricsService, useValue: metrics },
      ],
    }).compile();

    service = module.get(ParseSubmitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('no-op', () => {
    it('should exit without OpenAI call when no fetched jobs', async () => {
      jobRepository.findDistinctRunIdsByStatus.mockResolvedValue([]);

      const result = await service.submit();

      expect(jobRepository.findDistinctRunIdsByStatus).toHaveBeenCalledWith(
        'fetched',
        1,
      );
      expect(result).toEqual({ submittedCount: 0, skippedCount: 0 });
      expect(openAiBatchService.submitBatchJsonl).not.toHaveBeenCalled();
      expect(jobRepository.transitionManyByIds).not.toHaveBeenCalled();
    });

    it('should skip jobs without rawData', async () => {
      jobRepository.findDistinctRunIdsByStatus.mockResolvedValue(['run-1']);
      jobRepository.findByStatusAndRunId.mockResolvedValue([
        { _id: new Types.ObjectId('507f1f77bcf86cd799439011') },
      ] as never);

      const result = await service.submit();

      expect(result).toEqual({ submittedCount: 0, skippedCount: 1 });
      expect(jobRepository.transitionManyByIds).not.toHaveBeenCalled();
    });

    it('should skip when fetched→parse_submitting transition loses concurrent race', async () => {
      const jobId = '507f1f77bcf86cd799439011';
      jobRepository.findDistinctRunIdsByStatus.mockResolvedValue(['run-1']);
      jobRepository.findByStatusAndRunId.mockResolvedValue([
        makeJob(jobId),
      ] as never);
      jobRepository.transitionManyByIds.mockResolvedValue(0);
      categoryContextService.getCategoryContext.mockResolvedValue(
        mockCategories,
      );

      const result = await service.submit();

      expect(result).toEqual({ submittedCount: 0, skippedCount: 0 });
      expect(openAiBatchService.submitBatchJsonl).not.toHaveBeenCalled();
      expect(metrics.recordIngestionStage).toHaveBeenCalledWith(
        'parse-submit',
        'skipped',
      );
    });
  });

  describe('successful parse-submit', () => {
    const jobId = '507f1f77bcf86cd799439011';
    const job = makeJob(jobId);

    beforeEach(() => {
      jobRepository.findDistinctRunIdsByStatus.mockResolvedValue(['run-1']);
      jobRepository.findByStatusAndRunId.mockResolvedValue([job] as never);
      jobRepository.findByStatusAndRunIds.mockResolvedValue([job] as never);
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

    it('should upload JSONL, create batch, and mark jobs parse_submitted', async () => {
      const result = await service.submit();

      expect(jobRepository.findByStatusAndRunId).toHaveBeenCalledWith(
        'fetched',
        'run-1',
      );
      expect(jobRepository.transitionManyByIds).toHaveBeenNthCalledWith(
        1,
        [jobId],
        'fetched',
        'parse_submitting',
        undefined,
      );
      expect(categoryContextService.getCategoryContext).toHaveBeenCalled();

      const jsonlArg = openAiBatchService.submitBatchJsonl.mock.calls[0]?.[0];
      expect(typeof jsonlArg).toBe('string');
      const line = JSON.parse(jsonlArg.split('\n')[0]);
      expect(line.custom_id).toBe(jobId);
      expect(line.body.model).toBe(MOCK_BATCH_MODEL);
      expect(line.url).toBe('/v1/responses');
      expect(line.body.text.format.type).toBe('json_schema');
      expect(line.body.text.format.name).toBe('recipe_ingestion_parse');
      expect(line.body.text.format.strict).toBe(true);
      expect(line.body.text.format.schema).toEqual(
        expect.objectContaining({
          type: 'object',
          required: expect.arrayContaining([
            'recipe',
            'ingredients',
            'parseConfidence',
            'parseIssues',
          ]),
        }),
      );

      expect(jobRepository.transitionManyByIds).toHaveBeenNthCalledWith(
        2,
        [jobId],
        'parse_submitting',
        'parse_submitted',
        expect.objectContaining({
          parseBatchId: 'batch-xyz',
          parseSubmittedAt: expect.any(Date),
        }),
      );

      expect(result).toEqual({
        submittedCount: 1,
        batchId: 'batch-xyz',
        skippedCount: 0,
      });
    });

    it('should query fetched jobs with runId when runId provided', async () => {
      const result = await service.submit({
        runId: 'run-1',
      });

      expect(jobRepository.findDistinctRunIdsByStatus).not.toHaveBeenCalled();
      expect(jobRepository.findByStatusAndRunId).toHaveBeenCalledWith(
        'fetched',
        'run-1',
      );
      expect(result.submittedCount).toBe(1);
    });

    it('should reject empty runId', async () => {
      await expect(service.submit({ runId: '   ' })).rejects.toThrow(
        RecipeIngestionRunScopeError,
      );
    });

    it('should parse-submit a single job when jobId provided', async () => {
      jobRepository.findById.mockResolvedValue({
        ...job,
        status: 'fetched',
      } as never);

      const result = await service.submit({ jobId });

      expect(jobRepository.findDistinctRunIdsByStatus).not.toHaveBeenCalled();
      expect(jobRepository.findById).toHaveBeenCalledWith(jobId);
      expect(result.submittedCount).toBe(1);
    });

    it('should no-op when jobId is not fetched', async () => {
      jobRepository.findById.mockResolvedValue({
        ...job,
        status: 'parse_submitted',
      } as never);

      const result = await service.submit({ jobId });

      expect(result).toEqual({ submittedCount: 0, skippedCount: 0 });
      expect(openAiBatchService.submitBatchJsonl).not.toHaveBeenCalled();
    });

    it('should reject jobId with run scope', async () => {
      await expect(service.submit({ jobId, runId: 'run-1' })).rejects.toThrow(
        RecipeIngestionRunScopeError,
      );
    });

    it('should create one batch per runId when multiple runIds are selected', async () => {
      const jobId2 = '507f1f77bcf86cd799439012';
      const run1Job = makeJob(jobId, { RCP_SEQ: '1' }, 'run-1');
      const run2Job = makeJob(jobId2, { RCP_SEQ: '2' }, 'run-2');

      jobRepository.findDistinctRunIdsByStatus.mockResolvedValue([
        'run-1',
        'run-2',
      ]);
      jobRepository.findByStatusAndRunIds.mockResolvedValue([
        run1Job,
        run2Job,
      ] as never);
      jobRepository.transitionManyByIds
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);
      jobRepository.findManyByIdsAndStatus
        .mockResolvedValueOnce([run1Job] as never)
        .mockResolvedValueOnce([run2Job] as never);
      openAiBatchService.submitBatchJsonl
        .mockResolvedValueOnce({
          fileId: 'file-1',
          batchId: 'batch-run-1',
        })
        .mockResolvedValueOnce({
          fileId: 'file-2',
          batchId: 'batch-run-2',
        });

      const result = await service.submit({ runIdCount: 2 });

      expect(openAiBatchService.submitBatchJsonl).toHaveBeenCalledTimes(2);
      expect(jobRepository.transitionManyByIds).toHaveBeenNthCalledWith(
        2,
        [jobId],
        'parse_submitting',
        'parse_submitted',
        expect.objectContaining({ parseBatchId: 'batch-run-1' }),
      );
      expect(jobRepository.transitionManyByIds).toHaveBeenNthCalledWith(
        4,
        [jobId2],
        'parse_submitting',
        'parse_submitted',
        expect.objectContaining({ parseBatchId: 'batch-run-2' }),
      );
      expect(result.submittedCount).toBe(2);
      expect(result.batchId).toBeUndefined();
    });
  });

  describe('batch failure rollback', () => {
    const jobId = '507f1f77bcf86cd799439011';
    const job = makeJob(jobId);

    beforeEach(() => {
      jobRepository.findDistinctRunIdsByStatus.mockResolvedValue(['run-1']);
      jobRepository.findByStatusAndRunId.mockResolvedValue([job] as never);
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

    it('should rollback parse_submitting jobs and increment retry on batch failure', async () => {
      await expect(service.submit()).rejects.toThrow(OpenAIBatchError);

      expect(jobRepository.rollbackSubmittingWithRetry).toHaveBeenCalledWith(
        [jobId],
        'upload failed',
      );
      expect(jobRepository.transitionManyByIds).toHaveBeenCalledTimes(1);
    });
  });
});

describe('buildParseBatchJsonlLine', () => {
  it('should produce OpenAI Batch JSONL request format', () => {
    const jobId = '507f1f77bcf86cd799439011';
    const rawData = { RCP_SEQ: '42', RCP_NM: '된장찌개' };
    const systemPrompt = buildRecipeIngestionSystemPrompt(mockCategories);

    const line = buildParseBatchJsonlLine(
      { _id: new Types.ObjectId(jobId), rawData },
      systemPrompt,
      MOCK_BATCH_MODEL,
    );

    expect(line).toEqual({
      custom_id: jobId,
      method: 'POST',
      url: '/v1/responses',
      body: {
        model: MOCK_BATCH_MODEL,
        max_output_tokens: 8192,
        reasoning: { effort: 'low' },
        text: {
          format: RECIPE_INGESTION_PARSE_TEXT_FORMAT,
          verbosity: 'low',
        },
        instructions: systemPrompt,
        input: JSON.stringify(rawData),
      },
    });
  });

  it('should join multiple jobs into JSONL content', () => {
    const systemPrompt = 'test prompt';
    const jobs = [
      makeJob('507f1f77bcf86cd799439011'),
      makeJob('507f1f77bcf86cd799439012'),
    ];

    const content = buildParseBatchJsonlContent(
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
    expect(prompt).toContain('Difficulty inference');
    expect(prompt).toContain('Cook time inference');
    expect(prompt).toContain('calorie-based inference');
    expect(prompt).toContain('per serving (1인분)');
    expect(prompt).toContain('estimated_total_kcal');
    expect(prompt).toContain('servings fallback to 1');
    expect(prompt).toContain('integer 1-3');
    expect(prompt).toContain('cookingTimeMinutes');
    expect(prompt).toContain('Unit preference (quantity / unit)');
    expect(prompt).toContain('Kitchen-friendly units');
    expect(prompt).toContain('Source context (식품안전나라 등 public API)');
    expect(prompt).toContain('Conversion table');
    expect(prompt).toContain('달걀(30g)');
    expect(prompt).toContain('저염간장(10g)');
    expect(prompt).toContain('Unit quality gate');
  });
});
