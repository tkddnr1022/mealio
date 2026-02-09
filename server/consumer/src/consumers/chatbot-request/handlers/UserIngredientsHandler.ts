import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PrismaService,
  RedisService,
  UserIngredient,
  UserIngredientDocument,
} from '@cook/shared';

const INGREDIENT_CACHE_KEY_PREFIX = 'ingredient:by-id:';
const INGREDIENT_CACHE_TTL_SECONDS = 3600;

export interface UserIngredientItem {
  id: number;
  name: string;
  isFavorite: boolean;
}

/**
 * get_user_ingredients 함수 실행 — MongoDB UserIngredient 조회, Prisma Ingredient id→name(Redis 캐시), [{ id, name, isFavorite }] 반환
 */
@Injectable()
export class UserIngredientsHandler {
  constructor(
    @InjectModel(UserIngredient.name)
    private readonly userIngredientModel: Model<UserIngredientDocument>,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(userId: number): Promise<UserIngredientItem[]> {
    const doc = await this.userIngredientModel
      .findOne({ userId })
      .lean()
      .exec();

    if (!doc) {
      return [];
    }

    const ingredientIds = doc.ingredientsIds ?? [];
    const favoriteIds = new Set(doc.favoriteIngredientIds ?? []);
    const allIds = [
      ...new Set([...ingredientIds, ...(doc.favoriteIngredientIds ?? [])]),
    ];

    if (allIds.length === 0) {
      return [];
    }

    const items: UserIngredientItem[] = [];
    const missingIds: number[] = [];

    for (const id of allIds) {
      const cached = await this.redis.get(
        `${INGREDIENT_CACHE_KEY_PREFIX}${id}`,
      );
      if (cached) {
        try {
          const { name } = JSON.parse(cached) as { name: string };
          items.push({
            id,
            name,
            isFavorite: favoriteIds.has(id),
          });
        } catch {
          missingIds.push(id);
        }
      } else {
        missingIds.push(id);
      }
    }

    if (missingIds.length > 0) {
      const ingredients = await this.prisma.ingredient.findMany({
        where: { id: { in: missingIds } },
        select: { id: true, name: true },
      });
      for (const ing of ingredients) {
        const key = `${INGREDIENT_CACHE_KEY_PREFIX}${ing.id}`;
        await this.redis.set(
          key,
          JSON.stringify({ id: ing.id, name: ing.name }),
          INGREDIENT_CACHE_TTL_SECONDS,
        );
        items.push({
          id: ing.id,
          name: ing.name,
          isFavorite: favoriteIds.has(ing.id),
        });
      }
    }

    return items.sort((a, b) => a.id - b.id);
  }
}
