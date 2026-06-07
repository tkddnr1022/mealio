import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  CACHE_KEY_PREFIX,
  CACHE_KEY_SEGMENT,
  KAFKA_TOPICS,
  RedisService,
  buildCacheKey,
} from '@mealio/shared';
import { RecipeQueryService } from '../../recipes.service';
import { RecipeRepository } from '../../../../infrastructure/database/repositories/postgresql/recipe.repository';
import { CacheService } from '../../../../infrastructure/cache/cache.service';
import { RecipeCacheStrategy } from '../../../../infrastructure/cache/strategies/recipe-cache-strategy';
import { RecommendationCacheStrategy } from '../../../../infrastructure/cache/strategies/recommendation-cache-strategy';
import { KafkaProducerService } from '../../../../infrastructure/kafka/producer.service';

/** search()의 fire-and-forget activity emit 완료 대기 */
async function flushActivityEventQueue(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe('RecipeQueryService', () => {
  let service: RecipeQueryService;
  let recipeRepository: jest.Mocked<RecipeRepository>;
  let cacheService: jest.Mocked<CacheService>;
  let recipeCacheStrategy: jest.Mocked<RecipeCacheStrategy>;
  let kafkaProducer: { emit: jest.Mock };
  let redisClient: { set: jest.Mock };

  const mockRecipe = {
    id: 1,
    categoryId: 1,
    categoryMeta: {
      id: 1,
      key: 'KOREAN',
      name: '한식',
    },
    title: '김치볶음밥',
    description: '간단한 김치볶음밥',
    difficulty: 1,
    cookTime: 15,
    imageUrl: null,
    servings: 2,
    viewCount: 0,
    likeCount: 0,
    isPublished: true,
    instructions: [{ step: 1, content: '재료를 준비한다.' }],
    cookingMethod: '볶기',
    dishType: '밥',
    nutrition: {
      calories: 420,
      carbohydrates: 55,
      protein: 12,
      fat: 16,
      sodium: 780,
    },
    cookingTip: '저염 김치를 사용하면 나트륨을 줄일 수 있습니다.',
    source: 'mealio',
    sourceRecipeId: 'seed-1',
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
        ingredient: {
          id: 1,
          name: '김치',
          categoryId: 1,
          createdAt: new Date(),
        },
      },
    ],
  };

  const mockCategory = {
    id: 1,
    key: 'KOREAN',
    name: '한식',
    displayOrder: 1,
    isActive: true,
  };

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(mockRecipe),
      findManyPaginated: jest.fn().mockResolvedValue({
        data: [mockRecipe],
        total: 1,
      }),
      findPublishedIdsByPopularity: jest.fn().mockResolvedValue([3, 2, 1]),
      existsPublishedById: jest.fn().mockResolvedValue(true),
      searchByKeyword: jest.fn().mockResolvedValue({
        data: [mockRecipe],
        total: 1,
      }),
      findSummariesByIds: jest.fn().mockResolvedValue([mockRecipe]),
      findActiveCategories: jest.fn().mockResolvedValue([mockCategory]),
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
        .mockImplementation((...args: (string | number)[]) =>
          buildCacheKey(CACHE_KEY_PREFIX.RECIPE, ...args),
        ),
      getTtl: jest.fn().mockReturnValue(60),
    };
    const mockRecommendationCacheStrategy = {
      generateKey: jest.fn().mockReturnValue('recommendation:1'),
      getTtl: jest.fn().mockReturnValue(3600),
    };

    const mockKafkaProducer = { emit: jest.fn().mockResolvedValue(undefined) };
    const mockRedisClient = {
      set: jest.fn().mockResolvedValue('OK'),
    };
    const mockRedisService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeQueryService,
        { provide: RecipeRepository, useValue: mockRepo },
        { provide: CacheService, useValue: mockCacheService },
        { provide: RecipeCacheStrategy, useValue: mockCacheStrategy },
        {
          provide: RecommendationCacheStrategy,
          useValue: mockRecommendationCacheStrategy,
        },
        { provide: KafkaProducerService, useValue: mockKafkaProducer },
        { provide: RedisService, useValue: mockRedisService },
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
    kafkaProducer = module.get(KafkaProducerService);
    redisClient = module.get(RedisService).getClient();
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

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        recipeCacheStrategy,
        expect.any(Function),
        CACHE_KEY_SEGMENT.LIST,
        CACHE_KEY_SEGMENT.ALL,
        `${CACHE_KEY_SEGMENT.ALL}-${CACHE_KEY_SEGMENT.ALL}`,
        'latest',
        1,
        20,
      );
      expect(recipeRepository.findManyPaginated).toHaveBeenCalledWith({
        page: 1,
        size: 20,
        difficulty: undefined,
        minCookTime: undefined,
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

    it('difficulty, cookTime range, sort를 전달하면 repository에 전달한다', async () => {
      await service.getList({
        page: 2,
        size: 10,
        difficulty: [1, 2],
        cookTimeMin: 10,
        cookTimeMax: 30,
        sort: 'cookTime',
      });

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        recipeCacheStrategy,
        expect.any(Function),
        CACHE_KEY_SEGMENT.LIST,
        '1,2',
        '10-30',
        'cookTime',
        2,
        10,
      );
      expect(recipeRepository.findManyPaginated).toHaveBeenCalledWith({
        page: 2,
        size: 10,
        difficulty: [1, 2],
        minCookTime: 10,
        maxCookTime: 30,
        sort: 'cookTime',
      });
    });

    it('cookTimeMin만 전달하면 캐시 키와 repository에 min만 반영한다', async () => {
      await service.getList({
        page: 1,
        size: 20,
        cookTimeMin: 12,
      });

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        recipeCacheStrategy,
        expect.any(Function),
        CACHE_KEY_SEGMENT.LIST,
        CACHE_KEY_SEGMENT.ALL,
        `12-${CACHE_KEY_SEGMENT.ALL}`,
        'latest',
        1,
        20,
      );
      expect(recipeRepository.findManyPaginated).toHaveBeenCalledWith({
        page: 1,
        size: 20,
        difficulty: undefined,
        minCookTime: 12,
        maxCookTime: undefined,
        sort: 'latest',
      });
    });

    it('viewCount 정렬도 공통 캐시 전략을 사용한다', async () => {
      await service.getList({
        page: 1,
        size: 20,
        sort: 'viewCount',
      });

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        recipeCacheStrategy,
        expect.any(Function),
        CACHE_KEY_SEGMENT.LIST,
        CACHE_KEY_SEGMENT.ALL,
        `${CACHE_KEY_SEGMENT.ALL}-${CACHE_KEY_SEGMENT.ALL}`,
        'viewCount',
        1,
        20,
      );
    });

    it('캐시 히트 시 repository를 호출하지 않는다', async () => {
      const cached = {
        data: [
          {
            id: 99,
            title: '캐시된 레시피',
            description: null,
            difficulty: 1,
            cookTime: 10,
            imageUrl: null,
            servings: 1,
            viewCount: 0,
            likeCount: 0,
            isPublished: true,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
          },
        ],
        pagination: {
          page: 1,
          size: 20,
          total: 1,
          totalPages: 1,
        },
      };
      cacheService.getOrSet.mockResolvedValue(cached);

      const result = await service.getList({
        page: 1,
        size: 20,
        sort: 'latest',
      });

      expect(result).toEqual(cached);
      expect(recipeRepository.findManyPaginated).not.toHaveBeenCalled();
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
      expect(result.cookingMethod).toBe('볶기');
      expect(result.dishType).toBe('밥');
      expect(result.nutrition?.calories).toBe(420);
      expect(result.cookingTip).toContain('저염');
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
        likeCount: 0,
        isPublished: true,
        createdAt: new Date(),
        categoryId: 1,
        categoryName: '한식',
        cookingMethod: null,
        dishType: null,
        nutrition: null,
        cookingTip: null,
        source: null,
        sourceRecipeId: null,
        instructions: [],
        ingredients: [],
      };
      cacheService.getOrSet.mockResolvedValue(cachedDetail);

      const result = await service.getById(1);

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result.title).toBe('캐시된 레시피');
      expect(recipeRepository.findById).not.toHaveBeenCalled();
    });

    it('상세 조회에서는 recipe.view 이벤트를 발행하지 않는다', async () => {
      await service.getById(1);

      expect(kafkaProducer.emit).not.toHaveBeenCalledWith(
        KAFKA_TOPICS.ACTIVITY_EVENTS,
        expect.objectContaining({
          type: 'recipe.view',
        }),
        expect.anything(),
      );
    });
  });

  describe('recordRecipeView', () => {
    it('dedupe 선점에 성공하면 recipe.view 이벤트를 발행한다', async () => {
      await service.recordRecipeView(1, {
        userId: 7,
        ipAddress: '127.0.0.1',
        userAgent: 'jest-agent',
      });

      expect(recipeRepository.existsPublishedById).toHaveBeenCalledWith(1);
      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining('dedupe:recipe:view:1:user:7'),
        '1',
        'EX',
        1800,
        'NX',
      );
      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.ACTIVITY_EVENTS,
        expect.objectContaining({
          type: 'recipe.view',
          entity: expect.objectContaining({
            type: 'recipe',
            id: 1,
          }),
        }),
        '1',
      );
    });

    it('dedupe 선점에 실패하면 이벤트를 발행하지 않는다', async () => {
      redisClient.set.mockResolvedValue(null);

      await service.recordRecipeView(1, {});

      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining('dedupe:recipe:view:1:ip:unknown-ip'),
        '1',
        'EX',
        1800,
        'NX',
      );
      expect(kafkaProducer.emit).not.toHaveBeenCalled();
    });
  });

  describe('recordSearchClick', () => {
    it('dedupe 선점에 성공하면 search.click 이벤트를 발행한다', async () => {
      await service.recordSearchClick(1, {
        userId: 7,
        ipAddress: '127.0.0.1',
        userAgent: 'jest-agent',
      });

      expect(recipeRepository.existsPublishedById).toHaveBeenCalledWith(1);
      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining('dedupe:search:click:1:user:7'),
        '1',
        'EX',
        1800,
        'NX',
      );
      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.ACTIVITY_EVENTS,
        expect.objectContaining({
          type: 'search.click',
          entity: expect.objectContaining({
            type: 'recipe',
            id: 1,
          }),
          metadata: expect.objectContaining({
            source: 'recipe_search',
          }),
        }),
        '1',
      );
    });

    it('dedupe 선점에 실패하면 search.click 이벤트를 발행하지 않는다', async () => {
      redisClient.set.mockResolvedValue(null);

      await service.recordSearchClick(1, {});

      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining('dedupe:search:click:1:ip:unknown-ip'),
        '1',
        'EX',
        1800,
        'NX',
      );
      expect(kafkaProducer.emit).not.toHaveBeenCalled();
    });

    it('dedupe Redis 오류 시 search.click을 fail-open으로 발행한다', async () => {
      redisClient.set.mockRejectedValue(new Error('redis down'));

      await service.recordSearchClick(1, { userId: 3 });

      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.ACTIVITY_EVENTS,
        expect.objectContaining({ type: 'search.click' }),
        '1',
      );
    });

    it('레시피가 없으면 NotFoundException을 던진다', async () => {
      recipeRepository.existsPublishedById.mockResolvedValue(false);

      await expect(service.recordSearchClick(999, {})).rejects.toThrow(
        NotFoundException,
      );
      expect(kafkaProducer.emit).not.toHaveBeenCalled();
    });
  });

  describe('getStaticIds', () => {
    it('정적 경로 생성용 레시피 ID 목록을 반환한다', async () => {
      const result = await service.getStaticIds(100);

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        recipeCacheStrategy,
        expect.any(Function),
        CACHE_KEY_SEGMENT.LIST,
        'static-ids',
        100,
      );
      expect(recipeRepository.findPublishedIdsByPopularity).toHaveBeenCalledWith({
        size: 100,
      });
      expect(result).toEqual({ data: [3, 2, 1] });
    });

    it('캐시 히트 시 repository를 호출하지 않는다', async () => {
      cacheService.getOrSet.mockResolvedValue([10, 9, 8]);

      const result = await service.getStaticIds(3);

      expect(result).toEqual({ data: [10, 9, 8] });
      expect(recipeRepository.findPublishedIdsByPopularity).not.toHaveBeenCalled();
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
      await flushActivityEventQueue();

      expect(recipeRepository.searchByKeyword).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: '김치',
          page: 1,
          size: 20,
          sort: 'latest',
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining('dedupe:search:query:김치:ip:unknown-ip'),
        '1',
        'EX',
        1800,
        'NX',
      );
      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.ACTIVITY_EVENTS,
        expect.objectContaining({
          type: 'search.query',
          payload: {
            keyword: '김치',
            page: 1,
            size: 20,
            sort: 'latest',
            difficulty: undefined,
            minCookTime: undefined,
            maxCookTime: undefined,
            categoryId: undefined,
          },
        }),
      );
    });

    it('dedupe 선점에 실패하면 search.query 이벤트를 발행하지 않는다', async () => {
      redisClient.set.mockResolvedValue(null);

      await service.search({ q: '김치', page: 1, size: 20 });
      await flushActivityEventQueue();

      expect(kafkaProducer.emit).not.toHaveBeenCalled();
    });

    it('dedupe Redis 오류 시 search.query를 fail-open으로 발행한다', async () => {
      redisClient.set.mockRejectedValue(new Error('redis down'));

      await service.search({ q: '김치', page: 1, size: 20 });
      await flushActivityEventQueue();

      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.ACTIVITY_EVENTS,
        expect.objectContaining({ type: 'search.query' }),
      );
    });

    it('키워드 앞뒤 공백을 trim하여 전달한다', async () => {
      await service.search({ q: '  김치  ', page: 1, size: 20 });

      expect(recipeRepository.searchByKeyword).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: '김치',
          page: 1,
          size: 20,
          sort: 'latest',
        }),
      );
    });

    it('search.query payload에 필터·페이지 정보를 포함한다', async () => {
      await service.search({
        q: '볶음',
        page: 2,
        size: 10,
        difficulty: [2, 3],
        cookTimeMin: 15,
        cookTimeMax: 45,
        categoryId: 3,
        sort: 'cookTime',
      });
      await flushActivityEventQueue();

      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.ACTIVITY_EVENTS,
        expect.objectContaining({
          type: 'search.query',
          payload: {
            keyword: '볶음',
            page: 2,
            size: 10,
            sort: 'cookTime',
            difficulty: [2, 3],
            minCookTime: 15,
            maxCookTime: 45,
            categoryId: 3,
          },
        }),
      );
    });

    it('난이도·조리시간·카테고리·정렬을 repository에 전달한다', async () => {
      await service.search({
        q: '볶음',
        page: 2,
        size: 10,
        difficulty: [2, 3],
        cookTimeMin: 15,
        cookTimeMax: 45,
        categoryId: 3,
        sort: 'cookTime',
      });

      expect(recipeRepository.searchByKeyword).toHaveBeenCalledWith({
        keyword: '볶음',
        page: 2,
        size: 10,
        difficulty: [2, 3],
        minCookTime: 15,
        maxCookTime: 45,
        categoryId: 3,
        sort: 'cookTime',
      });
    });

    it('키워드 없이 필터만 적용해 검색한다', async () => {
      await service.search({
        page: 1,
        size: 15,
        categoryId: 2,
        sort: 'latest',
      });

      expect(recipeRepository.searchByKeyword).toHaveBeenCalledWith({
        keyword: undefined,
        page: 1,
        size: 15,
        difficulty: undefined,
        minCookTime: undefined,
        maxCookTime: undefined,
        categoryId: 2,
        sort: 'latest',
      });
      await flushActivityEventQueue();
      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.ACTIVITY_EVENTS,
        expect.objectContaining({
          type: 'search.query',
          payload: expect.objectContaining({
            keyword: undefined,
            page: 1,
            size: 15,
            categoryId: 2,
          }),
        }),
      );
      expect(redisClient.set).toHaveBeenCalledWith(
        expect.stringContaining(
          'dedupe:search:query:__no_keyword__:ip:unknown-ip',
        ),
        '1',
        'EX',
        1800,
        'NX',
      );
    });

    it('cookTimeMax만 전달하면 max만 반영해 검색한다', async () => {
      await service.search({
        q: '국',
        page: 1,
        size: 20,
        cookTimeMax: 25,
      });

      expect(recipeRepository.searchByKeyword).toHaveBeenCalledWith({
        keyword: '국',
        page: 1,
        size: 20,
        difficulty: undefined,
        minCookTime: undefined,
        maxCookTime: 25,
        categoryId: undefined,
        sort: 'latest',
      });
    });
  });

  describe('getCategories', () => {
    it('활성 레시피 카테고리 목록을 조회해 data를 반환한다', async () => {
      const result = await service.getCategories();

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        recipeCacheStrategy,
        expect.any(Function),
        CACHE_KEY_SEGMENT.CATEGORIES,
      );
      expect(recipeRepository.findActiveCategories).toHaveBeenCalled();
      expect(result.data).toEqual([mockCategory]);
    });

    it('캐시에 카테고리 목록이 있으면 Repository를 호출하지 않는다', async () => {
      const cached = [mockCategory];
      cacheService.getOrSet.mockResolvedValue(cached);

      const result = await service.getCategories();

      expect(result.data).toEqual(cached);
      expect(recipeRepository.findActiveCategories).not.toHaveBeenCalled();
    });
  });
});
