import { Injectable } from '@nestjs/common';
import { PrismaService } from '@cook/shared';

/**
 * Consumer 전용 Recipe 리포지토리 — activity-events(recipe.view) 처리 시 조회수 증가 등
 */
@Injectable()
export class RecipeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async incrementViewCount(recipeId: number): Promise<void> {
    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { viewCount: { increment: 1 } },
    });
  }
}
