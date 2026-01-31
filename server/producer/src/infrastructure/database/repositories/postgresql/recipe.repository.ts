import { Injectable } from '@nestjs/common';
import { Recipe } from '../../prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';

export type RecipeListOrder = 'latest' | 'cookTime' | 'difficulty';

export interface RecipeListParams {
  page: number;
  size: number;
  difficulty?: number[];
  maxCookTime?: number;
  sort?: RecipeListOrder;
}

export interface RecipeSearchParams {
  keyword: string;
  page: number;
  size: number;
}

@Injectable()
export class RecipeRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<Recipe | null> {
    return this.prisma.recipe.findUnique({
      where: { id, isPublished: true },
      include: {
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
      ...(difficulty?.length
        ? { difficulty: { in: difficulty } }
        : undefined),
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
    const { keyword, page, size } = params;
    const skip = (page - 1) * size;

    const where = {
      isPublished: true,
      OR: [
        { title: { contains: keyword, mode: 'insensitive' as const } },
        { description: { contains: keyword, mode: 'insensitive' as const } },
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
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
}
