import { Injectable } from '@nestjs/common';
import { Prisma, Recipe } from '@cook/shared/prisma-client';
import { PrismaService } from '@cook/shared';

export type RecipeListOrder = 'latest' | 'cookTime' | 'difficulty';

export interface RecipeListParams {
  page: number;
  size: number;
  difficulty?: number[];
  maxCookTime?: number;
  sort?: RecipeListOrder;
}

export interface RecipeSearchParams {
  /** 비어 있거나 생략이면 제목·설명 contains 조건 없음 */
  keyword?: string;
  page: number;
  size: number;
  difficulty?: number[];
  maxCookTime?: number;
  /** RecipeCategory.id (활성 카테고리만 매칭) */
  categoryId?: number;
  sort?: RecipeListOrder;
}

export interface RecipeCategoryRow {
  id: number;
  key: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

@Injectable()
export class RecipeRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<Recipe | null> {
    return this.prisma.recipe.findUnique({
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
  }

  /**
   * ID 목록으로 레시피 요약 정보 벌크 조회 (RecipeSummaryDto 필드만)
   */
  async findSummariesByIds(ids: number[]): Promise<Recipe[]> {
    if (ids.length === 0) return [];
    return this.prisma.recipe.findMany({
      where: { id: { in: ids }, isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        cookTime: true,
        imageUrl: true,
        servings: true,
        viewCount: true,
        isPublished: true,
        createdAt: true,
      },
    }) as Promise<Recipe[]>;
  }

  async findManyPaginated(params: RecipeListParams): Promise<{
    data: Recipe[];
    total: number;
  }> {
    const { page, size, difficulty, maxCookTime, sort = 'latest' } = params;
    const skip = (page - 1) * size;

    const where = {
      isPublished: true,
      ...(difficulty?.length ? { difficulty: { in: difficulty } } : undefined),
      ...(maxCookTime != null ? { cookTime: { lte: maxCookTime } } : undefined),
    };

    const orderBy =
      sort === 'cookTime'
        ? { cookTime: 'asc' as const }
        : sort === 'difficulty'
          ? { difficulty: 'asc' as const }
          : { createdAt: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return { data, total };
  }

  async searchByKeyword(params: RecipeSearchParams): Promise<{
    data: Recipe[];
    total: number;
  }> {
    const {
      keyword,
      page,
      size,
      difficulty,
      maxCookTime,
      categoryId,
      sort = 'latest',
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
    if (maxCookTime != null) {
      andConditions.push({ cookTime: { lte: maxCookTime } });
    }
    if (categoryId != null) {
      andConditions.push({
        categoryId,
        categoryMeta: { isActive: true },
      });
    }

    const where: Prisma.RecipeWhereInput = {
      isPublished: true,
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    };

    const orderBy =
      sort === 'cookTime'
        ? { cookTime: 'asc' as const }
        : sort === 'difficulty'
          ? { difficulty: 'asc' as const }
          : { createdAt: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: size,
        orderBy,
      }),
      this.prisma.recipe.count({ where }),
    ]);

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
}
