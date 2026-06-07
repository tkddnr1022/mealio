import { Injectable } from '@nestjs/common';
import { MAX_RECOMMENDATION_ROWS, PrismaService } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';

export interface RecipeScoreDeltaInput {
  recipeId: number;
  delta: number;
  reason: string;
}

/** 재정렬 전 placeholder. recipeId를 더해 동일 트랜잭션 내 다건 create 시 (userId, rank) 유니크 충돌을 방지한다. */
const DEFAULT_UNRANKED = 9999;

function temporaryRank(recipeId: number): number {
  return DEFAULT_UNRANKED + recipeId;
}

@Injectable()
export class RecommendationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async applyRecipeScoreDeltas(
    userId: number,
    deltas: RecipeScoreDeltaInput[],
    maxRows = MAX_RECOMMENDATION_ROWS,
  ): Promise<void> {
    const normalized = this.normalizeRecipeScoreDeltas(deltas);
    if (normalized.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      for (const delta of normalized) {
        await tx.userRecipeRecommendation.upsert({
          where: {
            userId_recipeId: {
              userId,
              recipeId: delta.recipeId,
            },
          },
          create: {
            userId,
            recipeId: delta.recipeId,
            rank: temporaryRank(delta.recipeId),
            score: new Prisma.Decimal(delta.delta),
            reason: delta.reason,
            calculatedAt: now,
          },
          update: {
            score: {
              increment: new Prisma.Decimal(delta.delta),
            },
            reason: delta.reason,
            calculatedAt: now,
          },
        });
      }

      const topCandidates = await tx.userRecipeRecommendation.findMany({
        where: {
          userId,
          score: {
            gt: new Prisma.Decimal(0),
          },
        },
        orderBy: [
          { score: 'desc' },
          { updatedAt: 'desc' },
          { recipeId: 'asc' },
        ],
        take: maxRows,
      });

      await tx.userRecipeRecommendation.deleteMany({
        where: { userId },
      });

      if (topCandidates.length > 0) {
        await tx.userRecipeRecommendation.createMany({
          data: topCandidates.map((row, idx) => ({
            userId,
            recipeId: row.recipeId,
            rank: idx + 1,
            score: row.score,
            reason: row.reason,
            calculatedAt: now,
          })),
        });
      }
    });
  }

  async applyIngredientScoreDelta(
    userId: number,
    ingredientIds: number[],
    delta: number,
    reason: string,
    maxRows = MAX_RECOMMENDATION_ROWS,
  ): Promise<void> {
    const uniqueIngredientIds = [...new Set(ingredientIds)].filter(
      (id) => id > 0,
    );
    if (
      uniqueIngredientIds.length === 0 ||
      !Number.isFinite(delta) ||
      delta === 0
    ) {
      return;
    }

    const recipeIngredients = await this.prisma.recipeIngredient.findMany({
      where: {
        ingredientId: { in: uniqueIngredientIds },
      },
      select: {
        recipeId: true,
      },
      distinct: ['recipeId'],
      take: 200,
    });

    const deltas: RecipeScoreDeltaInput[] = recipeIngredients.map((row) => ({
      recipeId: row.recipeId,
      delta,
      reason,
    }));

    await this.applyRecipeScoreDeltas(userId, deltas, maxRows);
  }

  private normalizeRecipeScoreDeltas(
    deltas: RecipeScoreDeltaInput[],
  ): RecipeScoreDeltaInput[] {
    const bucket = new Map<number, RecipeScoreDeltaInput>();
    for (const delta of deltas) {
      if (
        delta.recipeId <= 0 ||
        !Number.isFinite(delta.delta) ||
        delta.delta === 0
      ) {
        continue;
      }
      const existing = bucket.get(delta.recipeId);
      if (!existing) {
        bucket.set(delta.recipeId, { ...delta });
        continue;
      }
      existing.delta += delta.delta;
      if (delta.reason.trim().length > 0) {
        existing.reason = delta.reason;
      }
    }
    return [...bucket.values()].filter((item) => item.delta !== 0);
  }
}
