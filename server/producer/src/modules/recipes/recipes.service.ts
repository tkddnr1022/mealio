import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ActivityEventType,
  CACHE_KEY_SEGMENT,
  cacheKeyDedupeRecipeView,
  cacheKeyDedupeSearchClick,
  cacheKeyDedupeSearchQuery,
  KAFKA_TOPICS,
  RedisService,
} from '@mealio/shared';
import {
  RecipeRepository,
  RecipeSearchParams,
  RecipeWithStats,
} from '../../infrastructure/database/repositories/postgresql/recipe.repository';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { RecipeCacheStrategy } from '../../infrastructure/cache/strategies/recipe-cache-strategy';
import { RecommendationCacheStrategy } from '../../infrastructure/cache/strategies/recommendation-cache-strategy';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { RecipeSummaryDto } from './dto/recipe-summary.dto';
import { RecommendedRecipeItemDto } from './dto/recommended-recipe-item.dto';
import {
  RecipeDetailDto,
  RecipeIngredientItemDto,
  RecipeInstructionStepDto,
  RecipeNutritionDto,
} from './dto/recipe-detail.dto';
import { PaginationDto } from './dto/pagination.dto';
import { RecipeCategoryDto } from './dto/recipe-category.dto';
import {
  DEFAULT_RECIPE_SORT,
  RecipeListOrder,
} from './policies/recipe-sort.policy';

export interface ActivityContext {
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
}

type RecipeWithIngredients = RecipeWithStats & {
  categoryMeta: { id: number; key: string; name: string };
  recipeIngredients: Array<{
    id: number;
    amount: unknown;
    unit: string | null;
    isOptional: boolean;
    ingredient: { id: number; name: string };
  }>;
};

@Injectable()
export class RecipeQueryService {
  private readonly logger = new Logger(RecipeQueryService.name);

  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly cacheService: CacheService,
    private readonly recipeCacheStrategy: RecipeCacheStrategy,
    private readonly recommendationCacheStrategy: RecommendationCacheStrategy,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly redisService: RedisService,
  ) {}

  private static readonly ACTIVITY_DEDUPE_TTL_SECONDS = 60 * 30;

  /** keyword-only search.query dedupe (키워드 없음 필터 검색) */
  private static readonly SEARCH_QUERY_NO_KEYWORD = '__no_keyword__';

  private buildActorKey(context: ActivityContext = {}): string {
    const normalizedIp = context.ipAddress?.trim() || 'unknown-ip';
    return typeof context.userId === 'number' && context.userId > 0
      ? `user:${context.userId}`
      : `ip:${normalizedIp}`;
  }

  private async tryAcquireDedupeSlot(
    dedupeKey: string,
    eventLabel: string,
  ): Promise<boolean> {
    try {
      const setResult = await this.redisService
        .getClient()
        .set(
          dedupeKey,
          '1',
          'EX',
          RecipeQueryService.ACTIVITY_DEDUPE_TTL_SECONDS,
          'NX',
        );
      return setResult === 'OK';
    } catch (error) {
      this.logger.warn(
        `${eventLabel} dedupe failed, fallback emit key=${dedupeKey}`,
        error as Error,
      );
      return true;
    }
  }

  async getRecommended(
    userId: number,
    limit: number,
  ): Promise<{ data: RecommendedRecipeItemDto[] }> {
    const normalizedLimit = Math.min(Math.max(limit, 1), 30);

    const cached = await this.cacheService.getOrSet(
      this.recommendationCacheStrategy,
      async () => {
        const fromSsot = await this.recipeRepository.findRecommendedByUser(
          userId,
          30,
        );

        return fromSsot.map((item) => ({
          recipe: this.toSummaryDto(item.recipe),
          rank: item.rank,
          score: item.score,
          reason: item.reason,
          calculatedAt: item.calculatedAt,
        }));
      },
      userId,
    );

    return {
      data: cached.slice(0, normalizedLimit),
    };
  }

  async getList(params: {
    page: number;
    size: number;
    difficulty?: number[];
    cookTimeMin?: number;
    cookTimeMax?: number;
    sort?: RecipeListOrder;
  }): Promise<{ data: RecipeSummaryDto[]; pagination: PaginationDto }> {
    const difficultyKey =
      params.difficulty && params.difficulty.length > 0
        ? [...params.difficulty].sort((a, b) => a - b).join(',')
        : CACHE_KEY_SEGMENT.ALL;
    const cookTimeRangeKey = `${params.cookTimeMin ?? CACHE_KEY_SEGMENT.ALL}-${params.cookTimeMax ?? CACHE_KEY_SEGMENT.ALL}`;
    const sortKey = params.sort ?? DEFAULT_RECIPE_SORT;

    return this.cacheService.getOrSet(
      this.recipeCacheStrategy,
      async () => {
        const { data, total } = await this.recipeRepository.findManyPaginated({
          page: params.page,
          size: params.size,
          difficulty: params.difficulty,
          minCookTime: params.cookTimeMin,
          maxCookTime: params.cookTimeMax,
          sort: sortKey,
        });

        const totalPages = Math.ceil(total / params.size) || 1;

        return {
          data: data.map((r) => this.toSummaryDto(r)),
          pagination: {
            page: params.page,
            size: params.size,
            total,
            totalPages,
          },
        };
      },
      CACHE_KEY_SEGMENT.LIST,
      difficultyKey,
      cookTimeRangeKey,
      sortKey,
      params.page,
      params.size,
    );
  }

  async getStaticIds(size: number): Promise<{ data: number[] }> {
    const data = await this.cacheService.getOrSet(
      this.recipeCacheStrategy,
      async () =>
        this.recipeRepository.findPublishedIdsLatest({
          size,
        }),
      CACHE_KEY_SEGMENT.LIST,
      'static-ids',
      size,
    );

    return { data };
  }

  async getById(recipeId: number): Promise<RecipeDetailDto> {
    const recipe = await this.cacheService.getOrSet(
      this.recipeCacheStrategy,
      async () => {
        const found = await this.recipeRepository.findById(recipeId);
        if (!found) {
          throw new NotFoundException('Recipe not found');
        }
        return this.toDetailDto(found as RecipeWithIngredients);
      },
      recipeId,
    );

    return recipe;
  }

  async recordRecipeView(
    recipeId: number,
    context: ActivityContext = {},
  ): Promise<void> {
    const exists = await this.recipeRepository.existsPublishedById(recipeId);
    if (!exists) {
      throw new NotFoundException('Recipe not found');
    }

    const actorKey = this.buildActorKey(context);
    const dedupeKey = cacheKeyDedupeRecipeView(recipeId, actorKey);
    const shouldEmit = await this.tryAcquireDedupeSlot(
      dedupeKey,
      'recipe.view',
    );

    if (!shouldEmit) {
      return;
    }

    this.emitRecipeView(recipeId, null, context).catch(() => {
      /* fire-and-forget */
    });
  }

  async recordSearchClick(
    recipeId: number,
    context: ActivityContext = {},
  ): Promise<void> {
    const exists = await this.recipeRepository.existsPublishedById(recipeId);
    if (!exists) {
      throw new NotFoundException('Recipe not found');
    }

    const actorKey = this.buildActorKey(context);
    const dedupeKey = cacheKeyDedupeSearchClick(recipeId, actorKey);
    const shouldEmit = await this.tryAcquireDedupeSlot(
      dedupeKey,
      'search.click',
    );

    if (!shouldEmit) {
      return;
    }

    this.emitSearchClick(recipeId, context).catch(() => {
      /* fire-and-forget */
    });
  }

  // TODO: 조인 비용 및 캐시 정책(Write Behind) 검토
  //? 현재는 Cache-Aside에 가깝고, 짧은 캐시 TTL을 사용하고 있어 조회 부담이 클 수 있다.
  async search(
    params: {
      q?: string;
      page: number;
      size: number;
      difficulty?: number[];
      cookTimeMin?: number;
      cookTimeMax?: number;
      categoryId?: number;
      cookingMethod?: string;
      dishType?: string;
      sort?: RecipeListOrder;
    },
    context?: ActivityContext,
  ): Promise<{ data: RecipeSummaryDto[]; pagination: PaginationDto }> {
    const raw = params.q?.trim() ?? '';
    const keyword = raw.length > 0 ? raw : undefined;
    const difficultyKey =
      params.difficulty && params.difficulty.length > 0
        ? [...params.difficulty].sort((a, b) => a - b).join(',')
        : CACHE_KEY_SEGMENT.ALL;
    const cookTimeRangeKey = `${params.cookTimeMin ?? CACHE_KEY_SEGMENT.ALL}-${params.cookTimeMax ?? CACHE_KEY_SEGMENT.ALL}`;
    const categoryKey = params.categoryId ?? CACHE_KEY_SEGMENT.ALL;
    const cookingMethodKey =
      params.cookingMethod?.trim() || CACHE_KEY_SEGMENT.ALL;
    const dishTypeKey = params.dishType?.trim() || CACHE_KEY_SEGMENT.ALL;
    const sortKey = params.sort ?? DEFAULT_RECIPE_SORT;
    const payload: RecipeSearchParams = {
      keyword,
      page: params.page,
      size: params.size,
      difficulty: params.difficulty,
      minCookTime: params.cookTimeMin,
      maxCookTime: params.cookTimeMax,
      categoryId: params.categoryId,
      cookingMethod: params.cookingMethod,
      dishType: params.dishType,
      sort: sortKey,
    };
    const keywordKey = keyword ?? CACHE_KEY_SEGMENT.ALL;
    const result = await this.cacheService.getOrSet(
      this.recipeCacheStrategy,
      async () => {
        const { data, total } =
          await this.recipeRepository.searchByKeyword(payload);
        const totalPages = Math.ceil(total / params.size) || 1;
        return {
          data: data.map((r) => this.toSummaryDto(r)),
          pagination: {
            page: params.page,
            size: params.size,
            total,
            totalPages,
          },
        };
      },
      CACHE_KEY_SEGMENT.SEARCH,
      keywordKey,
      difficultyKey,
      cookTimeRangeKey,
      categoryKey,
      cookingMethodKey,
      dishTypeKey,
      sortKey,
      params.page,
      params.size,
    );

    this.recordSearchQuery(payload, context).catch(() => {
      /* fire-and-forget */
    });
    return result;
  }

  private async recordSearchQuery(
    payload: RecipeSearchParams,
    context?: ActivityContext,
  ): Promise<void> {
    const keywordSegment =
      payload.keyword?.trim() || RecipeQueryService.SEARCH_QUERY_NO_KEYWORD;
    const actorKey = this.buildActorKey(context ?? {});
    const dedupeKey = cacheKeyDedupeSearchQuery(keywordSegment, actorKey);
    const shouldEmit = await this.tryAcquireDedupeSlot(
      dedupeKey,
      'search.query',
    );

    if (!shouldEmit) {
      return;
    }

    this.emitSearchQuery(payload, context).catch(() => {
      /* fire-and-forget */
    });
  }

  /**
   * ID 목록으로 레시피 요약 정보 벌크 조회 (챗봇 추천 레시피 상세 표시 등)
   */
  async getSummariesByIds(ids: number[]): Promise<RecipeSummaryDto[]> {
    if (ids.length === 0) return [];
    const data = await this.recipeRepository.findSummariesByIds(ids);
    return data.map((r) => this.toSummaryDto(r));
  }

  async getCategories(): Promise<{ data: RecipeCategoryDto[] }> {
    const data = await this.cacheService.getOrSet(
      this.recipeCacheStrategy,
      async () => {
        const categories = await this.recipeRepository.findActiveCategories();
        return categories.map((category) => ({
          id: category.id,
          key: category.key,
          name: category.name,
          displayOrder: category.displayOrder,
          isActive: category.isActive,
        }));
      },
      CACHE_KEY_SEGMENT.CATEGORIES,
    );

    return { data };
  }

  private toSummaryDto(recipe: RecipeWithStats): RecipeSummaryDto {
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description ?? null,
      difficulty: recipe.difficulty,
      cookTime: recipe.cookTime,
      imageUrl: recipe.imageUrl ?? null,
      servings: recipe.servings,
      viewCount: recipe.viewCount,
      likeCount: recipe.likeCount,
      isPublished: recipe.isPublished,
      createdAt: recipe.createdAt,
    };
  }

  private toDetailDto(recipe: RecipeWithIngredients): RecipeDetailDto {
    const instructions = this.parseInstructions(recipe.instructions);
    const ingredients: RecipeIngredientItemDto[] = recipe.recipeIngredients.map(
      (ri) => ({
        id: ri.ingredient.id,
        name: ri.ingredient.name,
        amount: ri.amount != null ? Number(ri.amount) : null,
        unit: ri.unit ?? null,
        isOptional: ri.isOptional,
      }),
    );

    return {
      ...this.toSummaryDto(recipe),
      categoryId: recipe.categoryId,
      categoryName: recipe.categoryMeta.name,
      cookingMethod: recipe.cookingMethod ?? null,
      dishType: recipe.dishType ?? null,
      nutrition: this.parseNutrition(recipe.nutrition),
      cookingTip: recipe.cookingTip ?? null,
      source: recipe.source ?? null,
      sourceRecipeId: recipe.sourceRecipeId ?? null,
      instructions,
      ingredients,
    };
  }

  private parseNutrition(nutrition: unknown): RecipeNutritionDto | null {
    if (
      !nutrition ||
      typeof nutrition !== 'object' ||
      Array.isArray(nutrition)
    ) {
      return null;
    }
    const record = nutrition as Record<string, unknown>;
    const parsed: RecipeNutritionDto = {
      calories: this.parseNutritionValue(record.calories),
      carbohydrates: this.parseNutritionValue(record.carbohydrates),
      protein: this.parseNutritionValue(record.protein),
      fat: this.parseNutritionValue(record.fat),
      sodium: this.parseNutritionValue(record.sodium),
    };
    const hasValue = Object.values(parsed).some((value) => value != null);
    return hasValue ? parsed : null;
  }

  private parseNutritionValue(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private parseInstructions(instructions: unknown): RecipeInstructionStepDto[] {
    if (!Array.isArray(instructions)) {
      return [];
    }
    return instructions.map(
      (
        item: { step?: number; content?: string; imageUrl?: string },
        idx: number,
      ) => ({
        step: typeof item?.step === 'number' ? item.step : idx + 1,
        content: typeof item?.content === 'string' ? item.content : '',
        imageUrl: typeof item?.imageUrl === 'string' ? item.imageUrl : null,
      }),
    );
  }

  private async emitRecipeView(
    recipeId: number,
    recipeTitle: string | null,
    context?: ActivityContext,
  ): Promise<void> {
    await this.kafkaProducerService.emit(
      KAFKA_TOPICS.ACTIVITY_EVENTS,
      {
        type: ActivityEventType.RECIPE_VIEW,
        actor: {
          type: 'user',
          userId: context?.userId,
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
        },
        entity: {
          type: 'recipe',
          id: recipeId,
          name: recipeTitle ?? undefined,
        },
      },
      String(recipeId),
    );
  }

  private async emitSearchQuery(
    payload: RecipeSearchParams,
    context?: ActivityContext,
  ): Promise<void> {
    await this.kafkaProducerService.emit(KAFKA_TOPICS.ACTIVITY_EVENTS, {
      type: ActivityEventType.SEARCH_QUERY,
      actor: {
        type: 'user',
        userId: context?.userId,
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      },
      payload,
    });
  }

  private async emitSearchClick(
    recipeId: number,
    context?: ActivityContext,
  ): Promise<void> {
    await this.kafkaProducerService.emit(
      KAFKA_TOPICS.ACTIVITY_EVENTS,
      {
        type: ActivityEventType.SEARCH_CLICK,
        actor: {
          type: 'user',
          userId: context?.userId,
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
        },
        entity: {
          type: 'recipe',
          id: recipeId,
        },
        metadata: {
          source: 'recipe_search',
        },
      },
      String(recipeId),
    );
  }
}
