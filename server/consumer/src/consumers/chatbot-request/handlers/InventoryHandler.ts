import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PrismaService,
  RedisService,
  Inventory,
  InventoryDocument,
  cacheKeyIngredientById,
} from '@cook/shared';

const INGREDIENT_BY_ID_CACHE_TTL_SECONDS = 3600;

export interface InventoryItem {
  id: number;
  name: string;
  isFavorite: boolean;
  /** IngredientCategory.id */
  categoryId: number;
  categoryName: string;
  /** IngredientCategory.key (불변 키) */
  categoryKey: string;
}

/**
 * get_user_inventory 함수 실행 - MongoDB Inventory 조회, Prisma Ingredient(+분류)(Redis 캐시), 분류 정보 포함 목록 반환
 */
@Injectable()
export class InventoryHandler {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(userId: number): Promise<InventoryItem[]> {
    const doc = await this.inventoryModel
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

    const items: InventoryItem[] = [];
    const missingIds: number[] = [];

    for (const id of allIds) {
      const cached = await this.redis.get(cacheKeyIngredientById(id));
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as {
            name?: string;
            categoryId?: number;
            categoryName?: string;
            categoryKey?: string;
          };
          if (
            typeof parsed.name === 'string' &&
            typeof parsed.categoryId === 'number' &&
            typeof parsed.categoryName === 'string' &&
            typeof parsed.categoryKey === 'string'
          ) {
            items.push({
              id,
              name: parsed.name,
              isFavorite: favoriteIds.has(id),
              categoryId: parsed.categoryId,
              categoryName: parsed.categoryName,
              categoryKey: parsed.categoryKey,
            });
          } else {
            missingIds.push(id);
          }
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
        select: {
          id: true,
          name: true,
          categoryMeta: {
            select: { id: true, name: true, key: true },
          },
        },
      });
      for (const ing of ingredients) {
        const cacheKey = cacheKeyIngredientById(ing.id);
        const categoryId = ing.categoryMeta.id;
        const categoryName = ing.categoryMeta.name;
        const categoryKey = ing.categoryMeta.key;
        await this.redis.set(
          cacheKey,
          JSON.stringify({
            id: ing.id,
            name: ing.name,
            categoryId,
            categoryName,
            categoryKey,
          }),
          INGREDIENT_BY_ID_CACHE_TTL_SECONDS,
        );
        items.push({
          id: ing.id,
          name: ing.name,
          isFavorite: favoriteIds.has(ing.id),
          categoryId,
          categoryName,
          categoryKey,
        });
      }
    }

    return items.sort((a, b) => a.id - b.id);
  }
}
