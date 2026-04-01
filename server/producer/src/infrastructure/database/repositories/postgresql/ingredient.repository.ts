import { Injectable } from '@nestjs/common';
import { Ingredient } from '@cook/shared/prisma-client';
import { PrismaService } from '@cook/shared';

export interface IngredientListParams {
  category?: number;
  page: number;
  size: number;
}

export interface IngredientSearchParams {
  /** 비어 있거나 생략이면 이름 조건 없음 */
  keyword?: string;
  categoryId?: number;
  page: number;
  size: number;
}

export interface IngredientCategoryRow {
  id: number;
  key: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

@Injectable()
export class IngredientRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<Ingredient | null> {
    return this.prisma.ingredient.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Ingredient | null> {
    return this.prisma.ingredient.findFirst({ where: { name } });
  }

  async findManyByIds(
    ids: number[],
  ): Promise<Pick<Ingredient, 'id' | 'name' | 'categoryId'>[]> {
    if (ids.length === 0) return [];
    return this.prisma.ingredient.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, categoryId: true },
    });
  }

  async findManyPaginated(params: IngredientListParams): Promise<{
    data: Ingredient[];
    total: number;
  }> {
    const { category, page, size } = params;
    const skip = (page - 1) * size;

    const where = category != null ? { categoryId: category } : undefined;

    const [data, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        skip,
        take: size,
        orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return { data, total };
  }

  async searchByKeyword(params: IngredientSearchParams): Promise<{
    data: Ingredient[];
    total: number;
  }> {
    const { keyword, categoryId, page, size } = params;
    const skip = (page - 1) * size;
    const hasKeyword = keyword != null && keyword.length > 0;
    const where = {
      ...(hasKeyword
        ? {
            name: {
              contains: keyword,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(categoryId != null ? { categoryId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        skip,
        take: size,
        orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return { data, total };
  }

  async findActiveCategories(): Promise<IngredientCategoryRow[]> {
    return this.prisma.$queryRaw<IngredientCategoryRow[]>`
      SELECT
        "id",
        "key",
        "name",
        "display_order" AS "displayOrder",
        "is_active" AS "isActive"
      FROM "IngredientCategory"
      WHERE "is_active" = true
      ORDER BY "display_order" ASC, "id" ASC
    `;
  }

  // Command 메서드들은 producer 서버에서 제거
  // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
}
