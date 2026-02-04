import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cook/shared';

export interface SuggestedRecipe {
  id: number;
  title: string;
  description: string | null;
  difficulty: number | null;
  cookTime: number | null;
  imageUrl: string | null;
  servings: number | null;
  matchScore: number;
}

export interface SearchRecipesPayload {
  keywords: string[];
  ingredientIds?: number[];
  maxCookTime?: number;
  limit?: number;
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

/**
 * search_recipes 함수 실행 — Prisma 레시피 검색, ingredientIds optional(일반 검색 지원), 필요 시 매칭 점수, SuggestedRecipe[] 반환
 */
@Injectable()
export class SearchRecipesHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(payload: SearchRecipesPayload): Promise<SuggestedRecipe[]> {
    const limit = Math.min(
      payload.limit ?? DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const ingredientIds = payload.ingredientIds ?? [];

    const recipes = await this.prisma.recipe.findMany({
      where: {
        isPublished: true,
        ...(payload.maxCookTime != null && {
          cookTime: { lte: payload.maxCookTime },
        }),
      },
      include: {
        recipeIngredients: {
          select: { ingredientId: true },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const keywordLower =
      payload.keywords?.map((k) => k.toLowerCase()) ?? [];
    const scored = recipes
      .filter((r) => {
        if (keywordLower.length === 0) return true;
        const title = (r.title ?? '').toLowerCase();
        const desc = ((r.description as string) ?? '').toLowerCase();
        return keywordLower.some(
          (k) => title.includes(k) || desc.includes(k),
        );
      })
      .map((r) => {
        const recipeIngredientIds = r.recipeIngredients.map(
          (ri) => ri.ingredientId,
        );
        let score = 0;
        if (ingredientIds.length > 0) {
          for (const id of recipeIngredientIds) {
            if (ingredientIds.includes(id)) score += 10;
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
          matchScore: score,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return scored;
  }
}
