import { Injectable } from '@nestjs/common';
import { RecipeIngredient, Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecipeIngredientRepository {
  constructor(private prisma: PrismaService) {}

  async findByRecipeId(recipeId: number): Promise<RecipeIngredient[]> {
    return this.prisma.recipeIngredient.findMany({
        where: { recipeId },
        include: { ingredient: true },
    });
  }

  async createMany(data: Prisma.RecipeIngredientCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return this.prisma.recipeIngredient.createMany({
      data,
    });
  }

  async update(id: number, data: Prisma.RecipeIngredientUpdateInput): Promise<RecipeIngredient> {
    return this.prisma.recipeIngredient.update({
      where: { id },
      data,
    });
  }

  async deleteByRecipeId(recipeId: number): Promise<Prisma.BatchPayload> {
    return this.prisma.recipeIngredient.deleteMany({
      where: { recipeId },
    });
  }
}
