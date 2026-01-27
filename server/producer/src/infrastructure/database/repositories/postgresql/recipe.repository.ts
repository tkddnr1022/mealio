import { Injectable } from '@nestjs/common';
import { Recipe, Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecipeRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<Recipe | null> {
    return this.prisma.recipe.findUnique({
      where: { id },
      include: {
        recipeIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });
  }

  // Command 메서드들은 producer 서버에서 제거
  // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
  // async create(data: Prisma.RecipeCreateInput): Promise<Recipe> {
  //   return this.prisma.recipe.create({
  //     data,
  //   });
  // }

  // async createWithIngredients(
  //   recipeData: Prisma.RecipeCreateInput,
  //   ingredients: Array<{ ingredientId: number; amount?: number; unit?: string }>
  // ): Promise<Recipe> {
  //   return this.prisma.$transaction(async (tx) => {
  //     const recipe = await tx.recipe.create({
  //       data: recipeData,
  //     });

  //     if (ingredients && ingredients.length > 0) {
  //       await tx.recipeIngredient.createMany({
  //         data: ingredients.map((ing) => ({
  //           recipeId: recipe.id,
  //           ingredientId: ing.ingredientId,
  //           amount: ing.amount,
  //           unit: ing.unit,
  //         })),
  //       });
  //     }

  //     return recipe;
  //   });
  // }

  async searchRecipes(params: {
    difficulty?: number;
    maxCookTime?: number;
    ingredientIds?: number[];
    skip?: number;
    take?: number;
  }): Promise<Recipe[]> {
    return this.prisma.recipe.findMany({
      where: {
        difficulty: params.difficulty,
        cookTime: params.maxCookTime ? { lte: params.maxCookTime } : undefined,
        recipeIngredients: params.ingredientIds?.length
          ? {
              some: {
                ingredientId: {
                  in: params.ingredientIds,
                },
              },
            }
          : undefined,
      },
      skip: params.skip,
      take: params.take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
