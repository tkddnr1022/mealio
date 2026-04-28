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
  /** IngredientCategory.id */
  categoryId: number;
  categoryName: string;
  /** IngredientCategory.key (불변 키) */
  categoryKey: string;
}

export interface FavoriteRecipeSummary {
  id: number;
  title: string;
  description: string | null;
  difficulty: number;
  cookTime: number;
  imageUrl: string | null;
  servings: number;
  viewCount: number;
  isPublished: boolean;
  createdAt: Date;
}

export interface UserInventoryResult {
  ownedIngredients: InventoryItem[];
  favoriteIngredients: InventoryItem[];
  favoriteRecipes: FavoriteRecipeSummary[];
}

interface InventoryDocumentShape {
  ingredients?: {
    ownedIds?: number[];
    favoriteIds?: number[];
  };
  recipes?: {
    favoriteIds?: number[];
  };
}

/**
 * get_user_inventory 함수 실행 - MongoDB Inventory 조회, Prisma Ingredient/Recipe 조회 후
 * Inventory API와 동일한 셰입(ownedIngredients, favoriteIngredients, favoriteRecipes)으로 반환
 */
@Injectable()
export class InventoryHandler {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(userId: number): Promise<UserInventoryResult> {
    const doc = await this.inventoryModel
      .findOne({ userId })
      .lean()
      .exec();

    if (!doc) {
      return {
        ownedIngredients: [],
        favoriteIngredients: [],
        favoriteRecipes: [],
      };
    }

    const typedDoc = doc as InventoryDocumentShape;
    const ingredientIds = typedDoc.ingredients?.ownedIds ?? [];
    const favoriteIngredientIds = typedDoc.ingredients?.favoriteIds ?? [];
    const favoriteRecipeIds = typedDoc.recipes?.favoriteIds ?? [];
    const favoriteIds = new Set(favoriteIngredientIds);
    const allIds = [...new Set([...ingredientIds, ...favoriteIngredientIds])];

    if (allIds.length === 0) {
      const favoriteRecipes = await this.fetchFavoriteRecipes(
        favoriteRecipeIds,
      );
      return {
        ownedIngredients: [],
        favoriteIngredients: [],
        favoriteRecipes,
      };
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
          categoryId,
          categoryName,
          categoryKey,
        });
      }
    }

    const sorted = items.sort((a, b) => a.id - b.id);
    const ownedIngredients = sorted.filter((item) =>
      ingredientIds.includes(item.id),
    );
    const favoriteIngredients = sorted.filter((item) =>
      favoriteIds.has(item.id),
    );
    const favoriteRecipes = await this.fetchFavoriteRecipes(favoriteRecipeIds);

    return {
      ownedIngredients,
      favoriteIngredients,
      favoriteRecipes,
    };
  }

  private async fetchFavoriteRecipes(
    favoriteRecipeIds: number[],
  ): Promise<FavoriteRecipeSummary[]> {
    if (favoriteRecipeIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.recipe.findMany({
      where: { id: { in: favoriteRecipeIds }, isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        cookTime: true,
        imageUrl: true,
        servings: true,
        viewCount: true,
        isPublished: true,
        createdAt: true,
      },
    });

    const map = new Map(rows.map((row) => [row.id, row]));
    return favoriteRecipeIds
      .map((id) => map.get(id))
      .filter((row): row is FavoriteRecipeSummary => row !== undefined);
  }
}
