import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryRepository } from '../../infrastructure/database/repositories/mongodb/inventory.repository';
import { IngredientRepository } from '../../infrastructure/database/repositories/postgresql/ingredient.repository';
import { RecipeRepository } from '../../infrastructure/database/repositories/postgresql/recipe.repository';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { InventoryCacheStrategy } from '../../infrastructure/cache/strategies/inventory-cache-strategy';
import { KAFKA_TOPICS } from '@mealio/shared';
import {
  InventoryEventType,
  InventoryUpdateEvent,
  InventoryAddEvent,
  InventoryRemoveEvent,
  InventoryFavoritesUpdateEvent,
  InventoryFavoritesAddEvent,
  InventoryFavoritesRemoveEvent,
  InventoryRecipeFavoritesAddEvent,
  InventoryRecipeFavoritesRemoveEvent,
} from '@mealio/shared';
import { InventoryListDto } from './dto/inventory-list.dto';
import type { InventoryEntryDto } from './dto/inventory-entry.dto';
import { OwnedIngredientIdsDto } from './dto/owned-ingredient-ids.dto';
import { FavoriteIngredientIdsDto } from './dto/favorite-ingredient-ids.dto';
import { FavoriteRecipeIdsDto } from './dto/favorite-recipe-ids.dto';
import type { IngredientWithCategoryNameRow } from '../../infrastructure/database/repositories/postgresql/ingredient.repository';
import type { RecipeWithStats } from '../../infrastructure/database/repositories/postgresql/recipe.repository';
import type { RecipeSummaryDto } from '../recipes/dto/recipe-summary.dto';

interface InventorySnapshotDto {
  ownedIngredients: InventoryEntryDto[];
  favoriteIngredients: InventoryEntryDto[];
  favoriteRecipes: RecipeSummaryDto[];
}

// TODO: SSOT 검토
interface InventoryDocumentShape {
  ingredients?: {
    ownedIds?: number[];
    favoriteIds?: number[];
  };
  recipes?: {
    favoriteIds?: number[];
  };
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly ingredientRepository: IngredientRepository,
    private readonly recipeRepository: RecipeRepository,
    private readonly userRepository: UserRepository,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly cacheService: CacheService,
    private readonly inventoryCacheStrategy: InventoryCacheStrategy,
  ) {}

  /**
   * 내 보관함 조회 (Cache-Aside: Redis -> MongoDB 폴백)
   */
  async getMyInventory(userId: number): Promise<InventoryListDto> {
    return this.getCachedInventorySnapshot(userId);
  }

  /**
   * 내 관심 레시피 ID만 조회 (`getMyInventory`와 동일 Redis 캐시 경로 재사용).
   */
  async getFavoriteRecipeIds(
    userId: number,
  ): Promise<{ favoriteRecipeIds: number[] }> {
    const snapshot = await this.getCachedInventorySnapshot(userId);
    return {
      favoriteRecipeIds: snapshot.favoriteRecipes.map((r) => r.id),
    };
  }

  /**
   * 보유 재료 업데이트 (전체 교체) - Command는 이벤트만 발행
   */
  async updateOwnedIngredients(
    userId: number,
    dto: OwnedIngredientIdsDto,
  ): Promise<{ success: boolean }> {
    await this.ensureUserExists(userId);

    const event: InventoryUpdateEvent = {
      type: InventoryEventType.UPDATE,
      userId,
      ownedIngredientIds: dto.ownedIngredientIds,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);

    return { success: true };
  }

  /**
   * 보유 재료 추가 - Command는 이벤트만 발행
   */
  async addOwnedIngredients(
    userId: number,
    dto: OwnedIngredientIdsDto,
  ): Promise<{ success: boolean }> {
    await this.ensureUserExists(userId);

    const event: InventoryAddEvent = {
      type: InventoryEventType.ADD,
      userId,
      ownedIngredientIds: dto.ownedIngredientIds,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);

    return { success: true };
  }

  /**
   * 보유 재료 삭제 - Command는 이벤트만 발행
   */
  async removeOwnedIngredient(
    userId: number,
    ingredientId: number,
  ): Promise<void> {
    await this.ensureUserExists(userId);

    const event: InventoryRemoveEvent = {
      type: InventoryEventType.REMOVE,
      userId,
      ingredientId,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);
  }

  /**
   * 관심 재료 설정 (전체 교체) - Command는 이벤트만 발행
   */
  async updateFavoriteIngredients(
    userId: number,
    dto: FavoriteIngredientIdsDto,
  ): Promise<{ success: boolean }> {
    await this.ensureUserExists(userId);

    const event: InventoryFavoritesUpdateEvent = {
      type: InventoryEventType.FAVORITES_UPDATE,
      userId,
      favoriteIngredientIds: dto.favoriteIngredientIds,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);

    return { success: true };
  }

  /**
   * 관심 재료 추가 - Command는 이벤트만 발행
   */
  async addFavoriteIngredients(
    userId: number,
    dto: FavoriteIngredientIdsDto,
  ): Promise<{ success: boolean }> {
    await this.ensureUserExists(userId);

    const event: InventoryFavoritesAddEvent = {
      type: InventoryEventType.FAVORITES_ADD,
      userId,
      favoriteIngredientIds: dto.favoriteIngredientIds,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);

    return { success: true };
  }

  /**
   * 관심 재료 삭제 - Command는 이벤트만 발행
   */
  async removeFavoriteIngredient(
    userId: number,
    ingredientId: number,
  ): Promise<void> {
    await this.ensureUserExists(userId);

    const event: InventoryFavoritesRemoveEvent = {
      type: InventoryEventType.FAVORITES_REMOVE,
      userId,
      ingredientId,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);
  }

  /**
   * 관심 레시피 추가 - Command는 이벤트만 발행
   */
  async addFavoriteRecipes(
    userId: number,
    dto: FavoriteRecipeIdsDto,
  ): Promise<{ success: boolean }> {
    await this.ensureUserExists(userId);

    const event: InventoryRecipeFavoritesAddEvent = {
      type: InventoryEventType.RECIPE_FAVORITES_ADD,
      userId,
      favoriteRecipeIds: dto.favoriteRecipeIds,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);

    return { success: true };
  }

  /**
   * 관심 레시피 삭제 - Command는 이벤트만 발행
   */
  async removeFavoriteRecipe(userId: number, recipeId: number): Promise<void> {
    await this.ensureUserExists(userId);

    const event: InventoryRecipeFavoritesRemoveEvent = {
      type: InventoryEventType.RECIPE_FAVORITES_REMOVE,
      userId,
      recipeId,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);
  }

  private mapIdsToEntries(
    orderedIds: number[],
    rows: IngredientWithCategoryNameRow[],
  ): InventoryEntryDto[] {
    const map = new Map(rows.map((r) => [r.id, r]));
    return orderedIds.map((id) => {
      const row = map.get(id);
      return {
        id,
        name: row?.name ?? '',
        categoryId: row?.categoryId ?? null,
        categoryName: row?.categoryName ?? null,
      };
    });
  }

  private mapRecipeIdsToEntries(
    orderedIds: number[],
    rows: RecipeSummaryDto[],
  ): RecipeSummaryDto[] {
    const map = new Map(rows.map((row) => [row.id, row]));
    return orderedIds
      .map((id) => map.get(id))
      .filter((row): row is RecipeSummaryDto => row !== undefined);
  }

  private toRecipeSummaryDto(recipe: RecipeWithStats): RecipeSummaryDto {
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description ?? null,
      difficulty: recipe.difficulty,
      cookTime: recipe.cookTime,
      imageUrl: recipe.imageUrl ?? null,
      servings: recipe.servings,
      viewCount: recipe.viewCount,
      likeCount: recipe.likeCount,
      isPublished: recipe.isPublished,
      createdAt: recipe.createdAt,
    };
  }

  // TODO: 캐시 전략 검토
  private async getCachedInventorySnapshot(
    userId: number,
  ): Promise<InventorySnapshotDto> {
    return this.cacheService.getOrSet<InventorySnapshotDto>(
      this.inventoryCacheStrategy,
      async () => {
        const doc = await this.inventoryRepository.findByUserId(userId);

        if (!doc) {
          return {
            ownedIngredients: [],
            favoriteIngredients: [],
            favoriteRecipes: [],
          };
        }

        const typedDoc = doc as InventoryDocumentShape;
        const ownedIds = typedDoc.ingredients?.ownedIds ?? [];
        const favoriteIds = typedDoc.ingredients?.favoriteIds ?? [];
        const favoriteRecipeIds = typedDoc.recipes?.favoriteIds ?? [];
        const uniqueIds = [
          ...new Set([...ownedIds, ...favoriteIds]),
        ] as number[];
        const rows = await this.ingredientRepository.findManyByIds(uniqueIds);
        const favoriteRecipes = (
          await this.recipeRepository.findSummariesByIds(favoriteRecipeIds)
        ).map((recipe) => this.toRecipeSummaryDto(recipe));

        return {
          ownedIngredients: this.mapIdsToEntries(ownedIds, rows),
          favoriteIngredients: this.mapIdsToEntries(favoriteIds, rows),
          favoriteRecipes: this.mapRecipeIdsToEntries(
            favoriteRecipeIds,
            favoriteRecipes,
          ),
        };
      },
      userId,
    );
  }

  private async ensureUserExists(userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
