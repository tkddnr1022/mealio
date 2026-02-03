import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cook/shared';

export interface RecipeSummary {
  id: number;
  title: string;
  matchScore: number;
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

/**
 * search_recipes 함수 실행 — Prisma 레시피 검색·매칭 점수 계산, RecipeSummary[] 반환
 */
@Injectable()
export class SearchRecipesHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    payload: SearchRecipesPayload,
    context: SearchRecipesContext,
  ): Promise<RecipeSummary[]> {
    const limit = Math.min(
      payload.limit ?? DEFAULT_LIMIT,
      MAX_LIMIT,
    );
    const { userIngredientIds, favoriteIngredientIds } = context;

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
        const ingredientIds = r.recipeIngredients.map(
          (ri) => ri.ingredientId,
        );
        let score = 0;
        for (const id of ingredientIds) {
          if (userIngredientIds.includes(id)) score += 10;
          if (favoriteIngredientIds.includes(id)) score += 5;
        }
        return {
          id: r.id,
          title: r.title,
          matchScore: score,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return scored;
  }
}
