import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityEventType, CACHE_KEY_SEGMENT, KAFKA_TOPICS } from '@cook/shared';
import {
  RecipeRepository,
  RecipeSearchParams,
  RecipeWithStats,
} from '../../infrastructure/database/repositories/postgresql/recipe.repository';
import { InventoryRepository } from '../../infrastructure/database/repositories/mongodb/inventory.repository';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { RecipeCacheStrategy } from '../../infrastructure/cache/strategies/recipe-cache-strategy';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { RecipeSummaryDto } from './dto/recipe-summary.dto';
import {
  RecipeDetailDto,
  RecipeIngredientItemDto,
  RecipeInstructionStepDto,
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

interface FavoriteRecipeInventoryShape {
  recipes?: { favoriteIds?: number[] };
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
  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly cacheService: CacheService,
    private readonly recipeCacheStrategy: RecipeCacheStrategy,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  async getList(params: {
    page: number;
    size: number;
    difficulty?: number[];
    cookTimeMin?: number;
    cookTimeMax?: number;
    sort?: RecipeListOrder;
  }, userId?: number): Promise<{ data: RecipeSummaryDto[]; pagination: PaginationDto }> {
    const difficultyKey =
      params.difficulty && params.difficulty.length > 0
        ? [...params.difficulty].sort((a, b) => a - b).join(',')
        : CACHE_KEY_SEGMENT.ALL;
    const cookTimeRangeKey = `${params.cookTimeMin ?? CACHE_KEY_SEGMENT.ALL}-${params.cookTimeMax ?? CACHE_KEY_SEGMENT.ALL}`;
    const sortKey = params.sort ?? DEFAULT_RECIPE_SORT;

    const result = await this.cacheService.getOrSet(
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

    return this.withFavoriteFlags(result, userId);
  }

  async getById(
    recipeId: number,
    context?: ActivityContext,
    userId?: number,
  ): Promise<RecipeDetailDto> {
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

    this.emitRecipeView(recipeId, recipe.title ?? null, context).catch(() => {
      /* fire-and-forget */
    });

    const isFavorite = await this.isFavoriteRecipe(recipe.id, userId);
    return { ...recipe, isFavorite };
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
      sort?: RecipeListOrder;
    },
    context?: ActivityContext,
    userId?: number,
  ): Promise<{ data: RecipeSummaryDto[]; pagination: PaginationDto }> {
    const raw = params.q?.trim() ?? '';
    const keyword = raw.length > 0 ? raw : undefined;
    const difficultyKey =
      params.difficulty && params.difficulty.length > 0
        ? [...params.difficulty].sort((a, b) => a - b).join(',')
        : CACHE_KEY_SEGMENT.ALL;
    const cookTimeRangeKey = `${params.cookTimeMin ?? CACHE_KEY_SEGMENT.ALL}-${params.cookTimeMax ?? CACHE_KEY_SEGMENT.ALL}`;
    const categoryKey = params.categoryId ?? CACHE_KEY_SEGMENT.ALL;
    const sortKey = params.sort ?? DEFAULT_RECIPE_SORT;
    const payload: RecipeSearchParams = {
      keyword,
      page: params.page,
      size: params.size,
      difficulty: params.difficulty,
      minCookTime: params.cookTimeMin,
      maxCookTime: params.cookTimeMax,
      categoryId: params.categoryId,
      sort: sortKey,
    };
    const keywordKey = keyword ?? CACHE_KEY_SEGMENT.ALL;
    const result = await this.cacheService.getOrSet(
      this.recipeCacheStrategy,
      async () => {
        const { data, total } = await this.recipeRepository.searchByKeyword(payload);
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
      sortKey,
      params.page,
      params.size,
    );

    this.emitSearchQuery(payload, context).catch(() => {
      /* fire-and-forget */
    });
    return this.withFavoriteFlags(result, userId);
  }

  /**
   * ID 목록으로 레시피 요약 정보 벌크 조회 (챗봇 추천 레시피 상세 표시 등)
   */
  async getSummariesByIds(ids: number[]): Promise<RecipeSummaryDto[]> {
    if (ids.length === 0) return [];
    const data = await this.recipeRepository.findSummariesByIds(ids);
    return data.map((r) => this.toSummaryDto(r, false));
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

  private toSummaryDto(
    recipe: RecipeWithStats,
    isFavorite = false,
  ): RecipeSummaryDto {
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
      isFavorite,
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
      ...this.toSummaryDto(recipe, false),
      categoryId: recipe.categoryId,
      categoryName: recipe.categoryMeta.name,
      instructions,
      ingredients,
    };
  }

  private async withFavoriteFlags(
    result: { data: RecipeSummaryDto[]; pagination: PaginationDto },
    userId?: number,
  ): Promise<{ data: RecipeSummaryDto[]; pagination: PaginationDto }> {
    if (!userId || result.data.length === 0) {
      return {
        ...result,
        data: result.data.map((recipe) => ({ ...recipe, isFavorite: false })),
      };
    }

    const favoriteSet = await this.getFavoriteRecipeIdSet(userId);
    return {
      ...result,
      data: result.data.map((recipe) => ({
        ...recipe,
        isFavorite: favoriteSet.has(recipe.id),
      })),
    };
  }

  private async isFavoriteRecipe(
    recipeId: number,
    userId?: number,
  ): Promise<boolean> {
    if (!userId) {
      return false;
    }

    const favoriteSet = await this.getFavoriteRecipeIdSet(userId);
    return favoriteSet.has(recipeId);
  }
  // TODO: 기존 캐시 활용 검토
  private async getFavoriteRecipeIdSet(userId: number): Promise<Set<number>> {
    const inventory = (await this.inventoryRepository.findFavoriteRecipeIdsByUserId(
      userId,
    )) as FavoriteRecipeInventoryShape | null;
    const favoriteIds = inventory?.recipes?.favoriteIds ?? [];
    return new Set(favoriteIds);
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
}
