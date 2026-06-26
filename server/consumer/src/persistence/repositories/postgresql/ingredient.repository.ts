import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { Ingredient, Prisma } from '@mealio/shared/prisma-client';

export interface CreateIngredientInput {
  name: string;
  categoryId: number;
}

/**
 * Consumer 전용 Ingredient 리포지토리 — recipe ingestion persist 매칭·생성
 */
@Injectable()
export class IngredientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByName(name: string): Promise<Ingredient | null> {
    return this.prisma.ingredient.findFirst({
      where: { name },
    });
  }

  async create(input: CreateIngredientInput): Promise<Ingredient> {
    return this.prisma.ingredient.create({
      data: {
        name: input.name,
        categoryId: input.categoryId,
      },
    });
  }

  async findFirstByNameInTx(
    tx: Prisma.TransactionClient,
    name: string,
  ): Promise<Ingredient | null> {
    return tx.ingredient.findFirst({
      where: { name },
    });
  }

  async createInTx(
    tx: Prisma.TransactionClient,
    input: CreateIngredientInput,
  ): Promise<Ingredient> {
    return tx.ingredient.create({
      data: {
        name: input.name,
        categoryId: input.categoryId,
      },
    });
  }

  async findManyNamesByIds(
    ids: number[],
  ): Promise<{ id: number; name: string }[]> {
    if (ids.length === 0) {
      return [];
    }
    return this.prisma.ingredient.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  }
}
