import { Injectable, NotFoundException } from '@nestjs/common';
import { RecipeRepository, RecipeListOrder } from '../../infrastructure/database/repositories/postgresql/recipe.repository';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { RecipeCacheStrategy } from '../../infrastructure/cache/strategies/recipe-cache-strategy';
import { RecipeSummaryDto } from './dto/recipe-summary.dto';
import { RecipeDetailDto, RecipeIngredientItemDto, RecipeInstructionStepDto } from './dto/recipe-detail.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Recipe } from '@cook/shared/prisma-client';

type RecipeWithIngredients = Recipe & {
  recipeIngredients: Array<{
    id: number;
    amount: unknown;
    unit: string | null;
    isOptional: boolean;
    ingredient: { id: number; name: string };
  }>;
};

@Injectable()
export class RecipeQueryService {
  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly cacheService: CacheService,
    private readonly recipeCacheStrategy: RecipeCacheStrategy,
  ) {}

  async getList(params: {
    page: number;
    size: number;
    difficulty?: number[];
    cookTime?: number;
    sort?: RecipeListOrder;
  }): Promise<{ data: RecipeSummaryDto[]; pagination: PaginationDto }> {
    const { data, total } = await this.recipeRepository.findManyPaginated({
      page: params.page,
      size: params.size,
      difficulty: params.difficulty,
      maxCookTime: params.cookTime,
      sort: params.sort ?? 'latest',
    });

    const totalPages = Math.ceil(total / params.size) || 1;

    return {
      data: data.map((r) => this.toSummaryDto(r)),
      pagination: {
        page: params.page,
        size: params.size,
        total,
        totalPages,
      },
    };
  }

  async getById(recipeId: number): Promise<RecipeDetailDto> {
    // TODO: viewcount 처리
    const recipe = await this.cacheService.getOrSet(
      this.recipeCacheStrategy,
      async () => {
        const found = await this.recipeRepository.findById(recipeId);
        if (!found) {
          throw new NotFoundException('Recipe not found');
        }
        return this.toDetailDto(found as RecipeWithIngredients);
      },
      recipeId,
    );

    return recipe;
  }

  async search(params: {
    q: string;
    page: number;
    size: number;
  }): Promise<{ data: RecipeSummaryDto[]; pagination: PaginationDto }> {
    const { data, total } = await this.recipeRepository.searchByKeyword({
      keyword: params.q.trim(),
      page: params.page,
      size: params.size,
    });

    const totalPages = Math.ceil(total / params.size) || 1;

    return {
      data: data.map((r) => this.toSummaryDto(r)),
      pagination: {
        page: params.page,
        size: params.size,
        total,
        totalPages,
      },
    };
  }

  /**
   * ID 목록으로 레시피 요약 정보 벌크 조회 (챗봇 추천 레시피 상세 표시 등)
   */
  async getSummariesByIds(ids: number[]): Promise<RecipeSummaryDto[]> {
    if (ids.length === 0) return [];
    const data = await this.recipeRepository.findSummariesByIds(ids);
    return data.map((r) => this.toSummaryDto(r as Recipe));
  }

  private toSummaryDto(recipe: Recipe): RecipeSummaryDto {
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description ?? null,
      difficulty: recipe.difficulty,
      cookTime: recipe.cookTime,
      imageUrl: recipe.imageUrl ?? null,
      servings: recipe.servings,
      viewCount: recipe.viewCount,
      isPublished: recipe.isPublished,
      createdAt: recipe.createdAt,
    };
  }

  private toDetailDto(recipe: RecipeWithIngredients): RecipeDetailDto {
    const instructions = this.parseInstructions(recipe.instructions);
    const ingredients: RecipeIngredientItemDto[] = recipe.recipeIngredients.map(
      (ri) => ({
        id: ri.ingredient.id,
        name: ri.ingredient.name,
        amount: ri.amount != null ? Number(ri.amount) : null,
        unit: ri.unit ?? null,
        isOptional: ri.isOptional,
      }),
    );

    return {
      ...this.toSummaryDto(recipe),
      instructions,
      ingredients,
    };
  }

  private parseInstructions(instructions: unknown): RecipeInstructionStepDto[] {
    if (!Array.isArray(instructions)) {
      return [];
    }
    return instructions.map((item: { step?: number; content?: string; imageUrl?: string }, idx: number) => ({
      step: typeof item?.step === 'number' ? item.step : idx + 1,
      content: typeof item?.content === 'string' ? item.content : '',
      imageUrl: typeof item?.imageUrl === 'string' ? item.imageUrl : null,
    }));
  }
}
