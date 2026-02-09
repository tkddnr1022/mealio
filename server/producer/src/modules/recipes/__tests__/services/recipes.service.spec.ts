import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecipeQueryService } from '../../recipes.service';
import { RecipeRepository } from '../../../../infrastructure/database/repositories/postgresql/recipe.repository';
import { CacheService } from '../../../../infrastructure/cache/cache.service';
import { RecipeCacheStrategy } from '../../../../infrastructure/cache/strategies/recipe-cache-strategy';
import { KafkaProducerService } from '../../../../infrastructure/kafka/producer.service';

describe('RecipeQueryService', () => {
  let service: RecipeQueryService;
  let recipeRepository: jest.Mocked<RecipeRepository>;
  let cacheService: jest.Mocked<CacheService>;
  let recipeCacheStrategy: jest.Mocked<RecipeCacheStrategy>;

  const mockRecipe = {
    id: 1,
    title: '김치볶음밥',
    description: '간단한 김치볶음밥',
    difficulty: 1,
    cookTime: 15,
    imageUrl: null,
    servings: 2,
    viewCount: 0,
    isPublished: true,
    instructions: [{ step: 1, content: '재료를 준비한다.' }],
    createdAt: new Date('2025-01-10T10:30:00.000Z'),
    updatedAt: new Date('2025-01-10T10:30:00.000Z'),
    recipeIngredients: [
      {
        id: 1,
        recipeId: 1,
        ingredientId: 1,
        amount: 100,
        unit: 'g',
        isOptional: false,
        ingredient: { id: 1, name: '김치', category: 1, createdAt: new Date() },
      },
    ],
  };

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(mockRecipe),
      findManyPaginated: jest.fn().mockResolvedValue({
        data: [mockRecipe],
        total: 1,
      }),
      searchByKeyword: jest.fn().mockResolvedValue({
        data: [mockRecipe],
        total: 1,
      }),
      findSummariesByIds: jest.fn().mockResolvedValue([mockRecipe]),
    };

    const mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      getOrSet: jest
        .fn()
        .mockImplementation(async (_strategy, fallback, ..._args) => {
          return fallback();
        }),
    };

    const mockCacheStrategy = {
      generateKey: jest
        .fn()
        .mockImplementation((...args) => `recipe:${args.join(':')}`),
      getTtl: jest.fn().mockReturnValue(3600),
    };

    const mockKafkaProducer = { emit: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeQueryService,
        { provide: RecipeRepository, useValue: mockRepo },
        { provide: CacheService, useValue: mockCacheService },
        { provide: RecipeCacheStrategy, useValue: mockCacheStrategy },
        { provide: KafkaProducerService, useValue: mockKafkaProducer },
      ],
    }).compile();

    service = module.get<RecipeQueryService>(RecipeQueryService);
    recipeRepository = module.get<RecipeRepository>(
      RecipeRepository,
    ) as jest.Mocked<RecipeRepository>;
    cacheService = module.get<CacheService>(
      CacheService,
    ) as jest.Mocked<CacheService>;
    recipeCacheStrategy = module.get<RecipeCacheStrategy>(
      RecipeCacheStrategy,
    ) as jest.Mocked<RecipeCacheStrategy>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getList', () => {
    it('페이지·사이즈·정렬로 목록과 페이지네이션을 반환한다', async () => {
      const result = await service.getList({
        page: 1,
        size: 20,
        sort: 'latest',
      });

      expect(recipeRepository.findManyPaginated).toHaveBeenCalledWith({
        page: 1,
        size: 20,
        difficulty: undefined,
        maxCookTime: undefined,
        sort: 'latest',
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].title).toBe('김치볶음밥');
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.size).toBe(20);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('difficulty, cookTime, sort를 전달하면 repository에 전달한다', async () => {
      await service.getList({
        page: 2,
        size: 10,
        difficulty: [1, 2],
        cookTime: 30,
        sort: 'cookTime',
      });

      expect(recipeRepository.findManyPaginated).toHaveBeenCalledWith({
        page: 2,
        size: 10,
        difficulty: [1, 2],
        maxCookTime: 30,
        sort: 'cookTime',
      });
    });
  });

  describe('getById', () => {
    it('recipeId로 조회하여 RecipeDetailDto를 반환한다', async () => {
      const result = await service.getById(1);

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        recipeCacheStrategy,
        expect.any(Function),
        1,
      );
      expect(recipeRepository.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.title).toBe('김치볶음밥');
      expect(result.instructions).toHaveLength(1);
      expect(result.ingredients).toHaveLength(1);
      expect(result.ingredients[0].name).toBe('김치');
      expect(result.ingredients[0].amount).toBe(100);
    });

    it('레시피가 없으면 NotFoundException을 던진다', async () => {
      recipeRepository.findById.mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow(NotFoundException);
      await expect(service.getById(999)).rejects.toThrow('Recipe not found');
    });

    it('캐시에서 조회된 경우 DB를 호출하지 않는다', async () => {
      const cachedDetail = {
        id: 1,
        title: '캐시된 레시피',
        description: null,
        difficulty: 1,
        cookTime: 15,
        imageUrl: null,
        servings: 2,
        viewCount: 0,
        isPublished: true,
        createdAt: new Date(),
        instructions: [],
        ingredients: [],
      };
      cacheService.getOrSet.mockResolvedValue(cachedDetail);

      const result = await service.getById(1);

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result.title).toBe('캐시된 레시피');
      expect(recipeRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('getSummariesByIds', () => {
    it('ids로 레시피 요약 목록을 반환한다', async () => {
      const result = await service.getSummariesByIds([1, 2]);

      expect(recipeRepository.findSummariesByIds).toHaveBeenCalledWith([1, 2]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe('김치볶음밥');
    });

    it('ids가 빈 배열이면 빈 배열을 반환한다', async () => {
      const result = await service.getSummariesByIds([]);

      expect(recipeRepository.findSummariesByIds).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('search', () => {
    it('키워드로 검색하여 목록과 페이지네이션을 반환한다', async () => {
      const result = await service.search({
        q: '김치',
        page: 1,
        size: 20,
      });

      expect(recipeRepository.searchByKeyword).toHaveBeenCalledWith({
        keyword: '김치',
        page: 1,
        size: 20,
      });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('키워드 앞뒤 공백을 trim하여 전달한다', async () => {
      await service.search({ q: '  김치  ', page: 1, size: 20 });

      expect(recipeRepository.searchByKeyword).toHaveBeenCalledWith({
        keyword: '김치',
        page: 1,
        size: 20,
      });
    });
  });
});
