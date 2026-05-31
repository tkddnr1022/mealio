import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { Ingredient } from '@mealio/shared/prisma-client';

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
}
