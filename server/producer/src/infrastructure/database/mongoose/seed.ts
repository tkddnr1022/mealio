/**
 * 개발용 시드 데이터 (user_ingredients, chatbot_logs)
 * Prisma 시드(재료·레시피) 후 실행 권장. userId·ingredientId는 RDS User·Ingredient와 맞춤.
 * 실행: npm run mongoose:seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { UserIngredientSchema, ChatbotLogSchema } from '@cook/shared';

const UserIngredientModel = mongoose.model(
  'UserIngredient',
  UserIngredientSchema,
  'user_ingredients',
);

const ChatbotLogModel = mongoose.model(
  'ChatbotLog',
  ChatbotLogSchema,
  'chatbot_logs',
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

/** 챗봇 대화 로그 시드 (userId 1,2,3 기준. sessionId = conversationId, context 풍부화) */
const SEED_CHATBOT_LOGS = [
  // userId 1, 대화1 (conv_user1_1) — 보유 재료 기반 추천
  {
    userId: 1,
    role: 'user',
    message: '오늘 저녁으로 뭘 해먹을까요?',
    sessionId: 'conv_user1_1',
    context: {
      sessionId: 'conv_user1_1',
      conversationId: 'conv_user1_1',
      mentionedIngredientIds: [1, 2, 3, 4, 5, 6, 7],
      userPreferences: {
        maxCookTime: 30,
        difficulty: 2,
        servingSize: 2,
        dietary: 'none',
      },
    },
    success: true,
  },
  {
    userId: 1,
    role: 'assistant',
    message:
      '보유 재료(밥, 김치, 양파, 대파, 달걀, 간장 등)로 김치볶음밥이나 김치계란밥을 추천드려요. 간단히 15분이면 완성할 수 있습니다.',
    sessionId: 'conv_user1_1',
    context: {
      sessionId: 'conv_user1_1',
      conversationId: 'conv_user1_1',
      previousMessageIds: ['msg_conv_user1_1_1'],
      mentionedIngredientIds: [1, 2, 3, 4, 5, 6, 7],
      suggestedRecipeIds: [1, 2],
      userPreferences: {
        maxCookTime: 30,
        difficulty: 2,
        servingSize: 2,
      },
    },
    llm: {
      model: 'gpt-4-turbo',
      promptTokens: 120,
      completionTokens: 45,
      totalTokens: 165,
      temperature: 0.7,
    },
    latency: 820,
    success: true,
  },
  // userId 1, 대화2 (conv_user1_2) — 달걀 제외 요청
  {
    userId: 1,
    role: 'user',
    message: '달걀 없이 할 수 있는 메뉴 있어요?',
    sessionId: 'conv_user1_2',
    context: {
      sessionId: 'conv_user1_2',
      conversationId: 'conv_user1_2',
      mentionedIngredientIds: [1, 2, 3, 4, 6, 7],
      userPreferences: {
        excludeIngredientIds: [5],
        maxCookTime: 25,
        servingSize: 2,
      },
    },
    success: true,
  },
  {
    userId: 1,
    role: 'assistant',
    message:
      '달걀 없이 김치찌개, 김치볶음밥(계란 제외), 된장찌개 등을 만들 수 있어요. 김치와 간장만으로도 맛있는 한 끼 가능합니다.',
    sessionId: 'conv_user1_2',
    context: {
      sessionId: 'conv_user1_2',
      conversationId: 'conv_user1_2',
      previousMessageIds: ['msg_conv_user1_2_1'],
      mentionedIngredientIds: [1, 2, 3, 4, 6, 7],
      suggestedRecipeIds: [3, 4],
      userPreferences: {
        excludeIngredientIds: [5],
        maxCookTime: 25,
      },
    },
    llm: {
      model: 'gpt-4-turbo',
      promptTokens: 95,
      completionTokens: 38,
      totalTokens: 133,
    },
    latency: 650,
    success: true,
  },
  // userId 2, 대화1 (conv_user2_1) — 5분 요리
  {
    userId: 2,
    role: 'user',
    message: '5분 안에 뚝딱 할 수 있는 거 없을까요?',
    sessionId: 'conv_user2_1',
    context: {
      sessionId: 'conv_user2_1',
      conversationId: 'conv_user2_1',
      mentionedIngredientIds: [2, 3, 5, 8, 9, 10],
      userPreferences: {
        maxCookTime: 5,
        difficulty: 1,
        quickMeal: true,
        servingSize: 1,
      },
    },
    success: true,
  },
  {
    userId: 2,
    role: 'assistant',
    message:
      '달걀후라이나 계란말이, 김치볶음밥(밥 있으면) 5분 이내 가능해요. 재료함에 김치·달걀 있으시면 바로 도전해 보세요.',
    sessionId: 'conv_user2_1',
    context: {
      sessionId: 'conv_user2_1',
      conversationId: 'conv_user2_1',
      previousMessageIds: ['msg_conv_user2_1_1'],
      mentionedIngredientIds: [2, 3, 5, 8, 9, 10],
      suggestedRecipeIds: [5, 6],
      userPreferences: {
        maxCookTime: 5,
        quickMeal: true,
      },
    },
    llm: {
      model: 'gpt-4-turbo',
      promptTokens: 88,
      completionTokens: 42,
      totalTokens: 130,
    },
    latency: 710,
    success: true,
  },
  // userId 3, 대화1 (conv_user3_1) — 간장·밥·달걀 언급
  {
    userId: 3,
    role: 'user',
    message: '간장이랑 밥이랑 달걀 있는데 뭐 해먹지?',
    sessionId: 'conv_user3_1',
    context: {
      sessionId: 'conv_user3_1',
      conversationId: 'conv_user3_1',
      mentionedIngredientIds: [1, 5, 6],
      userPreferences: {
        maxCookTime: 15,
        difficulty: 1,
        servingSize: 1,
        preferredIngredients: [1, 5, 6],
      },
    },
    success: true,
  },
  {
    userId: 3,
    role: 'assistant',
    message:
      '간장밥(간장계란밥), 달걀밥, 또는 밥 위에 계란 후라이 올려서 간장 뿌려 먹기 좋아요. 5분이면 충분합니다.',
    sessionId: 'conv_user3_1',
    context: {
      sessionId: 'conv_user3_1',
      conversationId: 'conv_user3_1',
      previousMessageIds: ['msg_conv_user3_1_1'],
      mentionedIngredientIds: [1, 5, 6],
      suggestedRecipeIds: [7, 8],
      userPreferences: {
        maxCookTime: 15,
        preferredIngredients: [1, 5, 6],
      },
    },
    llm: {
      model: 'gpt-4-turbo',
      promptTokens: 102,
      completionTokens: 40,
      totalTokens: 142,
    },
    latency: 780,
    success: true,
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

  console.log('🌱 chatbot_logs 시드 데이터 삽입 시작...');
  await ChatbotLogModel.deleteMany({});
  const inserted = await ChatbotLogModel.insertMany(
    SEED_CHATBOT_LOGS.map((doc) => ({ ...doc })),
  );
  const conversationCount = new Set(
    SEED_CHATBOT_LOGS.map((d) => d.sessionId),
  ).size;
  console.log(
    `  ✓ ${inserted.length}개 메시지, ${conversationCount}개 대화 (userId 1,2,3)`,
  );
  console.log('✅ chatbot_logs 시드 완료');
}

main()
  .catch((e) => {
    console.error('❌ 시드 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
