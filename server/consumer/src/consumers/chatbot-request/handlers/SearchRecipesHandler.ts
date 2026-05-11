import { Injectable } from '@nestjs/common';
import { Prisma } from '@cook/shared/prisma-client';
import {
  PrismaService,
  RedisService,
  cacheKeyChatbotFoodCategories,
} from '@cook/shared';

/** `search_recipes` 도구가 반환하는 레시피 요약(검색 결과). 추천·랭킹 점수는 포함하지 않는다. */
export interface SearchedRecipe {
  id: number;
  title: string;
  description: string | null;
  difficulty: number | null;
  cookTime: number | null;
  imageUrl: string | null;
  servings: number | null;
  /** RecipeCategory.id */
  categoryId: number;
  categoryName: string;
}

export interface SearchRecipesPayload {
  keywords?: string[];
  ingredientIds?: number[];
  recipeCategoryIds?: number[];
  ingredientCategoryIds?: number[];
  maxCookTime?: number;
  limit?: number;
}

export interface FoodCategoriesResult {
  recipeCategories: Array<{
    id: number;
    key: string;
    name: string;
    displayOrder: number;
  }>;
  ingredientCategories: Array<{
    id: number;
    key: string;
    name: string;
    displayOrder: number;
  }>;
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
/** Producer RecipeCacheStrategy·레시피 카테고리 API와 동일하게 1시간 */
const FOOD_CATEGORIES_CACHE_TTL_SECONDS = 3600;

/**
 * search_recipes 함수 실행 — Prisma로 레시피를 조건 필터·키워드 필터 후,
 * DB 정렬(최신 생성 순)을 유지한 채 상한만 적용해 SearchedRecipe[] 반환.
 */
@Injectable()
export class SearchRecipesHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 레시피·재료 카테고리 마스터 (활성만, 정렬 순). Redis 캐시 1시간.
   */
  async getFoodCategories(): Promise<FoodCategoriesResult> {
    const key = cacheKeyChatbotFoodCategories();
    const cached = await this.redis.get(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as FoodCategoriesResult;
        if (
          Array.isArray(parsed.recipeCategories) &&
          Array.isArray(parsed.ingredientCategories)
        ) {
          return parsed;
        }
      } catch {
        /* 캐시 손상 시 DB 재조회 */
      }
    }

    const [recipeCategories, ingredientCategories] = await Promise.all([
      this.prisma.recipeCategory.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
        select: { id: true, key: true, name: true, displayOrder: true },
      }),
      this.prisma.ingredientCategory.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
        select: { id: true, key: true, name: true, displayOrder: true },
      }),
    ]);
    const result: FoodCategoriesResult = {
      recipeCategories,
      ingredientCategories,
    };
    await this.redis.set(
      key,
      JSON.stringify(result),
      FOOD_CATEGORIES_CACHE_TTL_SECONDS,
    );
    return result;
  }

  async execute(payload: SearchRecipesPayload): Promise<SearchedRecipe[]> {
    const limit = Math.min(payload.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const recipeCategoryIds = payload.recipeCategoryIds ?? [];
    const ingredientCategoryIds = payload.ingredientCategoryIds ?? [];

    const where: Prisma.RecipeWhereInput = {
      isPublished: true,
      ...(payload.maxCookTime != null && {
        cookTime: { lte: payload.maxCookTime },
      }),
      ...(recipeCategoryIds.length > 0 && {
        categoryId: { in: recipeCategoryIds },
      }),
    };

    const ingredientIds = payload.ingredientIds ?? [];
    const relationAnd: Prisma.RecipeWhereInput[] = [];
    if (ingredientCategoryIds.length > 0) {
      relationAnd.push({
        recipeIngredients: {
          some: {
            ingredient: {
              categoryId: { in: ingredientCategoryIds },
            },
          },
        },
      });
    }
    if (ingredientIds.length > 0) {
      relationAnd.push({
        recipeIngredients: {
          some: { ingredientId: { in: ingredientIds } },
        },
      });
    }
    if (relationAnd.length > 0) {
      where.AND = relationAnd;
    }

    const recipes = await this.prisma.recipe.findMany({
      where,
      include: {
        categoryMeta: { select: { id: true, name: true } },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const keywordLower = payload.keywords?.map((k) => k.toLowerCase()) ?? [];
    const filtered =
      keywordLower.length === 0
        ? recipes
        : recipes.filter((r) => {
            const title = (r.title ?? '').toLowerCase();
            const desc = ((r.description as string) ?? '').toLowerCase();
            return keywordLower.some(
              (k) => title.includes(k) || desc.includes(k),
            );
          });

    return filtered.slice(0, limit).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      difficulty: r.difficulty,
      cookTime: r.cookTime,
      imageUrl: r.imageUrl,
      servings: r.servings,
      categoryId: r.categoryId,
      categoryName: r.categoryMeta.name,
    }));
  }
}
