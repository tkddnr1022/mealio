import { Injectable } from '@nestjs/common';
import {
  RedisService,
  RECIPE_INGESTION_CATEGORY_CACHE_TTL_SECONDS,
  cacheKeyRecipeIngestionFoodCategories,
} from '@mealio/shared';
import { IngredientCategoryRepository } from 'src/persistence/repositories/postgresql/ingredient-category.repository';
import {
  RecipeCategoryRepository,
  type CategorySelectRow,
} from 'src/persistence/repositories/postgresql/recipe-category.repository';

export interface RecipeIngestionCategoryContext {
  recipeCategories: CategorySelectRow[];
  ingredientCategories: CategorySelectRow[];
}

/**
 * recipe ingestion parse-submit용 레시피·재료 카테고리 컨텍스트 (Redis TTL 1h)
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §5.2
 */
@Injectable()
export class CategoryContextService {
  constructor(
    private readonly recipeCategoryRepository: RecipeCategoryRepository,
    private readonly ingredientCategoryRepository: IngredientCategoryRepository,
    private readonly redis: RedisService,
  ) {}

  async getCategoryContext(): Promise<RecipeIngestionCategoryContext> {
    const key = cacheKeyRecipeIngestionFoodCategories();
    const cached = await this.redis.get(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as RecipeIngestionCategoryContext;
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
      this.recipeCategoryRepository.findActiveCategories(),
      this.ingredientCategoryRepository.findActiveCategories(),
    ]);

    const result: RecipeIngestionCategoryContext = {
      recipeCategories,
      ingredientCategories,
    };

    await this.redis.set(
      key,
      JSON.stringify(result),
      RECIPE_INGESTION_CATEGORY_CACHE_TTL_SECONDS,
    );

    return result;
  }
}
