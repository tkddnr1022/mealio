import { Injectable } from '@nestjs/common';
import { Prisma } from '@mealio/shared/prisma-client';
import { PrismaService } from '@mealio/shared';

export type NumericRangeInput = {
  gte?: number;
  lte?: number;
};

export interface RecipeSearchQueryInput {
  cookTime?: NumericRangeInput;
  servings?: NumericRangeInput;
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

    const andConditions: Prisma.RecipeWhereInput[] = [{ isPublished: true }];

    this.pushNumericRangeCondition(
      andConditions,
      'cookTime',
      this.resolveCookTimeRange(input),
    );
    this.pushNumericRangeCondition(
      andConditions,
      'servings',
      this.resolveServingsRange(input),
    );

    if (normalizedRecipeCategoryIds.length > 0) {
      andConditions.push({
        categoryId: { in: normalizedRecipeCategoryIds },
      });
    }

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

    const where: Prisma.RecipeWhereInput = { AND: andConditions };

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

  private resolveCookTimeRange(
    input: RecipeSearchQueryInput,
  ): NumericRangeInput | undefined {
    return this.normalizeNumericRange(input.cookTime);
  }

  private resolveServingsRange(
    input: RecipeSearchQueryInput,
  ): NumericRangeInput | undefined {
    return this.normalizeNumericRange(input.servings);
  }

  private normalizeNumericRange(
    range?: NumericRangeInput,
  ): NumericRangeInput | undefined {
    if (!range) {
      return undefined;
    }

    return this.mergeNumericRange(
      this.normalizePositiveNumber(range.gte),
      this.normalizePositiveNumber(range.lte),
    );
  }

  private mergeNumericRange(
    gte?: number,
    lte?: number,
  ): NumericRangeInput | undefined {
    if (gte == null && lte == null) {
      return undefined;
    }
    return {
      ...(gte != null && { gte }),
      ...(lte != null && { lte }),
    };
  }

  private pushNumericRangeCondition(
    andConditions: Prisma.RecipeWhereInput[],
    field: 'cookTime' | 'servings',
    range: NumericRangeInput | undefined,
  ): void {
    if (!range) {
      return;
    }

    const filter: Prisma.IntFilter = {};
    if (range.gte != null) {
      filter.gte = range.gte;
    }
    if (range.lte != null) {
      filter.lte = range.lte;
    }
    if (Object.keys(filter).length === 0) {
      return;
    }

    andConditions.push({ [field]: filter });
  }

  private normalizePositiveNumber(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return undefined;
    }
    return Math.floor(value);
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
