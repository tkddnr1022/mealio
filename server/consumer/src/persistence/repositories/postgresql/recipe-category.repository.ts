import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';

export interface CategorySelectRow {
  id: number;
  key: string;
  name: string;
  displayOrder: number;
}

export interface ProposedCategoryInput {
  key: string;
  name: string;
}

/**
 * Consumer 전용 RecipeCategory 리포지토리
 */
@Injectable()
export class RecipeCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveCategories(): Promise<CategorySelectRow[]> {
    return this.prisma.recipeCategory.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
      select: { id: true, key: true, name: true, displayOrder: true },
    });
  }

  async findActiveById(
    tx: Prisma.TransactionClient,
    categoryId: number,
  ): Promise<{ id: number } | null> {
    return tx.recipeCategory.findFirst({
      where: { id: categoryId, isActive: true },
      select: { id: true },
    });
  }

  async upsertByKey(
    tx: Prisma.TransactionClient,
    proposed: ProposedCategoryInput,
  ): Promise<number> {
    const byKey = await tx.recipeCategory.findUnique({
      where: { key: proposed.key },
      select: { id: true },
    });
    if (byKey) {
      return byKey.id;
    }

    const max = await tx.recipeCategory.aggregate({ _max: { id: true } });
    const nextId = (max._max.id ?? 0) + 1;

    const created = await tx.recipeCategory.create({
      data: {
        id: nextId,
        key: proposed.key,
        name: proposed.name,
        displayOrder: nextId,
        isActive: true,
      },
      select: { id: true },
    });
    return created.id;
  }
}
