/**
 * 개발용 시드 데이터 (user_ingredients)
 * Prisma 시드(재료·레시피) 후 실행 권장. userId·ingredientId는 RDS User·Ingredient와 맞춤.
 * 실행: npm run mongoose:seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { UserIngredientSchema } from './schemas/user-ingredient.schema';

const UserIngredientModel = mongoose.model(
  'UserIngredient',
  UserIngredientSchema,
  'user_ingredients',
);

/** Prisma 시드 재료 ID 참고 (밥1, 김치2, 양파3, 대파4, 달걀5, 간장6, ...) */
const SEED_USER_INGREDIENTS = [
  {
    userId: 1,
    ingredientsIds: [1, 2, 3, 4, 5, 6, 7],
    favoriteIngredientIds: [1, 3, 5],
  },
  {
    userId: 2,
    ingredientsIds: [2, 3, 5, 8, 9, 10],
    favoriteIngredientIds: [2, 5],
  },
  {
    userId: 3,
    ingredientsIds: [1, 5, 6, 7, 11, 12],
    favoriteIngredientIds: [1, 6],
  },
];

async function main() {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    throw new Error('MONGODB_URL 환경 변수가 필요합니다.');
  }
  await mongoose.connect(uri);
  console.log('🌱 user_ingredients 시드 데이터 삽입 시작...');

  for (const doc of SEED_USER_INGREDIENTS) {
    const now = new Date();
    const updated = await UserIngredientModel.findOneAndUpdate(
      { userId: doc.userId },
      {
        $set: {
          ingredientsIds: doc.ingredientsIds,
          favoriteIngredientIds: doc.favoriteIngredientIds,
          lastSyncedAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          userId: doc.userId,
          createdAt: now,
        },
      },
      { upsert: true, new: true },
    );
    console.log(
      `  ✓ userId=${doc.userId} 재료함: ${doc.ingredientsIds.length}개, 즐겨찾기: ${doc.favoriteIngredientIds.length}개 (id: ${updated._id})`,
    );
  }

  console.log(
    `✅ user_ingredients 시드 완료 (${SEED_USER_INGREDIENTS.length}명)`,
  );
}

main()
  .catch((e) => {
    console.error('❌ 시드 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
