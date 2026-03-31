import { Injectable } from '@nestjs/common';
import { CACHE_KEY_SEGMENT } from '@cook/shared';
import { IngredientRepository } from '../../infrastructure/database/repositories/postgresql/ingredient.repository';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { IngredientCacheStrategy } from '../../infrastructure/cache/strategies/ingredient-cache-strategy';
import { IngredientDto } from './dto/ingredient.dto';
import { IngredientCategoryDto } from './dto/ingredient-category.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Ingredient } from '@cook/shared/prisma-client';

@Injectable()
export class IngredientQueryService {
  constructor(
    private readonly ingredientRepository: IngredientRepository,
    private readonly cacheService: CacheService,
    private readonly ingredientCacheStrategy: IngredientCacheStrategy,
  ) {}

  async getList(params: {
    category?: number;
    page: number;
    size: number;
  }): Promise<{ data: IngredientDto[]; pagination: PaginationDto }> {
    const cacheKeyCategory =
      params.category ?? CACHE_KEY_SEGMENT.CATEGORY_ALL;
    const cacheKey = [
      CACHE_KEY_SEGMENT.LIST,
      cacheKeyCategory,
      params.page,
      params.size,
    ];

    const result = await this.cacheService.getOrSet(
      this.ingredientCacheStrategy,
      async () => {
        const { data, total } =
          await this.ingredientRepository.findManyPaginated({
            category: params.category,
            page: params.page,
            size: params.size,
          });
        const totalPages = Math.ceil(total / params.size) || 1;
        return {
          data: data.map((i) => this.toDto(i)),
          pagination: {
            page: params.page,
            size: params.size,
            total,
            totalPages,
          },
        };
      },
      ...cacheKey,
    );

    return result;
  }

  async search(q: string): Promise<{ data: IngredientDto[] }> {
    const keyword = q.trim();
    const SEARCH_LIMIT = 50;

    const data = await this.cacheService.getOrSet(
      this.ingredientCacheStrategy,
      async () => {
        const ingredients = await this.ingredientRepository.searchByKeyword({
          keyword,
          take: SEARCH_LIMIT,
        });
        return ingredients.map((i) => this.toDto(i));
      },
      CACHE_KEY_SEGMENT.SEARCH,
      keyword,
    );

    return { data };
  }

  async getCategories(): Promise<{ data: IngredientCategoryDto[] }> {
    const data = await this.cacheService.getOrSet(
      this.ingredientCacheStrategy,
      async () => {
        const categories = await this.ingredientRepository.findActiveCategories();
        return categories.map((category) => ({
          id: category.id,
          key: category.key,
          name: category.name,
          displayOrder: category.displayOrder,
          isActive: category.isActive,
        }));
      },
      CACHE_KEY_SEGMENT.CATEGORIES,
    );

    return { data };
  }

  private toDto(ingredient: Ingredient): IngredientDto {
    return {
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
    };
  }
}
