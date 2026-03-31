import { Injectable } from '@nestjs/common';
import { Prisma } from '@cook/shared/prisma-client';
import {
  PrismaService,
  RedisService,
  cacheKeyChatbotFoodCategories,
} from '@cook/shared';

export interface SuggestedRecipe {
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
  matchScore: number;
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
const SCORE_INGREDIENT_MATCH = 10;
const SCORE_INGREDIENT_CATEGORY_MATCH = 3;
/** Producer RecipeCacheStrategy·레시피 카테고리 API와 동일하게 1시간 */
const FOOD_CATEGORIES_CACHE_TTL_SECONDS = 3600;

/**
 * search_recipes 함수 실행 — Prisma 레시피 검색, 재료·카테고리 필터 및 가산점, SuggestedRecipe[] 반환
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

  async execute(payload: SearchRecipesPayload): Promise<SuggestedRecipe[]> {
    const limit = Math.min(payload.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const ingredientIds = payload.ingredientIds ?? [];
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
      ...(ingredientCategoryIds.length > 0 && {
        recipeIngredients: {
          some: {
            ingredient: {
              categoryId: { in: ingredientCategoryIds },
            },
          },
        },
      }),
    };

    const recipes = await this.prisma.recipe.findMany({
      where,
      include: {
        categoryMeta: { select: { id: true, name: true } },
        recipeIngredients: {
          select: {
            ingredientId: true,
            ingredient: { select: { categoryId: true } },
          },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const keywordLower = payload.keywords?.map((k) => k.toLowerCase()) ?? [];
    const scored = recipes
      .filter((r) => {
        if (keywordLower.length === 0) return true;
        const title = (r.title ?? '').toLowerCase();
        const desc = ((r.description as string) ?? '').toLowerCase();
        return keywordLower.some((k) => title.includes(k) || desc.includes(k));
      })
      .map((r) => {
        const recipeIngredientIds = r.recipeIngredients.map(
          (ri) => ri.ingredientId,
        );
        let score = 0;
        if (ingredientIds.length > 0) {
          for (const id of recipeIngredientIds) {
            if (ingredientIds.includes(id)) score += SCORE_INGREDIENT_MATCH;
          }
        }
        if (ingredientCategoryIds.length > 0) {
          for (const ri of r.recipeIngredients) {
            if (ingredientCategoryIds.includes(ri.ingredient.categoryId)) {
              score += SCORE_INGREDIENT_CATEGORY_MATCH;
            }
          }
        }
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          difficulty: r.difficulty,
          cookTime: r.cookTime,
          imageUrl: r.imageUrl,
          servings: r.servings,
          categoryId: r.categoryId,
          categoryName: r.categoryMeta.name,
          matchScore: score,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return scored;
  }
}
