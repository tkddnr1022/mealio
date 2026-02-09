import { Injectable } from '@nestjs/common';
import {
  UserIngredientEventType,
  type UserIngredientEvent,
} from '@cook/shared';
import { UserIngredientRepository } from 'src/persistence/repositories/mongodb/user-ingredient.repository';
import { CacheInvalidationRequestService } from 'src/consumers/cache-invalidation/cache-invalidation-request.service';

/**
 * 유저 재료 이벤트 수신 시 MongoDB UserIngredient 갱신
 * - UPDATE: 보유 재료 목록 전체 교체
 * - ADD: 보유 재료 추가
 * - REMOVE: 보유 재료 한 건 제거 (즐겨찾기에서도 제거)
 * - FAVORITES_UPDATE: 즐겨찾기 재료 목록 교체
 * - FAVORITES_ADD: 즐겨찾기 재료 추가
 * - FAVORITES_REMOVE: 즐겨찾기 재료 한 건 제거
 *
 * 캐시 무효화: DB 반영 후 Producer의 유저 재료 캐시를 무효화하기 위해
 * CacheInvalidationRequestService에 요청만 한다. Handler는 토픽을 직접 발행하지 않으며,
 * 실제 Redis 삭제는 cache-invalidation 토픽을 구독하는 쪽에서 수행한다.
 */
@Injectable()
export class UpdateUserIngredientHandler {
  constructor(
    private readonly userIngredientRepository: UserIngredientRepository,
    private readonly cacheInvalidationRequestService: CacheInvalidationRequestService,
  ) {}

  async execute(event: UserIngredientEvent): Promise<void> {
    switch (event.type) {
      case UserIngredientEventType.UPDATE:
        await this.userIngredientRepository.update(
          event.userId,
          event.ingredientIds,
        );
        break;
      case UserIngredientEventType.ADD:
        await this.userIngredientRepository.add(
          event.userId,
          event.ingredientIds,
        );
        break;
      case UserIngredientEventType.REMOVE:
        await this.userIngredientRepository.remove(
          event.userId,
          event.ingredientId,
        );
        break;
      case UserIngredientEventType.FAVORITES_UPDATE:
        await this.userIngredientRepository.updateFavorites(
          event.userId,
          event.ingredientIds,
        );
        break;
      case UserIngredientEventType.FAVORITES_ADD:
        await this.userIngredientRepository.addFavoriteIngredientIds(
          event.userId,
          event.ingredientIds,
        );
        break;
      case UserIngredientEventType.FAVORITES_REMOVE:
        await this.userIngredientRepository.removeFavoriteIngredientId(
          event.userId,
          event.ingredientId,
        );
        break;
    }

    // Producer의 user-ingredient 캐시 무효화 요청 (발행은 서비스 레이어에서 수행)
    await this.cacheInvalidationRequestService.requestUserIngredientInvalidation(
      event.userId,
    );
  }
}
