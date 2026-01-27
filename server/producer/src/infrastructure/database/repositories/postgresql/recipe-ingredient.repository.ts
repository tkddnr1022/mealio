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

  // Command 메서드들은 producer 서버에서 제거
  // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
  // async createMany(data: Prisma.RecipeIngredientCreateManyInput[]): Promise<Prisma.BatchPayload> {
  //   return this.prisma.recipeIngredient.createMany({
  //     data,
  //   });
  // }

  // async update(id: number, data: Prisma.RecipeIngredientUpdateInput): Promise<RecipeIngredient> {
  //   return this.prisma.recipeIngredient.update({
  //     where: { id },
  //     data,
  //   });
  // }

  // async deleteByRecipeId(recipeId: number): Promise<Prisma.BatchPayload> {
  //   return this.prisma.recipeIngredient.deleteMany({
  //     where: { recipeId },
  //   });
  // }
}
