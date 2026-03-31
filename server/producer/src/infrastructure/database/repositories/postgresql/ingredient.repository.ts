import { Injectable } from '@nestjs/common';
import { Ingredient } from '@cook/shared/prisma-client';
import { PrismaService } from '@cook/shared';

export interface IngredientListParams {
  category?: number;
  page: number;
  size: number;
}

export interface IngredientSearchParams {
  keyword: string;
  take: number;
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

  async findManyPaginated(params: IngredientListParams): Promise<{
    data: Ingredient[];
    total: number;
  }> {
    const { category, page, size } = params;
    const skip = (page - 1) * size;

    const where = category != null ? { category } : undefined;

    const [data, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        skip,
        take: size,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    return { data, total };
  }

  async searchByKeyword(params: IngredientSearchParams): Promise<Ingredient[]> {
    const { keyword, take } = params;
    return this.prisma.ingredient.findMany({
      where: {
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      take,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
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
