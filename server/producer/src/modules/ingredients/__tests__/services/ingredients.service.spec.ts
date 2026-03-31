import { Test, TestingModule } from '@nestjs/testing';
import {
  CACHE_KEY_PREFIX,
  CACHE_KEY_SEGMENT,
  buildCacheKey,
} from '@cook/shared';
import { IngredientQueryService } from '../../ingredients.service';
import { IngredientRepository } from '../../../../infrastructure/database/repositories/postgresql/ingredient.repository';
import { CacheService } from '../../../../infrastructure/cache/cache.service';
import { IngredientCacheStrategy } from '../../../../infrastructure/cache/strategies/ingredient-cache-strategy';

describe('IngredientQueryService', () => {
  let service: IngredientQueryService;
  let ingredientRepository: jest.Mocked<IngredientRepository>;
  let cacheService: jest.Mocked<CacheService>;
  let ingredientCacheStrategy: jest.Mocked<IngredientCacheStrategy>;

  const mockIngredient = {
    id: 1,
    name: '양파',
    category: 1,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const mockCategory = {
    id: 1,
    key: 'VEGETABLE',
    name: '채소',
    displayOrder: 1,
    isActive: true,
  };

  beforeEach(async () => {
    const mockRepo = {
      findManyPaginated: jest.fn().mockResolvedValue({
        data: [mockIngredient],
        total: 1,
      }),
      searchByKeyword: jest.fn().mockResolvedValue([mockIngredient]),
      findActiveCategories: jest.fn().mockResolvedValue([mockCategory]),
    };

    const mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      getOrSet: jest.fn().mockImplementation(async (_strategy, fallback) => {
        return fallback();
      }),
    };

    const mockCacheStrategy = {
      generateKey: jest
        .fn()
        .mockImplementation((...args: (string | number)[]) =>
          buildCacheKey(CACHE_KEY_PREFIX.INGREDIENT, ...args),
        ),
      getTtl: jest.fn().mockReturnValue(86400),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientQueryService,
        { provide: IngredientRepository, useValue: mockRepo },
        { provide: CacheService, useValue: mockCacheService },
        { provide: IngredientCacheStrategy, useValue: mockCacheStrategy },
      ],
    }).compile();

    service = module.get<IngredientQueryService>(IngredientQueryService);
    ingredientRepository = module.get<IngredientRepository>(
      IngredientRepository,
    ) as jest.Mocked<IngredientRepository>;
    cacheService = module.get<CacheService>(
      CacheService,
    ) as jest.Mocked<CacheService>;
    ingredientCacheStrategy = module.get<IngredientCacheStrategy>(
      IngredientCacheStrategy,
    ) as jest.Mocked<IngredientCacheStrategy>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getList', () => {
    it('Repository findManyPaginated를 호출하고 data·pagination을 반환한다', async () => {
      const result = await service.getList({
        page: 1,
        size: 50,
      });

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        ingredientCacheStrategy,
        expect.any(Function),
        CACHE_KEY_SEGMENT.LIST,
        CACHE_KEY_SEGMENT.CATEGORY_ALL,
        1,
        50,
      );
      expect(ingredientRepository.findManyPaginated).toHaveBeenCalledWith({
        category: undefined,
        page: 1,
        size: 50,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 1,
        name: '양파',
        category: 1,
      });
      expect(result.pagination).toEqual({
        page: 1,
        size: 50,
        total: 1,
        totalPages: 1,
      });
    });

    it('category가 있으면 카테고리 필터로 조회한다', async () => {
      await service.getList({ category: 2, page: 1, size: 20 });

      expect(ingredientRepository.findManyPaginated).toHaveBeenCalledWith({
        category: 2,
        page: 1,
        size: 20,
      });
    });

    it('캐시에 데이터가 있으면 Repository를 호출하지 않는다', async () => {
      const cached = {
        data: [{ id: 2, name: '당근', category: 1 }],
        pagination: { page: 1, size: 50, total: 1, totalPages: 1 },
      };
      cacheService.getOrSet.mockResolvedValue(cached);

      const result = await service.getList({ page: 1, size: 50 });

      expect(result).toEqual(cached);
      expect(ingredientRepository.findManyPaginated).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('키워드로 searchByKeyword를 호출하고 data를 반환한다', async () => {
      const result = await service.search('양파');

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        ingredientCacheStrategy,
        expect.any(Function),
        CACHE_KEY_SEGMENT.SEARCH,
        '양파',
      );
      expect(ingredientRepository.searchByKeyword).toHaveBeenCalledWith({
        keyword: '양파',
        take: 50,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 1,
        name: '양파',
        category: 1,
      });
    });

    it('캐시에 검색 결과가 있으면 Repository를 호출하지 않는다', async () => {
      const cached = [{ id: 3, name: '감자', category: 1 }];
      cacheService.getOrSet.mockResolvedValue(cached);

      const result = await service.search('감자');

      expect(result.data).toEqual(cached);
      expect(ingredientRepository.searchByKeyword).not.toHaveBeenCalled();
    });
  });

  describe('getCategories', () => {
    it('활성 카테고리 목록을 조회해 data를 반환한다', async () => {
      const result = await service.getCategories();

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        ingredientCacheStrategy,
        expect.any(Function),
        CACHE_KEY_SEGMENT.CATEGORIES,
      );
      expect(ingredientRepository.findActiveCategories).toHaveBeenCalled();
      expect(result.data).toEqual([mockCategory]);
    });

    it('캐시에 카테고리 목록이 있으면 Repository를 호출하지 않는다', async () => {
      const cached = [mockCategory];
      cacheService.getOrSet.mockResolvedValue(cached);

      const result = await service.getCategories();

      expect(result.data).toEqual(cached);
      expect(ingredientRepository.findActiveCategories).not.toHaveBeenCalled();
    });
  });
});
