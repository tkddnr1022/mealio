/* eslint-disable no-console */
import 'dotenv/config';
import { Client } from 'pg';

type RecipeCategorySeed = {
  id: number;
  key: string;
  name: string;
  displayOrder: number;
};

type IngredientCategorySeed = {
  id: number;
  key: string;
  name: string;
  displayOrder: number;
};

type IngredientSeed = {
  id: number;
  name: string;
  categoryId: number;
};

type UserSeed = {
  email: string;
  nickname: string;
  platformName: string;
  platformId: string;
};

type RecipeInstructionStep = {
  step: number;
  content: string;
};

type RecipeSeed = {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  difficulty: number;
  cookTime: number;
  servings: number;
  instructions: RecipeInstructionStep[];
};

type RecipeIngredientSeed = [
  recipeId: number,
  ingredientId: number,
  amount: number | null,
  unit: string | null,
  isOptional: boolean,
];

const RECIPE_CATEGORIES: RecipeCategorySeed[] = [
  { id: 1, key: 'KOREAN', name: '한식', displayOrder: 1 },
  { id: 2, key: 'WESTERN', name: '양식', displayOrder: 2 },
  { id: 3, key: 'JAPANESE', name: '일식', displayOrder: 3 },
  { id: 4, key: 'CHINESE', name: '중식', displayOrder: 4 },
  { id: 5, key: 'ASIAN', name: '아시안', displayOrder: 5 },
  { id: 6, key: 'SNACK', name: '간식', displayOrder: 6 },
];

const INGREDIENT_CATEGORIES: IngredientCategorySeed[] = [
  { id: 1, key: 'VEGETABLE', name: '채소', displayOrder: 1 },
  { id: 2, key: 'MEAT', name: '육류', displayOrder: 2 },
  { id: 3, key: 'SEASONING', name: '양념', displayOrder: 3 },
  { id: 4, key: 'GRAIN', name: '곡류', displayOrder: 4 },
  { id: 5, key: 'DAIRY', name: '유제품', displayOrder: 5 },
];

const INGREDIENTS: IngredientSeed[] = [
  { id: 1, name: '밥', categoryId: 4 },
  { id: 2, name: '김치', categoryId: 1 },
  { id: 3, name: '양파', categoryId: 1 },
  { id: 4, name: '대파', categoryId: 1 },
  { id: 5, name: '달걀', categoryId: 5 },
  { id: 6, name: '간장', categoryId: 3 },
  { id: 7, name: '참기름', categoryId: 3 },
  { id: 8, name: '설탕', categoryId: 3 },
  { id: 9, name: '마늘', categoryId: 1 },
  { id: 10, name: '돼지고기', categoryId: 2 },
  { id: 11, name: '두부', categoryId: 1 },
  { id: 12, name: '고춧가루', categoryId: 3 },
  { id: 13, name: '물', categoryId: 3 },
  { id: 14, name: '소금', categoryId: 3 },
  { id: 15, name: '후추', categoryId: 3 },
  { id: 16, name: '당근', categoryId: 1 },
  { id: 17, name: '감자', categoryId: 1 },
  { id: 18, name: '버터', categoryId: 5 },
  { id: 19, name: '우유', categoryId: 5 },
  { id: 20, name: '스파게티면', categoryId: 4 },
  { id: 21, name: '토마토소스', categoryId: 3 },
  { id: 22, name: '베이컨', categoryId: 2 },
  { id: 23, name: '치즈', categoryId: 5 },
  { id: 24, name: '새우', categoryId: 2 },
  { id: 25, name: '브로콜리', categoryId: 1 },
  { id: 26, name: '올리브유', categoryId: 3 },
];

const USERS: UserSeed[] = [
  {
    email: 'dev1@example.com',
    nickname: '요리사김',
    platformName: 'google',
    platformId: 'google_dev_001',
  },
  {
    email: 'dev2@example.com',
    nickname: '맛탐험가',
    platformName: 'google',
    platformId: 'google_dev_002',
  },
  {
    email: 'test@kakao.example.com',
    nickname: '레시피러버',
    platformName: 'kakao',
    platformId: 'kakao_test_001',
  },
  {
    email: 'e2e@example.com',
    nickname: 'E2E테스터',
    platformName: 'google',
    platformId: 'google_e2e_001',
  },
];

const RECIPES: RecipeSeed[] = [
  {
    id: 1,
    categoryId: 1,
    title: '김치볶음밥',
    description: '남은 김치로 만드는 간단한 볶음밥',
    difficulty: 1,
    cookTime: 15,
    servings: 1,
    instructions: [
      { step: 1, content: '김치는 적당히 잘라 준비한다.' },
      { step: 2, content: '팬에 기름을 두르고 김치를 넣어 중불로 2분 볶는다.' },
      { step: 3, content: '밥을 넣고 간장, 참기름으로 간한 뒤 잘 섞어 볶는다.' },
      { step: 4, content: '달걀을 프라이해 올리거나 그대로 섞어 완성한다.' },
    ],
  },
  {
    id: 2,
    categoryId: 1,
    title: '김치찌개',
    description: '든든한 한 그릇 김치찌개',
    difficulty: 2,
    cookTime: 30,
    servings: 2,
    instructions: [
      { step: 1, content: '김치는 먹기 좋게 썰고, 두부는 한입 크기로 자른다.' },
      { step: 2, content: '냄비에 김치, 돼지고기, 고춧가루, 마늘을 넣고 볶는다.' },
      { step: 3, content: '물을 붓고 끓인 뒤 두부, 대파를 넣고 간장으로 간한다.' },
    ],
  },
  {
    id: 3,
    categoryId: 1,
    title: '계란말이',
    description: '부드러운 한식 계란말이',
    difficulty: 1,
    cookTime: 10,
    servings: 1,
    instructions: [
      { step: 1, content: '달걀에 소금, 물 한 스푼을 넣고 풀어둔다.' },
      {
        step: 2,
        content:
          '달군 팬에 기름을 두르고 달걀물을 얇게 부어 굳기 전에 말아 올린다.',
      },
      { step: 3, content: '남은 달걀물을 붓고 반복해 말아 완성한다.' },
    ],
  },
  {
    id: 4,
    categoryId: 1,
    title: '감자볶음',
    description: '간단한 반찬 감자볶음',
    difficulty: 1,
    cookTime: 20,
    servings: 2,
    instructions: [
      { step: 1, content: '감자는 껍질을 벗기고 채썬다. 물에 한 번 헹군다.' },
      { step: 2, content: '팬에 기름을 두르고 감자를 넣어 중불로 볶는다.' },
      {
        step: 3,
        content: '간장, 설탕, 물을 넣고 뚜껑을 덮어 익힌 뒤 참기름으로 마무리한다.',
      },
    ],
  },
  {
    id: 5,
    categoryId: 2,
    title: '스크램블 에그',
    description: '버터향 가득 부드러운 스크램블 에그',
    difficulty: 1,
    cookTime: 5,
    servings: 1,
    instructions: [
      { step: 1, content: '달걀에 소금, 후추, 우유 1큰술을 넣고 풀어둔다.' },
      {
        step: 2,
        content: '팬에 버터를 녹이고 달걀을 넣어 약한 불에서 저어가며 익힌다.',
      },
    ],
  },
  {
    id: 6,
    categoryId: 1,
    title: '베이컨 달걀밥',
    description: '아침에 든든한 베이컨과 달걀 밥',
    difficulty: 1,
    cookTime: 15,
    servings: 1,
    instructions: [
      {
        step: 1,
        content: '베이컨을 먹기 좋은 크기로 잘라 팬에 노릇하게 굽는다.',
      },
      { step: 2, content: '달걀을 프라이하거나 스크램블한다.' },
      {
        step: 3,
        content: '밥 위에 베이컨, 달걀을 올리고 간장, 참기름을 뿌린다.',
      },
    ],
  },
  {
    id: 7,
    categoryId: 2,
    title: '토마토 스파게티',
    description: '간단한 토마토 소스 스파게티',
    difficulty: 2,
    cookTime: 25,
    servings: 2,
    instructions: [
      { step: 1, content: '끓는 물에 소금을 넣고 스파게티면을 8~10분 삶는다.' },
      {
        step: 2,
        content: '팬에 마늘, 양파를 넣어 볶다가 토마토소스를 넣고 5분 끓인다.',
      },
      { step: 3, content: '삶은 면을 넣고 소스와 잘 섞어 완성한다.' },
    ],
  },
  {
    id: 8,
    categoryId: 1,
    title: '두부김치',
    description: '구운 두부와 김치를 곁들인 요리',
    difficulty: 1,
    cookTime: 15,
    servings: 1,
    instructions: [
      {
        step: 1,
        content: '두부는 0.5cm 두께로 썰어 키친타올로 물기를 제거한다.',
      },
      { step: 2, content: '팬에 기름을 두르고 두부를 노릇하게 굽는다.' },
      { step: 3, content: '김치와 함께 담고 참기름을 뿌린다.' },
    ],
  },
  {
    id: 9,
    categoryId: 5,
    title: '새우버터갈릭',
    description: '마늘향 새우 요리',
    difficulty: 2,
    cookTime: 20,
    servings: 2,
    instructions: [
      { step: 1, content: '새우는 등쪽 내장을 제거하고 마늘은 다진다.' },
      {
        step: 2,
        content: '팬에 버터를 녹이고 마늘을 넣어 향이 나면 새우를 넣어 볶는다.',
      },
      {
        step: 3,
        content: '소금, 후추로 간하고 파슬리나 대파를 뿌려 완성한다.',
      },
    ],
  },
  {
    id: 10,
    categoryId: 2,
    title: '브로콜리 치즈 수프',
    description: '크리미한 브로콜리 수프',
    difficulty: 2,
    cookTime: 25,
    servings: 2,
    instructions: [
      {
        step: 1,
        content: '브로콜리는 작은 송이로 나누고 당근은 작게 썬다.',
      },
      {
        step: 2,
        content: '냄비에 버터를 녹이고 브로콜리, 당근을 넣어 살짝 볶는다.',
      },
      {
        step: 3,
        content:
          '물, 우유를 넣고 끓인 뒤 믹서로 갈아 치즈를 넣어 녹인다. 소금, 후추로 간한다.',
      },
    ],
  },
];

const RECIPE_INGREDIENTS: RecipeIngredientSeed[] = [
  [1, 1, 1, '공기', false],
  [1, 2, 100, 'g', false],
  [1, 6, 1, '큰술', false],
  [1, 7, 0.5, '큰술', false],
  [1, 5, 1, '개', true],
  [2, 2, 200, 'g', false],
  [2, 10, 100, 'g', false],
  [2, 11, 0.5, '모', false],
  [2, 4, 0.5, '대', false],
  [2, 12, 1, '큰술', false],
  [2, 9, 1, '작은술', false],
  [2, 6, 1, '큰술', false],
  [2, 13, 2, '컵', false],
  [3, 5, 3, '개', false],
  [3, 14, null, null, false],
  [3, 13, 1, '큰술', false],
  [4, 17, 2, '개', false],
  [4, 6, 1, '큰술', false],
  [4, 8, 0.5, '큰술', false],
  [4, 7, 0.5, '큰술', false],
  [4, 13, 2, '큰술', false],
  [5, 5, 2, '개', false],
  [5, 18, 10, 'g', false],
  [5, 19, 1, '큰술', false],
  [5, 14, null, null, false],
  [5, 15, null, null, false],
  [6, 1, 1, '공기', false],
  [6, 22, 2, '줄', false],
  [6, 5, 1, '개', false],
  [6, 6, 0.5, '큰술', false],
  [6, 7, 0.5, '큰술', false],
  [7, 20, 200, 'g', false],
  [7, 21, 200, 'g', false],
  [7, 3, 0.5, '개', false],
  [7, 9, 2, '쪽', false],
  [7, 14, null, null, false],
  [7, 26, null, null, true],
  [8, 11, 1, '모', false],
  [8, 2, 80, 'g', false],
  [8, 7, 0.5, '큰술', false],
  [9, 24, 200, 'g', false],
  [9, 18, 20, 'g', false],
  [9, 9, 4, '쪽', false],
  [9, 14, null, null, false],
  [9, 15, null, null, false],
  [10, 25, 1, '줄기', false],
  [10, 16, 0.25, '개', false],
  [10, 19, 200, 'ml', false],
  [10, 23, 50, 'g', false],
  [10, 18, 15, 'g', false],
  [10, 13, 100, 'ml', false],
  [10, 14, null, null, false],
  [10, 15, null, null, false],
];

async function seed(): Promise<void> {
  const url = process.env.POSTGRESQL_URL;
  if (!url) {
    throw new Error('POSTGRESQL_URL is required');
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query('BEGIN');

    for (const user of USERS) {
      await client.query(
        `INSERT INTO "User" ("email","nickname","platform_name","platform_id")
         VALUES ($1,$2,$3,$4)
         ON CONFLICT ("email") DO NOTHING`,
        [user.email, user.nickname, user.platformName, user.platformId],
      );
    }

    for (const c of RECIPE_CATEGORIES) {
      await client.query(
        `INSERT INTO "RecipeCategory" ("id","key","name","display_order","is_active","updated_at")
         VALUES ($1,$2,$3,$4,true,CURRENT_TIMESTAMP)
         ON CONFLICT ("id") DO UPDATE
         SET "key"=EXCLUDED."key","name"=EXCLUDED."name","display_order"=EXCLUDED."display_order","is_active"=EXCLUDED."is_active","updated_at"=EXCLUDED."updated_at"`,
        [c.id, c.key, c.name, c.displayOrder],
      );
    }

    for (const c of INGREDIENT_CATEGORIES) {
      await client.query(
        `INSERT INTO "IngredientCategory" ("id","key","name","display_order","is_active","updated_at")
         VALUES ($1,$2,$3,$4,true,CURRENT_TIMESTAMP)
         ON CONFLICT ("id") DO UPDATE
         SET "key"=EXCLUDED."key","name"=EXCLUDED."name","display_order"=EXCLUDED."display_order","is_active"=EXCLUDED."is_active","updated_at"=EXCLUDED."updated_at"`,
        [c.id, c.key, c.name, c.displayOrder],
      );
    }

    for (const ingredient of INGREDIENTS) {
      await client.query(
        `INSERT INTO "Ingredient" ("id","name","categoryId")
         VALUES ($1,$2,$3)
         ON CONFLICT ("id") DO UPDATE
         SET "name"=EXCLUDED."name","categoryId"=EXCLUDED."categoryId"`,
        [ingredient.id, ingredient.name, ingredient.categoryId],
      );
    }

    for (const recipe of RECIPES) {
      await client.query(
        `INSERT INTO "Recipe" ("id","categoryId","title","description","difficulty","cook_time","servings","instructions")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
         ON CONFLICT ("id") DO NOTHING`,
        [
          recipe.id,
          recipe.categoryId,
          recipe.title,
          recipe.description,
          recipe.difficulty,
          recipe.cookTime,
          recipe.servings,
          JSON.stringify(recipe.instructions),
        ],
      );
    }

    // 모든 레시피가 반드시 RecipeStats를 가지도록 보장한다.
    for (const recipe of RECIPES) {
      await client.query(
        `INSERT INTO "RecipeStats" ("recipe_id","view_count","like_count","updated_at")
         VALUES ($1,0,0,CURRENT_TIMESTAMP)
         ON CONFLICT ("recipe_id") DO NOTHING`,
        [recipe.id],
      );
    }

    for (const [recipeId, ingredientId, amount, unit, isOptional] of RECIPE_INGREDIENTS) {
      await client.query(
        `INSERT INTO "RecipeIngredient" ("recipe_id","ingredient_id","amount","unit","is_optional")
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT ("recipe_id","ingredient_id") DO NOTHING`,
        [recipeId, ingredientId, amount, unit, isOptional],
      );
    }

    await client.query(
      `SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX("id") FROM "User"), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('"Ingredient"', 'id'), COALESCE((SELECT MAX("id") FROM "Ingredient"), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('"Recipe"', 'id'), COALESCE((SELECT MAX("id") FROM "Recipe"), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('"RecipeIngredient"', 'id'), COALESCE((SELECT MAX("id") FROM "RecipeIngredient"), 1), true)`,
    );

    await client.query('COMMIT');
    console.log('✅ Prisma seed completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Prisma seed failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch((error) => {
  console.error('❌ Prisma seed failed (top-level):', error);
  process.exit(1);
});

