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
    categoryId?: number;
    page: number;
    size: number;
  }): Promise<{ data: IngredientDto[]; pagination: PaginationDto }> {
    const categoryKey =
      params.categoryId ?? CACHE_KEY_SEGMENT.CATEGORY_ALL;

    return this.cacheService.getOrSet(
      this.ingredientCacheStrategy,
      async () => {
        const { data, total } =
          await this.ingredientRepository.findManyPaginated({
            categoryId: params.categoryId,
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
      CACHE_KEY_SEGMENT.LIST,
      categoryKey,
      params.page,
      params.size,
    );
  }

  async search(params: {
    q?: string;
    categoryId?: number;
    page: number;
    size: number;
  }): Promise<{ data: IngredientDto[]; pagination: PaginationDto }> {
    const raw = params.q?.trim() ?? '';
    const keyword = raw.length > 0 ? raw : undefined;
    const cacheKeyKeyword = keyword ?? CACHE_KEY_SEGMENT.CATEGORY_ALL;
    const cacheKeyCategory =
      params.categoryId ?? CACHE_KEY_SEGMENT.CATEGORY_ALL;

    const result = await this.cacheService.getOrSet(
      this.ingredientCacheStrategy,
      async () => {
        const { data, total } =
          await this.ingredientRepository.searchByKeyword({
            keyword,
            categoryId: params.categoryId,
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
      CACHE_KEY_SEGMENT.SEARCH,
      cacheKeyKeyword,
      cacheKeyCategory,
      params.page,
      params.size,
    );

    return result;
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
      categoryId: ingredient.categoryId,
    };
  }
}
