import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, type InventoryDocument } from '@cook/shared';

/**
 * Consumer 전용 Inventory 리포지토리 - 유저 재료 이벤트 처리 시 MongoDB user_ingredients 갱신
 */
@Injectable()
export class InventoryRepository {
  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

  /**
   * 보유 재료 목록 전체 교체 (유저 재료 업데이트)
   */
  async update(
    userId: number,
    ingredientIds: number[],
  ): Promise<InventoryDocument> {
    const uniqueIds = [...new Set(ingredientIds)];
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $set: {
            ingredientsIds: uniqueIds,
            lastSyncedAt: new Date(),
          },
        },
        { new: true, upsert: true },
      )
      .exec() as Promise<InventoryDocument>;
  }

  /**
   * 보유 재료 추가 (ADD)
   */
  async add(
    userId: number,
    ingredientIds: number[],
  ): Promise<InventoryDocument> {
    const uniqueToAdd = [...new Set(ingredientIds)];
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $addToSet: { ingredientsIds: { $each: uniqueToAdd } },
          $set: { lastSyncedAt: new Date() },
        },
        { new: true, upsert: true },
      )
      .exec() as Promise<InventoryDocument>;
  }

  /**
   * 보유 재료 한 건 제거 (REMOVE). 즐겨찾기에서도 제거.
   */
  async remove(
    userId: number,
    ingredientId: number,
  ): Promise<InventoryDocument | null> {
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $pull: {
            ingredientsIds: ingredientId,
            favoriteIngredientIds: ingredientId,
          },
          $set: { lastSyncedAt: new Date() },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * 즐겨찾기 재료 목록 교체 (FAVORITES_UPDATE)
   */
  async updateFavorites(
    userId: number,
    ingredientIds: number[],
  ): Promise<InventoryDocument> {
    const uniqueIds = [...new Set(ingredientIds)];
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $set: {
            favoriteIngredientIds: uniqueIds,
            lastSyncedAt: new Date(),
          },
        },
        { new: true, upsert: true },
      )
      .exec() as Promise<InventoryDocument>;
  }

  /**
   * 즐겨찾기 재료 추가 (FAVORITES_ADD)
   */
  async addFavoriteIngredientIds(
    userId: number,
    ingredientIds: number[],
  ): Promise<InventoryDocument> {
    const uniqueToAdd = [...new Set(ingredientIds)];
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $addToSet: { favoriteIngredientIds: { $each: uniqueToAdd } },
          $set: { lastSyncedAt: new Date() },
        },
        { new: true, upsert: true },
      )
      .exec() as Promise<InventoryDocument>;
  }

  /**
   * 즐겨찾기 재료 한 건 제거 (FAVORITES_REMOVE)
   */
  async removeFavoriteIngredientId(
    userId: number,
    ingredientId: number,
  ): Promise<InventoryDocument | null> {
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $pull: { favoriteIngredientIds: ingredientId },
          $set: { lastSyncedAt: new Date() },
        },
        { new: true },
      )
      .exec();
  }
}
