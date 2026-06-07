import { Injectable } from '@nestjs/common';
import { Prisma, Recipe } from '@mealio/shared/prisma-client';
import { PrismaService } from '@mealio/shared';
import {
  DEFAULT_RECIPE_SORT,
  RecipeListOrder,
  resolveRecipeSortPolicy,
} from '../../../../modules/recipes/policies/recipe-sort.policy';

export interface RecipeListParams {
  page: number;
  size: number;
  difficulty?: number[];
  minCookTime?: number;
  maxCookTime?: number;
  sort?: RecipeListOrder;
}

export interface RecipeStaticIdsParams {
  size: number;
}

export interface RecipeSearchParams {
  /** 비어 있거나 생략이면 제목·설명 contains 조건 없음 */
  keyword?: string;
  page: number;
  size: number;
  difficulty?: number[];
  minCookTime?: number;
  maxCookTime?: number;
  /** RecipeCategory.id (활성 카테고리만 매칭) */
  categoryId?: number;
  cookingMethod?: string;
  dishType?: string;
  sort?: RecipeListOrder;
}

export interface RecipeCategoryRow {
  id: number;
  key: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export type RecipeWithStats = Recipe & {
  viewCount: number;
  likeCount: number;
};

export interface RecommendedRecipeWithMeta {
  recipe: RecipeWithStats;
  rank: number;
  score: number;
  reason: string | null;
  calculatedAt: Date;
}

type RecipeStatsRow = {
  recipeId: number;
  viewCount: number;
  likeCount: number;
};

@Injectable()
export class RecipeRepository {
  constructor(private prisma: PrismaService) {}

  async existsPublishedById(id: number): Promise<boolean> {
    const count = await this.prisma.recipe.count({
      where: { id, isPublished: true },
    });
    return count > 0;
  }

  async findById(id: number): Promise<RecipeWithStats | null> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id, isPublished: true },
      include: {
        categoryMeta: {
          select: { id: true, key: true, name: true },
        },
        recipeIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });
    if (!recipe) {
      return null;
    }
    const statsMap = await this.findStatsMap([id]);
    const stats = statsMap.get(id);
    if (!stats) {
      throw new Error(`RecipeStats not found for recipeId=${id}`);
    }
    return {
      ...recipe,
      viewCount: stats.viewCount,
      likeCount: stats.likeCount,
    };
  }

  /**
   * ID 목록으로 레시피 요약 정보 벌크 조회 (RecipeSummaryDto 필드만)
   */
  async findSummariesByIds(ids: number[]): Promise<RecipeWithStats[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.recipe.findMany({
      where: { id: { in: ids }, isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        cookTime: true,
        imageUrl: true,
        servings: true,
        isPublished: true,
        createdAt: true,
      },
    });
    return this.attachStats(
      rows as Recipe[],
      rows.map((row) => row.id),
    );
  }

  async findManyPaginated(params: RecipeListParams): Promise<{
    data: RecipeWithStats[];
    total: number;
  }> {
    const {
      page,
      size,
      difficulty,
      minCookTime,
      maxCookTime,
      sort = DEFAULT_RECIPE_SORT,
    } = params;
    const skip = (page - 1) * size;

    const where = {
      isPublished: true,
      ...(difficulty?.length ? { difficulty: { in: difficulty } } : undefined),
      ...(minCookTime != null || maxCookTime != null
        ? {
            cookTime: {
              ...(minCookTime != null ? { gte: minCookTime } : undefined),
              ...(maxCookTime != null ? { lte: maxCookTime } : undefined),
            },
          }
        : undefined),
    };

    const totalPromise = this.prisma.recipe.count({ where });
    const sortPolicy = resolveRecipeSortPolicy(sort);

    const [rows, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: size,
        orderBy: sortPolicy.orderBy,
      }),
      totalPromise,
    ]);

    const data = await this.attachStats(
      rows,
      rows.map((row) => row.id),
    );
    return { data, total };
  }

  async findPublishedIdsByPopularity(
    params: RecipeStaticIdsParams,
  ): Promise<number[]> {
    const rows = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT r.id
      FROM "Recipe" r
      INNER JOIN "RecipeStats" rs ON rs.recipe_id = r.id
      WHERE r.is_published = true
      ORDER BY (rs.view_count + rs.like_count) DESC,
               rs.view_count DESC,
               rs.like_count DESC,
               r.id DESC
      LIMIT ${params.size}
    `;

    return rows.map((row) => row.id);
  }

  async searchByKeyword(params: RecipeSearchParams): Promise<{
    data: RecipeWithStats[];
    total: number;
  }> {
    const {
      keyword,
      page,
      size,
      difficulty,
      minCookTime,
      maxCookTime,
      categoryId,
      cookingMethod,
      dishType,
      sort = DEFAULT_RECIPE_SORT,
    } = params;
    const skip = (page - 1) * size;

    const hasKeyword = keyword != null && keyword.length > 0;
    const andConditions: Prisma.RecipeWhereInput[] = [];
    if (hasKeyword) {
      andConditions.push({
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      });
    }
    if (difficulty?.length) {
      andConditions.push({ difficulty: { in: difficulty } });
    }
    if (minCookTime != null) {
      andConditions.push({ cookTime: { gte: minCookTime } });
    }
    if (maxCookTime != null) {
      andConditions.push({ cookTime: { lte: maxCookTime } });
    }
    if (categoryId != null) {
      andConditions.push({
        categoryId,
        categoryMeta: { isActive: true },
      });
    }
    const normalizedCookingMethod = cookingMethod?.trim();
    if (normalizedCookingMethod) {
      andConditions.push({ cookingMethod: normalizedCookingMethod });
    }
    const normalizedDishType = dishType?.trim();
    if (normalizedDishType) {
      andConditions.push({ dishType: normalizedDishType });
    }

    const where: Prisma.RecipeWhereInput = {
      isPublished: true,
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    };

    const totalPromise = this.prisma.recipe.count({ where });
    const sortPolicy = resolveRecipeSortPolicy(sort);

    const [rows, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: size,
        orderBy: sortPolicy.orderBy,
      }),
      totalPromise,
    ]);

    const data = await this.attachStats(
      rows,
      rows.map((row) => row.id),
    );
    return { data, total };
  }

  async searchRecipes(params: {
    difficulty?: number;
    maxCookTime?: number;
    ingredientIds?: number[];
    skip?: number;
    take?: number;
  }): Promise<Recipe[]> {
    return this.prisma.recipe.findMany({
      where: {
        isPublished: true,
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

  async findActiveCategories(): Promise<RecipeCategoryRow[]> {
    return this.prisma.$queryRaw<RecipeCategoryRow[]>`
      SELECT
        "id",
        "key",
        "name",
        "display_order" AS "displayOrder",
        "is_active" AS "isActive"
      FROM "RecipeCategory"
      WHERE "is_active" = true
      ORDER BY "display_order" ASC, "id" ASC
    `;
  }

  async findRecommendedByUser(
    userId: number,
    limit: number,
  ): Promise<RecommendedRecipeWithMeta[]> {
    const rows = await this.prisma.userRecipeRecommendation.findMany({
      where: {
        userId,
        recipe: {
          is: {
            isPublished: true,
          },
        },
      },
      orderBy: [{ rank: 'asc' }],
      take: limit,
      include: {
        recipe: true,
      },
    });

    const recipeIds = rows.map((row) => row.recipeId);
    const statsMap = await this.findStatsMap(recipeIds);

    return rows.flatMap((row) => {
      const stats = statsMap.get(row.recipeId);
      if (!stats) {
        return [];
      }
      return [
        {
          recipe: {
            ...row.recipe,
            viewCount: stats.viewCount,
            likeCount: stats.likeCount,
          },
          rank: row.rank,
          score: Number(row.score),
          reason: row.reason,
          calculatedAt: row.calculatedAt,
        },
      ];
    });
  }

  private async findStatsMap(
    recipeIds: number[],
  ): Promise<Map<number, RecipeStatsRow>> {
    if (recipeIds.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.recipeStats.findMany({
      where: { recipeId: { in: recipeIds } },
      select: {
        recipeId: true,
        viewCount: true,
        likeCount: true,
      },
    });
    return new Map(rows.map((row) => [row.recipeId, row]));
  }

  private async attachStats(
    rows: Recipe[],
    recipeIds: number[],
  ): Promise<RecipeWithStats[]> {
    const statsMap = await this.findStatsMap(recipeIds);
    return rows.map((row) => {
      const stats = statsMap.get(row.id);
      if (!stats) {
        throw new Error(`RecipeStats not found for recipeId=${row.id}`);
      }
      return {
        ...row,
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
      };
    });
  }
}
