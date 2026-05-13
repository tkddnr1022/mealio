import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';

/**
 * Consumer 전용 Recipe 리포지토리 — activity-events(recipe.view) 처리 시 조회수 증가 등
 */
@Injectable()
export class RecipeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async incrementViewCount(recipeId: number): Promise<void> {
    await this.prisma.recipeStats.upsert({
      where: { recipeId },
      create: {
        recipeId,
        viewCount: 1,
        likeCount: 0,
      },
      update: { viewCount: { increment: 1 } },
    });
  }

  async incrementLikeCount(recipeId: number): Promise<void> {
    await this.prisma.recipeStats.upsert({
      where: { recipeId },
      create: {
        recipeId,
        viewCount: 0,
        likeCount: 1,
      },
      update: { likeCount: { increment: 1 } },
    });
  }

  async decrementLikeCount(recipeId: number): Promise<void> {
    await this.prisma.recipeStats.updateMany({
      where: {
        recipeId,
        likeCount: { gt: 0 },
      },
      data: {
        likeCount: { decrement: 1 },
      },
    });
  }

  async initializeStatsIfMissing(recipeId: number): Promise<void> {
    await this.prisma.recipeStats.upsert({
      where: { recipeId },
      create: {
        recipeId,
        viewCount: 0,
        likeCount: 0,
      },
      update: {},
    });
  }
}
