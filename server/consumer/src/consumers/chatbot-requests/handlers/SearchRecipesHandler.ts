import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cook/shared';

/**
 * Tool call 응답용 확장된 레시피 정보
 * - GPT가 추천 이유를 설명할 수 있도록 매칭 컨텍스트 포함
 */
export interface RecipeMatchResult {
  id: number;
  title: string;
  description: string;
  difficulty: number;
  cookTime: number;
  imageUrl: string | null;
  servings: number;
  viewCount: number;
  isPublished: boolean;
  createdAt: string;

  matchContext: RecipeMatchContext;
}

export interface RecipeMatchContext {
  matchScore: number; // 0-100

  ingredientMatch: {
    matchedIngredients: IngredientDetail[];
    missingIngredients: IngredientDetail[];
    missingOptionalIngredients: IngredientDetail[];
    stats: {
      totalRequired: number;
      matchedRequired: number;
      totalOptional: number;
      matchedOptional: number;
    };
  };

  usesFavoriteIngredients: boolean;
  favoriteIngredientsUsed: string[];
}

export interface IngredientDetail {
  id: number;
  name: string;
  amount?: number;
  unit?: string;
  category: number;
}

export interface SearchRecipesPayload {
  keywords: string[];
  maxCookTime?: number;
  limit?: number;
}

export interface SearchRecipesContext {
  userIngredientIds: number[];
  favoriteIngredientIds: number[];
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

function toIngredientDetail(
  ingredient: { id: number; name: string; category: number },
  amount?: unknown,
  unit?: string | null,
): IngredientDetail {
  const detail: IngredientDetail = {
    id: ingredient.id,
    name: ingredient.name,
    category: ingredient.category,
  };
  if (amount != null) {
    detail.amount = typeof amount === 'object' && amount !== null && 'toNumber' in amount
      ? (amount as { toNumber(): number }).toNumber()
      : Number(amount);
  }
  if (unit != null && unit !== '') detail.unit = unit;
  return detail;
}

/**
 * search_recipes 함수 실행 — Prisma 레시피 검색·매칭 점수 계산, RecipeMatchResult[] 반환
 */
@Injectable()
export class SearchRecipesHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    payload: SearchRecipesPayload,
    context: SearchRecipesContext,
  ): Promise<RecipeMatchResult[]> {
    const limit = Math.min(
      payload.limit ?? DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const { userIngredientIds, favoriteIngredientIds } = context;
    const userSet = new Set(userIngredientIds);
    const favoriteSet = new Set(favoriteIngredientIds);

    const recipes = await this.prisma.recipe.findMany({
      where: {
        isPublished: true,
        ...(payload.maxCookTime != null && {
          cookTime: { lte: payload.maxCookTime },
        }),
      },
      include: {
        recipeIngredients: {
          include: { ingredient: true },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const keywordLower =
      payload.keywords?.map((k) => k.toLowerCase()) ?? [];

    const results: Array<{
      recipe: (typeof recipes)[0];
      matchScore: number;
      matchContext: RecipeMatchContext;
    }> = [];

    for (const r of recipes) {
      if (keywordLower.length > 0) {
        const title = (r.title ?? '').toLowerCase();
        const desc = ((r.description as string) ?? '').toLowerCase();
        const matches = keywordLower.some(
          (k) => title.includes(k) || desc.includes(k),
        );
        if (!matches) continue;
      }

      const matchedIngredients: IngredientDetail[] = [];
      const missingIngredients: IngredientDetail[] = [];
      const missingOptionalIngredients: IngredientDetail[] = [];
      let matchedRequired = 0;
      let matchedOptional = 0;
      let totalRequired = 0;
      let totalOptional = 0;
      const favoriteNames: string[] = [];

      for (const ri of r.recipeIngredients) {
        const ing = ri.ingredient;
        const detail = toIngredientDetail(
          ing,
          ri.amount,
          ri.unit,
        );
        const isOptional = ri.isOptional ?? false;
        const isMatched = userSet.has(ri.ingredientId);

        if (isOptional) {
          totalOptional++;
          if (isMatched) {
            matchedOptional++;
            matchedIngredients.push(detail);
          } else {
            missingOptionalIngredients.push(detail);
          }
        } else {
          totalRequired++;
          if (isMatched) {
            matchedRequired++;
            matchedIngredients.push(detail);
          } else {
            missingIngredients.push(detail);
          }
        }
        if (favoriteSet.has(ri.ingredientId)) {
          favoriteNames.push(ing.name);
        }
      }

      let rawScore = 0;
      for (const ri of r.recipeIngredients) {
        if (userSet.has(ri.ingredientId)) rawScore += 10;
        if (favoriteSet.has(ri.ingredientId)) rawScore += 5;
      }
      const totalIngredients = r.recipeIngredients.length;
      const maxPossible = totalIngredients * 10 + r.recipeIngredients.filter((ri) => favoriteSet.has(ri.ingredientId)).length * 5;
      const matchScore = maxPossible > 0 ? Math.round(100 * (rawScore / maxPossible)) : 0;

      results.push({
        recipe: r,
        matchScore,
        matchContext: {
          matchScore,
          ingredientMatch: {
            matchedIngredients,
            missingIngredients,
            missingOptionalIngredients,
            stats: {
              totalRequired,
              matchedRequired,
              totalOptional,
              matchedOptional,
            },
          },
          usesFavoriteIngredients: favoriteNames.length > 0,
          favoriteIngredientsUsed: favoriteNames,
        },
      });
    }

    results.sort((a, b) => b.matchScore - a.matchScore);
    const top = results.slice(0, limit);

    return top.map(({ recipe: r, matchContext }) => ({
      id: r.id,
      title: r.title,
      description: (r.description as string) ?? '',
      difficulty: r.difficulty,
      cookTime: r.cookTime,
      imageUrl: r.imageUrl,
      servings: r.servings,
      viewCount: r.viewCount,
      isPublished: r.isPublished,
      createdAt: r.createdAt.toISOString(),
      matchContext,
    }));
  }
}
