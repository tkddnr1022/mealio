import { Injectable } from '@nestjs/common';
import { Prisma } from '@mealio/shared/prisma-client';
import { PrismaService } from '@mealio/shared';

export type NumericRangeInput = {
  gte?: number;
  lte?: number;
};

export interface RecipeHardConstraintInput {
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
            categoryId: true;
          };
        };
      };
    };
  };
}>;

const RECIPE_SEARCH_INCLUDE = {
  categoryMeta: { select: { id: true, name: true } },
  recipeIngredients: {
    select: {
      ingredientId: true,
      isOptional: true,
      ingredient: { select: { name: true, categoryId: true } },
    },
  },
} as const;

@Injectable()
export class RecipeSearchQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * semantic 검색 후보 ID 목록에 대해 하드 제약만 적용해 상세를 조회한다.
   */
  async fetchRecipesByIds(
    recipeIds: number[],
    hardConstraints: RecipeHardConstraintInput = {},
  ): Promise<RecipeSearchCandidate[]> {
    const normalizedRecipeIds = this.normalizePositiveIds(recipeIds);
    if (normalizedRecipeIds.length === 0) {
      return [];
    }

    const where = this.buildHardConstraintWhere(hardConstraints);
    where.id = { in: normalizedRecipeIds };

    return this.prisma.recipe.findMany({
      where,
      include: RECIPE_SEARCH_INCLUDE,
    });
  }

  private buildHardConstraintWhere(
    hardConstraints: RecipeHardConstraintInput,
  ): Prisma.RecipeWhereInput {
    return {
      AND: this.buildHardConstraintAndConditions(hardConstraints),
    };
  }

  private buildHardConstraintAndConditions(
    hardConstraints: RecipeHardConstraintInput,
  ): Prisma.RecipeWhereInput[] {
    const normalizedExcludeIngredientIds = this.normalizePositiveIds(
      hardConstraints.excludeIngredientIds ?? [],
    );
    const normalizedExcludeIngredientNames = this.normalizeLowerCaseValues(
      hardConstraints.excludeIngredientNames ?? [],
    );

    const andConditions: Prisma.RecipeWhereInput[] = [{ isPublished: true }];

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

    return andConditions;
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
