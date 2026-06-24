import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';

export interface RecipeIngredientRowInput {
  ingredientId: number;
  amount: string | null;
  unit: string | null;
  isOptional?: boolean;
}

export interface RecipeIngredientNameCandidate {
  ingredientId: number;
  ingredientName: string;
}

/**
 * Consumer 전용 RecipeIngredient 리포지토리
 */
@Injectable()
export class RecipeIngredientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findIngredientNameCandidatesByRecipeId(
    recipeId: number,
  ): Promise<RecipeIngredientNameCandidate[]> {
    const rows = await this.prisma.recipeIngredient.findMany({
      where: { recipeId },
      select: {
        ingredientId: true,
        ingredient: {
          select: {
            name: true,
          },
        },
      },
    });
    return rows.map((row) => ({
      ingredientId: row.ingredientId,
      ingredientName: row.ingredient.name,
    }));
  }

  async replaceForRecipe(
    tx: Prisma.TransactionClient,
    recipeId: number,
    rows: RecipeIngredientRowInput[],
  ): Promise<void> {
    await tx.recipeIngredient.deleteMany({ where: { recipeId } });

    if (rows.length === 0) {
      return;
    }

    await tx.recipeIngredient.createMany({
      data: rows.map((row) => ({
        recipeId,
        ingredientId: row.ingredientId,
        amount: row.amount,
        unit: row.unit,
        isOptional: row.isOptional ?? false,
      })),
    });
  }
}
