import { Injectable } from '@nestjs/common';
import { Prisma } from '@mealio/shared/prisma-client';
import { PrismaService } from '@mealio/shared';

export interface RecipeSearchQueryInput {
  maxCookTime?: number;
  recipeCategoryIds?: number[];
  ingredientCategoryIds?: number[];
  includeIngredientIds?: number[];
  includeIngredientNames?: string[];
  excludeIngredientIds?: number[];
  excludeIngredientNames?: string[];
}

export type RecipeSearchCandidate = Prisma.RecipeGetPayload<{
  include: {
    categoryMeta: { select: { id: true; name: true } };
    recipeIngredients: {
      select: {
        ingredientId: true;
        isOptional: true;
        ingredient: {
          select: {
            name: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class RecipeSearchQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async searchRecipes(
    input: RecipeSearchQueryInput,
  ): Promise<RecipeSearchCandidate[]> {
    const normalizedRecipeCategoryIds = this.normalizePositiveIds(
      input.recipeCategoryIds ?? [],
    );
    const normalizedIngredientCategoryIds = this.normalizePositiveIds(
      input.ingredientCategoryIds ?? [],
    );
    const normalizedIncludeIngredientIds = this.normalizePositiveIds(
      input.includeIngredientIds ?? [],
    );
    const normalizedExcludeIngredientIds = this.normalizePositiveIds(
      input.excludeIngredientIds ?? [],
    );
    const normalizedIncludeIngredientNames = this.normalizeLowerCaseValues(
      input.includeIngredientNames ?? [],
    );
    const normalizedExcludeIngredientNames = this.normalizeLowerCaseValues(
      input.excludeIngredientNames ?? [],
    );

    const andConditions: Prisma.RecipeWhereInput[] = [];

    if (normalizedIngredientCategoryIds.length > 0) {
      andConditions.push({
        recipeIngredients: {
          some: {
            ingredient: {
              categoryId: { in: normalizedIngredientCategoryIds },
            },
          },
        },
      });
    }

    if (normalizedIncludeIngredientIds.length > 0) {
      andConditions.push({
        recipeIngredients: {
          some: {
            ingredientId: { in: normalizedIncludeIngredientIds },
          },
        },
      });
    }

    for (const includeName of normalizedIncludeIngredientNames) {
      andConditions.push({
        recipeIngredients: {
          some: {
            ingredient: {
              name: {
                contains: includeName,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        },
      });
    }

    if (normalizedExcludeIngredientIds.length > 0) {
      andConditions.push({
        recipeIngredients: {
          none: {
            ingredientId: { in: normalizedExcludeIngredientIds },
          },
        },
      });
    }

    if (normalizedExcludeIngredientNames.length > 0) {
      andConditions.push({
        recipeIngredients: {
          none: {
            ingredient: {
              OR: normalizedExcludeIngredientNames.map((name) => ({
                name: {
                  contains: name,
                  mode: Prisma.QueryMode.insensitive,
                },
              })),
            },
          },
        },
      });
    }

    const where: Prisma.RecipeWhereInput = {
      isPublished: true,
      ...(input.maxCookTime != null && {
        cookTime: { lte: input.maxCookTime },
      }),
      ...(normalizedRecipeCategoryIds.length > 0 && {
        categoryId: { in: normalizedRecipeCategoryIds },
      }),
      ...(andConditions.length > 0 && { AND: andConditions }),
    };

    return this.prisma.recipe.findMany({
      where,
      include: {
        categoryMeta: { select: { id: true, name: true } },
        recipeIngredients: {
          select: {
            ingredientId: true,
            isOptional: true,
            ingredient: { select: { name: true } },
          },
        },
      },
      take: 80,
      orderBy: { createdAt: 'desc' },
    });
  }

  private normalizePositiveIds(values: number[]): number[] {
    return [
      ...new Set(
        values.filter((value) => Number.isInteger(value) && value > 0),
      ),
    ];
  }

  private normalizeLowerCaseValues(values: string[]): string[] {
    return [
      ...new Set(values.map((value) => value.trim().toLowerCase())),
    ].filter((value) => value.length > 0);
  }
}
