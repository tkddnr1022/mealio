/* eslint-disable no-console */
import { loadEnvFiles } from '../../config/load-env-files';
import { Client } from 'pg';

loadEnvFiles();

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

/**
 * 프로덕션 초기 배포·recipe ingestion LLM 카테고리 매칭용 마스터.
 * 식품의약품안전처 조리식품 레시피 DB `RCP_PAT2`(요리종류)에 맞춘 10개.
 */
const RECIPE_CATEGORIES: RecipeCategorySeed[] = [
  { id: 1, key: 'SIDE_DISH', name: '반찬', displayOrder: 1 },
  { id: 2, key: 'RICE', name: '밥', displayOrder: 2 },
  { id: 3, key: 'SOUP', name: '국', displayOrder: 3 },
  { id: 4, key: 'STEW', name: '찌개', displayOrder: 4 },
  { id: 5, key: 'NOODLE', name: '면', displayOrder: 5 },
  { id: 6, key: 'MAIN_DISH', name: '일품', displayOrder: 6 },
  { id: 7, key: 'DESSERT', name: '후식', displayOrder: 7 },
  { id: 8, key: 'STEAMED', name: '찜', displayOrder: 8 },
  { id: 9, key: 'BRAISED', name: '조림', displayOrder: 9 },
  { id: 10, key: 'STIRFRY', name: '볶음', displayOrder: 10 },
];

/**
 * recipe ingestion 재료 카테고리 매칭용 마스터 20개.
 */
const INGREDIENT_CATEGORIES: IngredientCategorySeed[] = [
  { id: 1, key: 'VEGETABLE', name: '채소', displayOrder: 1 },
  { id: 2, key: 'FRUIT', name: '과일', displayOrder: 2 },
  { id: 3, key: 'MUSHROOM', name: '버섯', displayOrder: 3 },
  { id: 4, key: 'SEAWEED', name: '해조류', displayOrder: 4 },
  { id: 5, key: 'MEAT', name: '육류', displayOrder: 5 },
  { id: 6, key: 'POULTRY', name: '가금류', displayOrder: 6 },
  { id: 7, key: 'SEAFOOD', name: '수산물', displayOrder: 7 },
  { id: 8, key: 'EGG', name: '알류', displayOrder: 8 },
  { id: 9, key: 'BEAN_TOFU', name: '두류·두부', displayOrder: 9 },
  { id: 10, key: 'GRAIN', name: '곡류', displayOrder: 10 },
  { id: 11, key: 'NOODLE', name: '면류', displayOrder: 11 },
  { id: 12, key: 'DAIRY', name: '유제품', displayOrder: 12 },
  { id: 13, key: 'SEASONING', name: '조미료', displayOrder: 13 },
  { id: 14, key: 'SAUCE_PASTE', name: '장·소스', displayOrder: 14 },
  { id: 15, key: 'OIL_FAT', name: '유지', displayOrder: 15 },
  { id: 16, key: 'SPICE_HERB', name: '향신료·허브', displayOrder: 16 },
  { id: 17, key: 'NUT_SEED', name: '견과·씨', displayOrder: 17 },
  { id: 18, key: 'DRIED', name: '건어물·말린재료', displayOrder: 18 },
  { id: 19, key: 'PROCESSED', name: '가공식품', displayOrder: 19 },
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

    await client.query('COMMIT');
    console.log(
      `✅ Prisma seed completed (${RECIPE_CATEGORIES.length} recipe categories, ${INGREDIENT_CATEGORIES.length} ingredient categories)`,
    );
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
