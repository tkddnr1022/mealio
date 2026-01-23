
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';

export type UserIngredientDocument = HydratedDocument<UserIngredient>;

@Schema({
  collection: 'user_ingredients',
  timestamps: true
})
export class UserIngredient extends Document {
  @Prop({ required: true, unique: true, type: Number, index: true })
  userId: number;
  

  @Prop({ type: [Number], default: [] })
  ingredientsIds: number[];

  @Prop({ type: [Number], default: [] })
  favoriteIngredientIds: number[];

  @Prop({ type: Date })
  lastSyncedAt?: Date;  // 마지막 동기화 시간

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserIngredientSchema = SchemaFactory.createForClass(UserIngredient);

// 인덱스 설정
UserIngredientSchema.index({ 'ingredients.ingredientId': 1 });  // 재료별 보유 사용자 조회
UserIngredientSchema.index({ 'ingredients.expiryDate': 1 });  // 유통기한 임박 알림
UserIngredientSchema.index({ favoriteIngredientIds: 1 });  // 즐겨찾기 재료
