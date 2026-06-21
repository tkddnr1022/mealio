import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  PublicDataApiClient,
  PublicDataApiError,
  PublicDataFetchLimitError,
} from 'src/integrations/public-data/public-data-api.client';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeIngestionStateRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-state.repository';
import { ConsumerMetricsService } from 'src/reliability/monitoring/consumer-metrics.service';
import { KafkaProducerService } from 'src/integrations/kafka/kafka-producer.service';
import { KAFKA_TOPICS } from '@mealio/shared';
import { FetchService } from '../../services/fetch.service';

describe('FetchService', () => {
  let service: FetchService;
  let publicDataApiClient: jest.Mocked<
    Pick<PublicDataApiClient, 'assertFetchRangeValid' | 'fetchRecipes'>
  >;
  let jobRepository: jest.Mocked<
    Pick<RecipeIngestionJobRepository, 'upsertFetched' | 'recordFetchFailure'>
  >;
  let stateRepository: jest.Mocked<
    Pick<RecipeIngestionStateRepository, 'getLastEndIdx' | 'setLastEndIdx'>
  >;
  let metrics: jest.Mocked<
    Pick<
      ConsumerMetricsService,
      'recordIngestionStage' | 'observeIngestionStageLatency'
    >
  >;
  let kafkaProducerService: jest.Mocked<Pick<KafkaProducerService, 'emit'>>;

  beforeEach(async () => {
    publicDataApiClient = {
      assertFetchRangeValid: jest.fn(),
      fetchRecipes: jest.fn(),
    };
    jobRepository = {
      upsertFetched: jest.fn(),
      recordFetchFailure: jest.fn(),
    };
    stateRepository = {
      getLastEndIdx: jest.fn(),
      setLastEndIdx: jest.fn(),
    };
    metrics = {
      recordIngestionStage: jest.fn(),
      observeIngestionStageLatency: jest.fn(),
    };
    kafkaProducerService = {
      emit: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FetchService,
        { provide: PublicDataApiClient, useValue: publicDataApiClient },
        { provide: RecipeIngestionJobRepository, useValue: jobRepository },
        { provide: RecipeIngestionStateRepository, useValue: stateRepository },
        { provide: KafkaProducerService, useValue: kafkaProducerService },
        { provide: ConsumerMetricsService, useValue: metrics },
      ],
    }).compile();

    service = module.get(FetchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('first fetch (cursor absent)', () => {
    it('should fetch 1..100, upsert rows, and advance cursor to 100', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);
      publicDataApiClient.fetchRecipes.mockResolvedValue({
        kind: 'success',
        code: 'INFO-000',
        rows: [
          { RCP_SEQ: '1', RCP_NM: 'recipe-1' },
          { RCP_SEQ: '2', RCP_NM: 'recipe-2' },
        ],
      });
      jobRepository.upsertFetched.mockResolvedValue({} as never);
      stateRepository.setLastEndIdx.mockResolvedValue({} as never);

      const result = await service.fetch({ fetchLimit: 100 });

      expect(publicDataApiClient.assertFetchRangeValid).toHaveBeenCalledWith(
        1,
        100,
        100,
      );
      expect(publicDataApiClient.fetchRecipes).toHaveBeenCalledWith(1, 100);
      expect(jobRepository.upsertFetched).toHaveBeenCalledTimes(2);
      expect(jobRepository.upsertFetched).toHaveBeenCalledWith(
        1,
        {
          RCP_SEQ: '1',
          RCP_NM: 'recipe-1',
        },
        expect.any(String),
      );
      expect(stateRepository.setLastEndIdx).toHaveBeenCalledWith(100);
      expect(result).toEqual({
        startIdx: 1,
        endIdx: 100,
        runId: expect.any(String),
        fetchedCount: 2,
        exhausted: false,
      });
      expect(kafkaProducerService.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.RECIPE_INGESTION_FETCH_COMPLETED,
        expect.objectContaining({
          runId: expect.any(String),
          fetchedCount: 2,
          triggeredAt: expect.any(String),
        }),
        expect.any(String),
      );
    });
  });

  describe('idempotent upsert', () => {
    it('should upsert the same RCP_SEQ without duplicate create semantics', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);
      publicDataApiClient.fetchRecipes.mockResolvedValue({
        kind: 'success',
        code: 'INFO-000',
        rows: [{ RCP_SEQ: '42', RCP_NM: 'same-recipe' }],
      });
      jobRepository.upsertFetched.mockResolvedValue({} as never);
      stateRepository.setLastEndIdx.mockResolvedValue({} as never);

      await service.fetch({ fetchLimit: 100 });
      await service.fetch({ fetchLimit: 100 });

      expect(jobRepository.upsertFetched).toHaveBeenCalledTimes(2);
      expect(jobRepository.upsertFetched).toHaveBeenNthCalledWith(
        1,
        42,
        {
          RCP_SEQ: '42',
          RCP_NM: 'same-recipe',
        },
        expect.any(String),
      );
      expect(jobRepository.upsertFetched).toHaveBeenNthCalledWith(
        2,
        42,
        {
          RCP_SEQ: '42',
          RCP_NM: 'same-recipe',
        },
        expect.any(String),
      );
    });
  });

  describe('INFO-200', () => {
    it('should not upsert jobs or advance cursor when data is exhausted', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(500);
      publicDataApiClient.fetchRecipes.mockResolvedValue({
        kind: 'empty',
        code: 'INFO-200',
      });

      const result = await service.fetch({ fetchLimit: 100 });

      expect(publicDataApiClient.fetchRecipes).toHaveBeenCalledWith(501, 600);
      expect(jobRepository.upsertFetched).not.toHaveBeenCalled();
      expect(stateRepository.setLastEndIdx).not.toHaveBeenCalled();
      expect(result).toEqual({
        startIdx: 501,
        endIdx: 600,
        fetchedCount: 0,
        exhausted: true,
      });
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });

  describe('ERROR-336 / fetch limit guard', () => {
    it('should reject fetchLimit above 1000 before API call', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);

      await expect(service.fetch({ fetchLimit: 1001 })).rejects.toThrow(
        PublicDataFetchLimitError,
      );

      expect(publicDataApiClient.fetchRecipes).not.toHaveBeenCalled();
      expect(stateRepository.setLastEndIdx).not.toHaveBeenCalled();
    });
  });

  describe('recoverable API errors', () => {
    it('should retry INFO-300 and succeed without cursor update on failure', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);
      publicDataApiClient.fetchRecipes
        .mockRejectedValueOnce(
          new PublicDataApiError('INFO-300', 'Rate limit', true),
        )
        .mockResolvedValueOnce({
          kind: 'success',
          code: 'INFO-000',
          rows: [{ RCP_SEQ: '7', RCP_NM: 'retry-success' }],
        });
      jobRepository.upsertFetched.mockResolvedValue({} as never);
      stateRepository.setLastEndIdx.mockResolvedValue({} as never);

      const result = await service.fetch({
        fetchLimit: 100,
        maxApiRetries: 3,
      });

      expect(publicDataApiClient.fetchRecipes).toHaveBeenCalledTimes(2);
      expect(result.fetchedCount).toBe(1);
      expect(stateRepository.setLastEndIdx).toHaveBeenCalledWith(100);
    });

    it('should throw after max retries without advancing cursor', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);
      publicDataApiClient.fetchRecipes.mockRejectedValue(
        new PublicDataApiError('ERROR-500', 'Server error', true),
      );

      await expect(
        service.fetch({ fetchLimit: 100, maxApiRetries: 3 }),
      ).rejects.toThrow(PublicDataApiError);

      expect(publicDataApiClient.fetchRecipes).toHaveBeenCalledTimes(3);
      expect(jobRepository.upsertFetched).not.toHaveBeenCalled();
      expect(stateRepository.setLastEndIdx).not.toHaveBeenCalled();
    });

    it('should not retry non-recoverable INFO-100', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);
      publicDataApiClient.fetchRecipes.mockRejectedValue(
        new PublicDataApiError('INFO-100', 'Invalid key', false),
      );

      await expect(
        service.fetch({ fetchLimit: 100, maxApiRetries: 3 }),
      ).rejects.toThrow(PublicDataApiError);

      expect(publicDataApiClient.fetchRecipes).toHaveBeenCalledTimes(1);
      expect(stateRepository.setLastEndIdx).not.toHaveBeenCalled();
    });
  });

  describe('row upsert failure', () => {
    it('should record fetch failure for the sourceId job', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);
      publicDataApiClient.fetchRecipes.mockResolvedValue({
        kind: 'success',
        code: 'INFO-000',
        rows: [{ RCP_SEQ: '99', RCP_NM: 'broken' }],
      });
      jobRepository.upsertFetched.mockRejectedValue(new Error('mongo down'));
      jobRepository.recordFetchFailure.mockResolvedValue({} as never);
      stateRepository.setLastEndIdx.mockResolvedValue({} as never);

      const result = await service.fetch({ fetchLimit: 100 });

      expect(jobRepository.recordFetchFailure).toHaveBeenCalledWith(
        99,
        'mongo down',
      );
      expect(result.fetchedCount).toBe(0);
      expect(stateRepository.setLastEndIdx).toHaveBeenCalledWith(100);
      expect(kafkaProducerService.emit).not.toHaveBeenCalled();
    });
  });
});

describe('PublicDataApiClient', () => {
  let client: PublicDataApiClient;
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'PUBLIC_DATA_API_KEY') return 'test-api-key';
      throw new Error(`Missing ${key}`);
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    client = new PublicDataApiClient(config);
  });

  it('should build URL matching 공공데이터 API json/{startIdx}/{endIdx}', () => {
    const url = client.buildUrl(1, 100);
    expect(url).toBe(
      'http://openapi.foodsafetykorea.go.kr/api/test-api-key/COOKRCP01/json/1/100',
    );
  });

  it('should parse INFO-000 rows from service envelope', () => {
    const result = client.parseResponseBody({
      COOKRCP01: {
        RESULT: { CODE: 'INFO-000', MSG: '정상' },
        row: [{ RCP_SEQ: '1' }, { RCP_SEQ: '2' }],
      },
    });

    expect(result).toEqual({
      kind: 'success',
      code: 'INFO-000',
      rows: [{ RCP_SEQ: '1' }, { RCP_SEQ: '2' }],
    });
  });

  it('should normalize single row object to array', () => {
    const result = client.parseResponseBody({
      COOKRCP01: {
        RESULT: { CODE: 'INFO-000', MSG: '정상' },
        row: { RCP_SEQ: '1' },
      },
    });

    expect(result).toEqual({
      kind: 'success',
      code: 'INFO-000',
      rows: [{ RCP_SEQ: '1' }],
    });
  });

  it('should return empty result for INFO-200', () => {
    const result = client.parseResponseBody({
      COOKRCP01: {
        RESULT: { CODE: 'INFO-200', MSG: '데이터 없음' },
      },
    });

    expect(result).toEqual({ kind: 'empty', code: 'INFO-200' });
  });

  it('should reject fetch range above 1000 rows', () => {
    expect(() => client.assertFetchRangeValid(1, 1001)).toThrow(
      PublicDataFetchLimitError,
    );
  });
});
