import { Injectable, NotFoundException } from '@nestjs/common';
import { UserIngredientRepository } from '../../infrastructure/database/repositories/mongodb/user-ingredient.repository';
import { IngredientRepository } from '../../infrastructure/database/repositories/postgresql/ingredient.repository';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { UserIngredientCacheStrategy } from '../../infrastructure/cache/strategies/user-ingredient-cache-strategy';
import { KAFKA_TOPICS } from '@cook/shared';
import {
  UserIngredientEventType,
  UserIngredientUpdateEvent,
  UserIngredientAddEvent,
  UserIngredientRemoveEvent,
  UserIngredientFavoritesUpdateEvent,
  UserIngredientFavoritesAddEvent,
  UserIngredientFavoritesRemoveEvent,
} from '@cook/shared';
import { UserIngredientListDto } from './dto/user-ingredient-list.dto';
import type { UserIngredientEntryDto } from './dto/user-ingredient-entry.dto';
import { IngredientIdsDto } from './dto/ingredient-ids.dto';
import type { Ingredient } from '@cook/shared/prisma-client';

@Injectable()
export class UserIngredientsService {
  constructor(
    private readonly userIngredientRepository: UserIngredientRepository,
    private readonly ingredientRepository: IngredientRepository,
    private readonly userRepository: UserRepository,
    private readonly kafkaProducerService: KafkaProducerService,
    private readonly cacheService: CacheService,
    private readonly userIngredientCacheStrategy: UserIngredientCacheStrategy,
  ) {}

  /**
   * 내 재료함 조회 (Cache-Aside: Redis → MongoDB 폴백)
   */
  async getMyIngredients(userId: number): Promise<UserIngredientListDto> {
    return this.cacheService.getOrSet<UserIngredientListDto>(
      this.userIngredientCacheStrategy,
      async () => {
        const doc = await this.userIngredientRepository.findByUserId(userId);

        if (!doc) {
          return {
            ingredients: [],
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
          ingredients: this.mapIdsToEntries(ownedIds, rows),
          favoriteIngredients: this.mapIdsToEntries(favoriteIds, rows),
        };
      },
      userId,
    );
  }

  /**
   * 유저 재료 업데이트 (재료함 전체 교체) - Command는 이벤트만 발행
   */
  async update(
    userId: number,
    dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    await this.ensureUserExists(userId);

    const event: UserIngredientUpdateEvent = {
      type: UserIngredientEventType.UPDATE,
      userId,
      ingredientIds: dto.ingredientIds,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);

    return { success: true };
  }

  /**
   * 재료 추가 - Command는 이벤트만 발행
   */
  async add(
    userId: number,
    dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    await this.ensureUserExists(userId);

    const event: UserIngredientAddEvent = {
      type: UserIngredientEventType.ADD,
      userId,
      ingredientIds: dto.ingredientIds,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);

    return { success: true };
  }

  /**
   * 재료 삭제 - Command는 이벤트만 발행
   */
  async remove(userId: number, ingredientId: number): Promise<void> {
    await this.ensureUserExists(userId);

    const event: UserIngredientRemoveEvent = {
      type: UserIngredientEventType.REMOVE,
      userId,
      ingredientId,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);
  }

  /**
   * 즐겨찾기 재료 설정 (전체 교체) - Command는 이벤트만 발행
   */
  async updateFavorites(
    userId: number,
    dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    await this.ensureUserExists(userId);

    const event: UserIngredientFavoritesUpdateEvent = {
      type: UserIngredientEventType.FAVORITES_UPDATE,
      userId,
      ingredientIds: dto.ingredientIds,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);

    return { success: true };
  }

  /**
   * 즐겨찾는 재료 추가 - Command는 이벤트만 발행
   */
  async addFavorites(
    userId: number,
    dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    await this.ensureUserExists(userId);

    const event: UserIngredientFavoritesAddEvent = {
      type: UserIngredientEventType.FAVORITES_ADD,
      userId,
      ingredientIds: dto.ingredientIds,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);

    return { success: true };
  }

  /**
   * 즐겨찾는 재료 삭제 - Command는 이벤트만 발행
   */
  async removeFavorite(userId: number, ingredientId: number): Promise<void> {
    await this.ensureUserExists(userId);

    const event: UserIngredientFavoritesRemoveEvent = {
      type: UserIngredientEventType.FAVORITES_REMOVE,
      userId,
      ingredientId,
      timestamp: new Date().toISOString(),
    };
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, event);
  }

  private mapIdsToEntries(
    orderedIds: number[],
    rows: Pick<Ingredient, 'id' | 'name' | 'categoryId'>[],
  ): UserIngredientEntryDto[] {
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

  private async ensureUserExists(userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
