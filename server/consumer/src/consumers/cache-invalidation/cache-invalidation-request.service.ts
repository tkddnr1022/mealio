import { Injectable } from '@nestjs/common';
import {
  KAFKA_TOPICS,
  CacheInvalidationEventType,
  type CacheInvalidationUserProfilePayload,
  type CacheInvalidationUserIngredientPayload,
} from '@cook/shared';
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
   * Producer의 유저 재료 캐시(`cacheKeyUserIngredient`) 무효화를 요청한다.
   * cache-invalidation 토픽에 이벤트를 발행하며, 수신 측에서 Redis 키를 삭제한다.
   */
  async requestUserIngredientInvalidation(userId: number): Promise<void> {
    const payload: CacheInvalidationUserIngredientPayload = {
      type: CacheInvalidationEventType.USER_INGREDIENT,
      userId,
    };
    await this.kafkaProducerService.emit(
      KAFKA_TOPICS.CACHE_INVALIDATION,
      payload,
      String(userId),
    );
  }
}
