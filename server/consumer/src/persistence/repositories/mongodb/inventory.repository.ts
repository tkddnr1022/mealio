import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inventory, type InventoryDocument } from '@cook/shared';

/**
 * Consumer 전용 Inventory 리포지토리 - 유저 재료 이벤트 처리 시 MongoDB inventory 갱신
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
  async updateOwnedIngredientIds(
    userId: number,
    ingredientIds: number[],
  ): Promise<InventoryDocument> {
    const uniqueIds = [...new Set(ingredientIds)];
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $set: {
            'ingredients.ownedIds': uniqueIds,
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
  async addOwnedIngredientIds(
    userId: number,
    ingredientIds: number[],
  ): Promise<InventoryDocument> {
    const uniqueToAdd = [...new Set(ingredientIds)];
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $addToSet: { 'ingredients.ownedIds': { $each: uniqueToAdd } },
          $set: { lastSyncedAt: new Date() },
        },
        { new: true, upsert: true },
      )
      .exec() as Promise<InventoryDocument>;
  }

  /**
   * 보유 재료 한 건 제거 (REMOVE). 즐겨찾기에서도 제거.
   */
  async removeOwnedIngredientId(
    userId: number,
    ingredientId: number,
  ): Promise<InventoryDocument | null> {
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $pull: {
            'ingredients.ownedIds': ingredientId,
            'ingredients.favoriteIds': ingredientId,
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
  async updateFavoriteIngredientIds(
    userId: number,
    ingredientIds: number[],
  ): Promise<InventoryDocument> {
    const uniqueIds = [...new Set(ingredientIds)];
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $set: {
            'ingredients.favoriteIds': uniqueIds,
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
          $addToSet: { 'ingredients.favoriteIds': { $each: uniqueToAdd } },
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
          $pull: { 'ingredients.favoriteIds': ingredientId },
          $set: { lastSyncedAt: new Date() },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * 관심 레시피 추가 (RECIPE_FAVORITES_ADD)
   */
  async addFavoriteRecipeIds(
    userId: number,
    recipeIds: number[],
  ): Promise<InventoryDocument> {
    const uniqueToAdd = [...new Set(recipeIds)];
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $addToSet: { 'recipes.favoriteIds': { $each: uniqueToAdd } },
          $set: { lastSyncedAt: new Date() },
        },
        { new: true, upsert: true },
      )
      .exec() as Promise<InventoryDocument>;
  }

  /**
   * 관심 레시피 한 건 제거 (RECIPE_FAVORITES_REMOVE)
   */
  async removeFavoriteRecipeId(
    userId: number,
    recipeId: number,
  ): Promise<InventoryDocument | null> {
    return this.inventoryModel
      .findOneAndUpdate(
        { userId },
        {
          $pull: { 'recipes.favoriteIds': recipeId },
          $set: { lastSyncedAt: new Date() },
        },
        { new: true },
      )
      .exec();
  }
}
