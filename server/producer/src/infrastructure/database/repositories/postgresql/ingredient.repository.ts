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

  async create(data: Prisma.IngredientCreateInput): Promise<Ingredient> {
    return this.prisma.ingredient.create({ data });
  }
}
