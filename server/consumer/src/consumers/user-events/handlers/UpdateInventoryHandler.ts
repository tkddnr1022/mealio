import { Injectable } from '@nestjs/common';
import {
  InventoryEventType,
  type InventoryEvent,
} from '@cook/shared';
import { InventoryRepository } from 'src/persistence/repositories/mongodb/inventory.repository';
import { CacheInvalidationRequestService } from 'src/consumers/cache-invalidation/cache-invalidation-request.service';

/**
 * 유저 인벤토리 이벤트 수신 시 MongoDB Inventory 갱신
 * - UPDATE: 보유 재료 목록 전체 교체
 * - ADD: 보유 재료 추가
 * - REMOVE: 보유 재료 한 건 제거 (즐겨찾기에서도 제거)
 * - FAVORITES_UPDATE: 즐겨찾기 재료 목록 교체
 * - FAVORITES_ADD: 즐겨찾기 재료 추가
 * - FAVORITES_REMOVE: 즐겨찾기 재료 한 건 제거
 * - RECIPE_FAVORITES_ADD: 관심 레시피 추가
 * - RECIPE_FAVORITES_REMOVE: 관심 레시피 한 건 제거
 *
 * 캐시 무효화: DB 반영 후 Producer의 유저 인벤토리 캐시를 무효화하기 위해
 * CacheInvalidationRequestService에 요청만 한다. Handler는 토픽을 직접 발행하지 않으며,
 * 실제 Redis 삭제는 cache-invalidation 토픽을 구독하는 쪽에서 수행한다.
 */
@Injectable()
export class UpdateInventoryHandler {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly cacheInvalidationRequestService: CacheInvalidationRequestService,
  ) {}

  async execute(event: InventoryEvent): Promise<void> {
    switch (event.type) {
      case InventoryEventType.UPDATE:
        await this.inventoryRepository.updateOwnedIngredientIds(
          event.userId,
          event.ownedIngredientIds,
        );
        break;
      case InventoryEventType.ADD:
        await this.inventoryRepository.addOwnedIngredientIds(
          event.userId,
          event.ownedIngredientIds,
        );
        break;
      case InventoryEventType.REMOVE:
        await this.inventoryRepository.removeOwnedIngredientId(
          event.userId,
          event.ingredientId,
        );
        break;
      case InventoryEventType.FAVORITES_UPDATE:
        await this.inventoryRepository.updateFavoriteIngredientIds(
          event.userId,
          event.favoriteIngredientIds,
        );
        break;
      case InventoryEventType.FAVORITES_ADD:
        await this.inventoryRepository.addFavoriteIngredientIds(
          event.userId,
          event.favoriteIngredientIds,
        );
        break;
      case InventoryEventType.FAVORITES_REMOVE:
        await this.inventoryRepository.removeFavoriteIngredientId(
          event.userId,
          event.ingredientId,
        );
        break;
      case InventoryEventType.RECIPE_FAVORITES_ADD:
        await this.inventoryRepository.addFavoriteRecipeIds(
          event.userId,
          event.favoriteRecipeIds,
        );
        break;
      case InventoryEventType.RECIPE_FAVORITES_REMOVE:
        await this.inventoryRepository.removeFavoriteRecipeId(
          event.userId,
          event.recipeId,
        );
        break;
    }

    // Producer의 inventory 캐시 무효화 요청 (발행은 서비스 레이어에서 수행)
    await this.cacheInvalidationRequestService.requestInventoryInvalidation(
      event.userId,
    );
  }
}
