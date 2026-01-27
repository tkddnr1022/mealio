import { Injectable } from '@nestjs/common';
import { Ingredient, Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IngredientRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<Ingredient | null> {
    return this.prisma.ingredient.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Ingredient | null> {
    return this.prisma.ingredient.findFirst({ where: { name } });
  }

  async search(query: string, take: number): Promise<Ingredient[]> {
    return this.prisma.ingredient.findMany({
        where: {
            name: {
                contains: query,
            },
        },
        take,
    });
  }

  // Command 메서드들은 producer 서버에서 제거
  // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
  // async create(data: Prisma.IngredientCreateInput): Promise<Ingredient> {
  //   return this.prisma.ingredient.create({ data });
  // }
}
