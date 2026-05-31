import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  PublicDataApiClient,
  PublicDataApiError,
  PublicDataFetchLimitError,
} from 'src/integrations/public-data/public-data-api.client';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeIngestionStateRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-state.repository';
import { IngestService } from '../../services/ingest.service';

describe('IngestService', () => {
  let service: IngestService;
  let publicDataApiClient: jest.Mocked<
    Pick<PublicDataApiClient, 'assertFetchRangeValid' | 'fetchRecipes'>
  >;
  let jobRepository: jest.Mocked<
    Pick<RecipeIngestionJobRepository, 'upsertIngested' | 'recordIngestFailure'>
  >;
  let stateRepository: jest.Mocked<
    Pick<RecipeIngestionStateRepository, 'getLastEndIdx' | 'setLastEndIdx'>
  >;

  beforeEach(async () => {
    publicDataApiClient = {
      assertFetchRangeValid: jest.fn(),
      fetchRecipes: jest.fn(),
    };
    jobRepository = {
      upsertIngested: jest.fn(),
      recordIngestFailure: jest.fn(),
    };
    stateRepository = {
      getLastEndIdx: jest.fn(),
      setLastEndIdx: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        { provide: PublicDataApiClient, useValue: publicDataApiClient },
        { provide: RecipeIngestionJobRepository, useValue: jobRepository },
        { provide: RecipeIngestionStateRepository, useValue: stateRepository },
      ],
    }).compile();

    service = module.get(IngestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('first ingest (cursor absent)', () => {
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
      jobRepository.upsertIngested.mockResolvedValue({} as never);
      stateRepository.setLastEndIdx.mockResolvedValue({} as never);

      const result = await service.ingest({ ingestFetchLimit: 100 });

      expect(publicDataApiClient.assertFetchRangeValid).toHaveBeenCalledWith(
        1,
        100,
        100,
      );
      expect(publicDataApiClient.fetchRecipes).toHaveBeenCalledWith(1, 100);
      expect(jobRepository.upsertIngested).toHaveBeenCalledTimes(2);
      expect(jobRepository.upsertIngested).toHaveBeenCalledWith('1', {
        RCP_SEQ: '1',
        RCP_NM: 'recipe-1',
      });
      expect(stateRepository.setLastEndIdx).toHaveBeenCalledWith(100);
      expect(result).toEqual({
        startIdx: 1,
        endIdx: 100,
        ingestedCount: 2,
        exhausted: false,
      });
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
      jobRepository.upsertIngested.mockResolvedValue({} as never);
      stateRepository.setLastEndIdx.mockResolvedValue({} as never);

      await service.ingest({ ingestFetchLimit: 100 });
      await service.ingest({ ingestFetchLimit: 100 });

      expect(jobRepository.upsertIngested).toHaveBeenCalledTimes(2);
      expect(jobRepository.upsertIngested).toHaveBeenNthCalledWith(1, '42', {
        RCP_SEQ: '42',
        RCP_NM: 'same-recipe',
      });
      expect(jobRepository.upsertIngested).toHaveBeenNthCalledWith(2, '42', {
        RCP_SEQ: '42',
        RCP_NM: 'same-recipe',
      });
    });
  });

  describe('INFO-200', () => {
    it('should not upsert jobs or advance cursor when data is exhausted', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(500);
      publicDataApiClient.fetchRecipes.mockResolvedValue({
        kind: 'empty',
        code: 'INFO-200',
      });

      const result = await service.ingest({ ingestFetchLimit: 100 });

      expect(publicDataApiClient.fetchRecipes).toHaveBeenCalledWith(501, 600);
      expect(jobRepository.upsertIngested).not.toHaveBeenCalled();
      expect(stateRepository.setLastEndIdx).not.toHaveBeenCalled();
      expect(result).toEqual({
        startIdx: 501,
        endIdx: 600,
        ingestedCount: 0,
        exhausted: true,
      });
    });
  });

  describe('ERROR-336 / fetch limit guard', () => {
    it('should reject ingestFetchLimit above 1000 before API call', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);

      await expect(service.ingest({ ingestFetchLimit: 1001 })).rejects.toThrow(
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
      jobRepository.upsertIngested.mockResolvedValue({} as never);
      stateRepository.setLastEndIdx.mockResolvedValue({} as never);

      const result = await service.ingest({
        ingestFetchLimit: 100,
        maxApiRetries: 3,
      });

      expect(publicDataApiClient.fetchRecipes).toHaveBeenCalledTimes(2);
      expect(result.ingestedCount).toBe(1);
      expect(stateRepository.setLastEndIdx).toHaveBeenCalledWith(100);
    });

    it('should throw after max retries without advancing cursor', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);
      publicDataApiClient.fetchRecipes.mockRejectedValue(
        new PublicDataApiError('ERROR-500', 'Server error', true),
      );

      await expect(
        service.ingest({ ingestFetchLimit: 100, maxApiRetries: 3 }),
      ).rejects.toThrow(PublicDataApiError);

      expect(publicDataApiClient.fetchRecipes).toHaveBeenCalledTimes(3);
      expect(jobRepository.upsertIngested).not.toHaveBeenCalled();
      expect(stateRepository.setLastEndIdx).not.toHaveBeenCalled();
    });

    it('should not retry non-recoverable INFO-100', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);
      publicDataApiClient.fetchRecipes.mockRejectedValue(
        new PublicDataApiError('INFO-100', 'Invalid key', false),
      );

      await expect(
        service.ingest({ ingestFetchLimit: 100, maxApiRetries: 3 }),
      ).rejects.toThrow(PublicDataApiError);

      expect(publicDataApiClient.fetchRecipes).toHaveBeenCalledTimes(1);
      expect(stateRepository.setLastEndIdx).not.toHaveBeenCalled();
    });
  });

  describe('row upsert failure', () => {
    it('should record ingest failure for the sourceId job', async () => {
      stateRepository.getLastEndIdx.mockResolvedValue(0);
      publicDataApiClient.fetchRecipes.mockResolvedValue({
        kind: 'success',
        code: 'INFO-000',
        rows: [{ RCP_SEQ: '99', RCP_NM: 'broken' }],
      });
      jobRepository.upsertIngested.mockRejectedValue(new Error('mongo down'));
      jobRepository.recordIngestFailure.mockResolvedValue({} as never);
      stateRepository.setLastEndIdx.mockResolvedValue({} as never);

      const result = await service.ingest({ ingestFetchLimit: 100 });

      expect(jobRepository.recordIngestFailure).toHaveBeenCalledWith(
        '99',
        'mongo down',
      );
      expect(result.ingestedCount).toBe(0);
      expect(stateRepository.setLastEndIdx).toHaveBeenCalledWith(100);
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
    get: jest.fn((key: string) => {
      if (key === 'PUBLIC_DATA_SERVICE_ID') return 'COOKRCP01';
      if (key === 'PUBLIC_DATA_TYPE') return 'json';
      return undefined;
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    client = new PublicDataApiClient(config);
  });

  it('should build URL matching COOKRCP01/json/{startIdx}/{endIdx}', () => {
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
