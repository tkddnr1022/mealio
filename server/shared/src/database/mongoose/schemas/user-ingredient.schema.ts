import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';

export type UserIngredientDocument = HydratedDocument<UserIngredient>;

@Schema({
  collection: 'user_ingredients',
  timestamps: true,
})
export class UserIngredient extends Document {
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

export const UserIngredientSchema =
  SchemaFactory.createForClass(UserIngredient);

UserIngredientSchema.index({ ingredientsIds: 1 });
UserIngredientSchema.index({ favoriteIngredientIds: 1 });
