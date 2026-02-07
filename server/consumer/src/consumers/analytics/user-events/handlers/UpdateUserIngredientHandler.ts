import { Injectable } from '@nestjs/common';
import {
  UserIngredientEventType,
  type UserIngredientEvent,
} from '@cook/shared';
import { UserIngredientRepository } from 'src/persistence/repositories/mongodb/user-ingredient.repository';

/**
 * 유저 재료 이벤트 수신 시 MongoDB UserIngredient 갱신
 * - BULK_UPDATE: 보유 재료 목록 전체 교체
 * - ADD: 보유 재료 추가
 * - REMOVE: 보유 재료 한 건 제거 (즐겨찾기에서도 제거)
 * - FAVORITES_UPDATE: 즐겨찾기 재료 목록 교체
 */
@Injectable()
export class UpdateUserIngredientHandler {
  constructor(
    private readonly userIngredientRepository: UserIngredientRepository,
  ) {}

  async execute(event: UserIngredientEvent): Promise<void> {
    switch (event.type) {
      case UserIngredientEventType.BULK_UPDATE:
        await this.userIngredientRepository.bulkUpdate(
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
        await this.userIngredientRepository.remove(event.userId, event.ingredientId);
        break;
      case UserIngredientEventType.FAVORITES_UPDATE:
        await this.userIngredientRepository.updateFavorites(
          event.userId,
          event.ingredientIds,
        );
        break;
    }
  }
}
