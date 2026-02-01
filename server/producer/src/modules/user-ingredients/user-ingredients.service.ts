import { Injectable, NotFoundException } from '@nestjs/common';
import { UserIngredientRepository } from '../../infrastructure/database/repositories/mongodb/user-ingredient.repository';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { UserIngredientCacheStrategy } from '../../infrastructure/cache/strategies/user-ingredient-cache-strategy';
import { KAFKA_TOPICS } from '@cook/shared';
import {
  UserIngredientEventType,
  UserIngredientBulkUpdateEvent,
  UserIngredientAddEvent,
  UserIngredientRemoveEvent,
  UserIngredientFavoritesUpdateEvent,
} from '@cook/shared';
import { UserIngredientListDto } from './dto/user-ingredient-list.dto';
import { IngredientIdsDto } from './dto/ingredient-ids.dto';

@Injectable()
export class UserIngredientsService {
  constructor(
    private readonly userIngredientRepository: UserIngredientRepository,
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
            ingredientIds: [],
            favoriteIngredientIds: [],
          };
        }

        return {
          ingredientIds: doc.ingredientsIds ?? [],
          favoriteIngredientIds: doc.favoriteIngredientIds ?? [],
        };
      },
      userId,
    );
  }

  /**
   * 재료함 전체 교체 (bulk update) - Command는 이벤트만 발행
   */
  async bulkUpdate(
    userId: number,
    dto: IngredientIdsDto,
  ): Promise<{ success: boolean }> {
    await this.ensureUserExists(userId);

    const event: UserIngredientBulkUpdateEvent = {
      type: UserIngredientEventType.BULK_UPDATE,
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
   * 즐겨찾기 재료 설정 - Command는 이벤트만 발행
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

  private async ensureUserExists(userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
