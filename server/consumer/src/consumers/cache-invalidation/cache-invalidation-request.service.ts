import { Injectable } from '@nestjs/common';
import {
  KAFKA_TOPICS,
  CacheInvalidationEventType,
  type CacheInvalidationUserProfilePayload,
  type CacheInvalidationInventoryPayload,
  type CacheInvalidationRecipePayload,
  type CacheInvalidationRecommendationPayload,
} from '@mealio/shared';
import { KafkaProducerService } from 'src/integrations/kafka/kafka-producer.service';

/**
 * 캐시 무효화를 "요청"하는 서비스.
 * Handler 레이어는 이 서비스만 호출하며, 실제 Redis DEL은 cache-invalidation 토픽을
 * 구독하는 CacheInvalidationProcessor(및 RedisInvalidationHandler)에서 수행한다.
 */
@Injectable()
export class CacheInvalidationRequestService {
  constructor(private readonly kafkaProducerService: KafkaProducerService) {}

  /**
   * Producer의 유저 프로필 캐시(`cacheKeyUserProfile`) 무효화를 요청한다.
   * cache-invalidation 토픽에 이벤트를 발행하며, 수신 측에서 Redis 키를 삭제한다.
   */
  async requestUserProfileInvalidation(userId: number): Promise<void> {
    const payload: CacheInvalidationUserProfilePayload = {
      type: CacheInvalidationEventType.USER_PROFILE,
      userId,
    };
    await this.kafkaProducerService.emit(
      KAFKA_TOPICS.CACHE_INVALIDATION,
      payload,
      String(userId),
    );
  }

  /**
   * Producer의 유저 재료 캐시(`cacheKeyInventory`) 무효화를 요청한다.
   * cache-invalidation 토픽에 이벤트를 발행하며, 수신 측에서 Redis 키를 삭제한다.
   */
  async requestInventoryInvalidation(userId: number): Promise<void> {
    const payload: CacheInvalidationInventoryPayload = {
      type: CacheInvalidationEventType.INVENTORY,
      userId,
    };
    await this.kafkaProducerService.emit(
      KAFKA_TOPICS.CACHE_INVALIDATION,
      payload,
      String(userId),
    );
  }

  /**
   * Producer의 레시피 관련 캐시(`recipe:*`) 무효화를 요청한다.
   * cache-invalidation 토픽에 이벤트를 발행하며, 수신 측에서 Redis 키를 삭제한다.
   */
  async requestRecipeInvalidation(recipeIds: number[]): Promise<void> {
    const uniqueRecipeIds = [...new Set(recipeIds)].filter((id) => id > 0);
    if (uniqueRecipeIds.length === 0) {
      return;
    }
    const payload: CacheInvalidationRecipePayload = {
      type: CacheInvalidationEventType.RECIPE,
      recipeIds: uniqueRecipeIds,
    };
    await this.kafkaProducerService.emit(
      KAFKA_TOPICS.CACHE_INVALIDATION,
      payload,
      `recipe:${uniqueRecipeIds.join(',')}`,
    );
  }

  /**
   * Producer의 개인화 추천 캐시(`cacheKeyRecommendation`) 무효화를 요청한다.
   */
  async requestRecommendationInvalidation(userId: number): Promise<void> {
    const payload: CacheInvalidationRecommendationPayload = {
      type: CacheInvalidationEventType.RECOMMENDATION,
      userId,
    };
    await this.kafkaProducerService.emit(
      KAFKA_TOPICS.CACHE_INVALIDATION,
      payload,
      `recommendation:${userId}`,
    );
  }
}
