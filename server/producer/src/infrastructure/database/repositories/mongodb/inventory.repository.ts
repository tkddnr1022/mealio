import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, InventoryDocument } from '@cook/shared';

@Injectable()
export class InventoryRepository {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

  /**
   * 사용자별 재료함 조회 (읽기 전용: lean + select로 메모리·속도 최적화, 설계 5.3.2)
   */
  async findByUserId(userId: number): Promise<Inventory | null> {
    return this.inventoryModel
      .findOne({ userId })
      .select(
        'userId ingredients.ownedIds ingredients.favoriteIds recipes.favoriteIds lastSyncedAt',
      )
      .lean()
      .exec();
  }

  /**
   * 사용자별 관심 레시피 ID 목록 조회 (레시피 응답 개인화 용도)
   */
  async findFavoriteRecipeIdsByUserId(
    userId: number,
  ): Promise<Pick<Inventory, 'recipes'> | null> {
    return this.inventoryModel
      .findOne({ userId })
      .select('recipes.favoriteIds')
      .lean()
      .exec();
  }

  // Command 메서드들은 producer 서버에서 제거
  // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
  // async upsert(
  //   userId: number,
  //   data: Partial<Inventory>,
  // ): Promise<Inventory> {
  //   return this.inventoryModel
  //     .findOneAndUpdate({ userId }, data, { upsert: true, new: true })
  //     .exec();
  // }
}
