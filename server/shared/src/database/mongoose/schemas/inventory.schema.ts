import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({
  collection: 'user_ingredients',
  timestamps: true,
})
export class Inventory extends Document {
  @Prop({ required: true, unique: true, type: Number, index: true })
  userId: number;

  @Prop({ type: [Number], default: [] })
  ingredientsIds: number[];

  @Prop({ type: [Number], default: [] })
  favoriteIngredientIds: number[];

  @Prop({ type: Date })
  lastSyncedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

InventorySchema.index({ ingredientsIds: 1 });
InventorySchema.index({ favoriteIngredientIds: 1 });
