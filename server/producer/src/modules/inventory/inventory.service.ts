import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryRepository } from '../../infrastructure/database/repositories/mongodb/inventory.repository';
import { IngredientRepository } from '../../infrastructure/database/repositories/postgresql/ingredient.repository';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { InventoryCacheStrategy } from '../../infrastructure/cache/strategies/inventory-cache-strategy';
import { KAFKA_TOPICS } from '@cook/shared';
import {
  InventoryEventType,
  InventoryUpdateEvent,
  InventoryAddEvent,
  InventoryRemoveEvent,
  InventoryFavoritesUpdateEvent,
  InventoryFavoritesAddEvent,
  InventoryFavoritesRemoveEvent,
} from '@cook/shared';
import { InventoryListDto } from './dto/inventory-list.dto';
import type { InventoryEntryDto } from './dto/inventory-entry.dto';
import { OwnedIngredientIdsDto } from './dto/owned-ingredient-ids.dto';
import { FavoriteIngredientIdsDto } from './dto/favorite-ingredient-ids.dto';
import type { Ingredient } from '@cook/shared/prisma-client';

interface InventorySnapshotDto {
  ownedIngredients: InventoryEntryDto[];
  favoriteIngredients: InventoryEntryDto[];
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly ingredientRepository: IngredientRepository,
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
  async removeOwnedIngredient(userId: number, ingredientId: number): Promise<void> {
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

  private mapIdsToEntries(
    orderedIds: number[],
    rows: Pick<Ingredient, 'id' | 'name' | 'categoryId'>[],
  ): InventoryEntryDto[] {
    const map = new Map(rows.map((r) => [r.id, r]));
    return orderedIds.map((id) => {
      const row = map.get(id);
      return {
        id,
        name: row?.name ?? '',
        categoryId: row?.categoryId ?? null,
      };
    });
  }

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
          };
        }

        const ownedIds = doc.ingredientsIds ?? [];
        const favoriteIds = doc.favoriteIngredientIds ?? [];
        const uniqueIds = [
          ...new Set([...ownedIds, ...favoriteIds]),
        ] as number[];
        const rows = await this.ingredientRepository.findManyByIds(uniqueIds);

        return {
          ownedIngredients: this.mapIdsToEntries(ownedIds, rows),
          favoriteIngredients: this.mapIdsToEntries(favoriteIds, rows),
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
