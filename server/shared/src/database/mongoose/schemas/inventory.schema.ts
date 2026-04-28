import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;

class InventoryIngredients {
  @Prop({ type: [Number], default: [] })
  ownedIds: number[];

  @Prop({ type: [Number], default: [] })
  favoriteIds: number[];
}

class InventoryRecipes {
  @Prop({ type: [Number], default: [] })
  favoriteIds: number[];
}

@Schema({
  collection: 'inventory',
  timestamps: true,
})
export class Inventory extends Document {
  @Prop({ required: true, unique: true, type: Number, index: true })
  userId: number;

  @Prop({ type: InventoryIngredients, default: () => ({}) })
  ingredients: InventoryIngredients;

  @Prop({ type: InventoryRecipes, default: () => ({}) })
  recipes: InventoryRecipes;

  @Prop({ type: Date })
  lastSyncedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

InventorySchema.index({ 'ingredients.ownedIds': 1 });
InventorySchema.index({ 'ingredients.favoriteIds': 1 });
InventorySchema.index({ 'recipes.favoriteIds': 1 });
