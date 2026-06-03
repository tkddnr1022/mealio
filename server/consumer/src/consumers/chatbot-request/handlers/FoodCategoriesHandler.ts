import { Injectable } from '@nestjs/common';
import {
  PrismaService,
  RedisService,
  cacheKeyChatbotFoodCategories,
} from '@mealio/shared';
import { CHATBOT_FOOD_CATEGORIES_CACHE_TTL_SECONDS } from '../../../policy/chatbot-cache.policy';

export interface FoodCategoriesResult {
  recipeCategories: Array<{
    id: number;
    key: string;
    name: string;
    displayOrder: number;
  }>;
  ingredientCategories: Array<{
    id: number;
    key: string;
    name: string;
    displayOrder: number;
  }>;
}

/**
 * get_food_categories 함수 실행 — 레시피·재료 카테고리 마스터(활성만, 정렬 순).
 * Redis 캐시 1시간.
 */
@Injectable()
export class FoodCategoriesHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(): Promise<FoodCategoriesResult> {
    const key = cacheKeyChatbotFoodCategories();
    const cached = await this.redis.get(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as FoodCategoriesResult;
        if (
          Array.isArray(parsed.recipeCategories) &&
          Array.isArray(parsed.ingredientCategories)
        ) {
          return parsed;
        }
      } catch {
        /* 캐시 손상 시 DB 재조회 */
      }
    }

    const [recipeCategories, ingredientCategories] = await Promise.all([
      this.prisma.recipeCategory.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
        select: { id: true, key: true, name: true, displayOrder: true },
      }),
      this.prisma.ingredientCategory.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
        select: { id: true, key: true, name: true, displayOrder: true },
      }),
    ]);
    const result: FoodCategoriesResult = {
      recipeCategories,
      ingredientCategories,
    };
    await this.redis.set(
      key,
      JSON.stringify(result),
      CHATBOT_FOOD_CATEGORIES_CACHE_TTL_SECONDS,
    );
    return result;
  }
}
