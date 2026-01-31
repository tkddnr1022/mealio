/**
 * 개발용 시드 데이터 (유저 4명 + 재료 + 레시피 10개)
 * 실행: npm run prisma:seed
 */
import 'dotenv/config';
import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.POSTGRESQL_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const INGREDIENT_CATEGORY = {
  VEGETABLE: 1,
  MEAT: 2,
  SEASONING: 3,
  GRAIN: 4,
  DAIRY: 5,
} as const;

async function main() {
  console.log('🌱 시드 데이터 삽입 시작...');

  // 0. 유저 생성 (개발/테스트용)
  const users = [
    { email: 'dev1@example.com', nickname: '요리사김', platformName: 'google', platformId: 'google_dev_001' },
    { email: 'dev2@example.com', nickname: '맛탐험가', platformName: 'google', platformId: 'google_dev_002' },
    { email: 'test@kakao.example.com', nickname: '레시피러버', platformName: 'kakao', platformId: 'kakao_test_001' },
    { email: 'e2e@example.com', nickname: 'E2E테스터', platformName: 'google', platformId: 'google_e2e_001' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      create: u,
      update: {},
    });
  }
  console.log(`  ✓ 유저 ${users.length}명 생성/확인`);

  // 1. 재료 생성 (레시피에서 공통 사용)
  const ingredientNames: { name: string; category: number }[] = [
    { name: '밥', category: INGREDIENT_CATEGORY.GRAIN },
    { name: '김치', category: INGREDIENT_CATEGORY.VEGETABLE },
    { name: '양파', category: INGREDIENT_CATEGORY.VEGETABLE },
    { name: '대파', category: INGREDIENT_CATEGORY.VEGETABLE },
    { name: '달걀', category: INGREDIENT_CATEGORY.DAIRY },
    { name: '간장', category: INGREDIENT_CATEGORY.SEASONING },
    { name: '참기름', category: INGREDIENT_CATEGORY.SEASONING },
    { name: '설탕', category: INGREDIENT_CATEGORY.SEASONING },
    { name: '마늘', category: INGREDIENT_CATEGORY.VEGETABLE },
    { name: '돼지고기', category: INGREDIENT_CATEGORY.MEAT },
    { name: '두부', category: INGREDIENT_CATEGORY.VEGETABLE },
    { name: '고춧가루', category: INGREDIENT_CATEGORY.SEASONING },
    { name: '물', category: INGREDIENT_CATEGORY.SEASONING },
    { name: '소금', category: INGREDIENT_CATEGORY.SEASONING },
    { name: '후추', category: INGREDIENT_CATEGORY.SEASONING },
    { name: '당근', category: INGREDIENT_CATEGORY.VEGETABLE },
    { name: '감자', category: INGREDIENT_CATEGORY.VEGETABLE },
    { name: '버터', category: INGREDIENT_CATEGORY.DAIRY },
    { name: '우유', category: INGREDIENT_CATEGORY.DAIRY },
    { name: '스파게티면', category: INGREDIENT_CATEGORY.GRAIN },
    { name: '토마토소스', category: INGREDIENT_CATEGORY.SEASONING },
    { name: '베이컨', category: INGREDIENT_CATEGORY.MEAT },
    { name: '치즈', category: INGREDIENT_CATEGORY.DAIRY },
    { name: '새우', category: INGREDIENT_CATEGORY.MEAT },
    { name: '브로콜리', category: INGREDIENT_CATEGORY.VEGETABLE },
    { name: '올리브유', category: INGREDIENT_CATEGORY.SEASONING },
  ];

  const createdIngredients: Record<string, number> = {};
  for (const { name, category } of ingredientNames) {
    let ing = await prisma.ingredient.findFirst({ where: { name } });
    if (!ing) {
      ing = await prisma.ingredient.create({ data: { name, category } });
    }
    createdIngredients[name] = ing.id;
  }
  console.log(`  ✓ 재료 ${Object.keys(createdIngredients).length}개 생성/확인`);

  const id = (name: string) => createdIngredients[name];
  const ri = (
    ingredientName: string,
    amount: number | null,
    unit: string | null,
    isOptional = false,
  ) => ({
    ingredientId: id(ingredientName),
    amount: amount != null ? amount : null,
    unit,
    isOptional,
  });

  // 2. 레시피 10개 생성
  const recipes = [
    {
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
      ingredients: [
        ri('밥', 1, '공기', false),
        ri('김치', 100, 'g', false),
        ri('간장', 1, '큰술', false),
        ri('참기름', 0.5, '큰술', false),
        ri('달걀', 1, '개', true),
      ],
    },
    {
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
      ingredients: [
        ri('김치', 200, 'g', false),
        ri('돼지고기', 100, 'g', false),
        ri('두부', 0.5, '모', false),
        ri('대파', 0.5, '대', false),
        ri('고춧가루', 1, '큰술', false),
        ri('마늘', 1, '작은술', false),
        ri('간장', 1, '큰술', false),
        ri('물', 2, '컵', false),
      ],
    },
    {
      title: '계란말이',
      description: '부드러운 한식 계란말이',
      difficulty: 1,
      cookTime: 10,
      servings: 1,
      instructions: [
        { step: 1, content: '달걀에 소금, 물 한 스푼을 넣고 풀어둔다.' },
        { step: 2, content: '달군 팬에 기름을 두르고 달걀물을 얇게 부어 굳기 전에 말아 올린다.' },
        { step: 3, content: '남은 달걀물을 붓고 반복해 말아 완성한다.' },
      ],
      ingredients: [
        ri('달걀', 3, '개', false),
        ri('소금', null, null, false),
        ri('물', 1, '큰술', false),
      ],
    },
    {
      title: '감자볶음',
      description: '간단한 반찬 감자볶음',
      difficulty: 1,
      cookTime: 20,
      servings: 2,
      instructions: [
        { step: 1, content: '감자는 껍질을 벗기고 채썬다. 물에 한 번 헹군다.' },
        { step: 2, content: '팬에 기름을 두르고 감자를 넣어 중불로 볶는다.' },
        { step: 3, content: '간장, 설탕, 물을 넣고 뚜껑을 덮어 익힌 뒤 참기름으로 마무리한다.' },
      ],
      ingredients: [
        ri('감자', 2, '개', false),
        ri('간장', 1, '큰술', false),
        ri('설탕', 0.5, '큰술', false),
        ri('참기름', 0.5, '큰술', false),
        ri('물', 2, '큰술', false),
      ],
    },
    {
      title: '스크램블 에그',
      description: '버터향 가득 부드러운 스크램블 에그',
      difficulty: 1,
      cookTime: 5,
      servings: 1,
      instructions: [
        { step: 1, content: '달걀에 소금, 후추, 우유 1큰술을 넣고 풀어둔다.' },
        { step: 2, content: '팬에 버터를 녹이고 달걀을 넣어 약한 불에서 저어가며 익힌다.' },
      ],
      ingredients: [
        ri('달걀', 2, '개', false),
        ri('버터', 10, 'g', false),
        ri('우유', 1, '큰술', false),
        ri('소금', null, null, false),
        ri('후추', null, null, false),
      ],
    },
    {
      title: '베이컨 달걀밥',
      description: '아침에 든든한 베이컨과 달걀 밥',
      difficulty: 1,
      cookTime: 15,
      servings: 1,
      instructions: [
        { step: 1, content: '베이컨을 먹기 좋은 크기로 잘라 팬에 노릇하게 굽는다.' },
        { step: 2, content: '달걀을 프라이하거나 스크램블한다.' },
        { step: 3, content: '밥 위에 베이컨, 달걀을 올리고 간장, 참기름을 뿌린다.' },
      ],
      ingredients: [
        ri('밥', 1, '공기', false),
        ri('베이컨', 2, '줄', false),
        ri('달걀', 1, '개', false),
        ri('간장', 0.5, '큰술', false),
        ri('참기름', 0.5, '큰술', false),
      ],
    },
    {
      title: '토마토 스파게티',
      description: '간단한 토마토 소스 스파게티',
      difficulty: 2,
      cookTime: 25,
      servings: 2,
      instructions: [
        { step: 1, content: '끓는 물에 소금을 넣고 스파게티면을 8~10분 삶는다.' },
        { step: 2, content: '팬에 마늘, 양파를 넣어 볶다가 토마토소스를 넣고 5분 끓인다.' },
        { step: 3, content: '삶은 면을 넣고 소스와 잘 섞어 완성한다.' },
      ],
      ingredients: [
        ri('스파게티면', 200, 'g', false),
        ri('토마토소스', 200, 'g', false),
        ri('양파', 0.5, '개', false),
        ri('마늘', 2, '쪽', false),
        ri('소금', null, null, false),
        ri('올리브유', null, null, true),
      ],
    },
    {
      title: '두부김치',
      description: '구운 두부와 김치를 곁들인 요리',
      difficulty: 1,
      cookTime: 15,
      servings: 1,
      instructions: [
        { step: 1, content: '두부는 0.5cm 두께로 썰어 키친타올로 물기를 제거한다.' },
        { step: 2, content: '팬에 기름을 두르고 두부를 노릇하게 굽는다.' },
        { step: 3, content: '김치와 함께 담고 참기름을 뿌린다.' },
      ],
      ingredients: [
        ri('두부', 1, '모', false),
        ri('김치', 80, 'g', false),
        ri('참기름', 0.5, '큰술', false),
      ],
    },
    {
      title: '새우버터갈릭',
      description: '마늘향 새우 요리',
      difficulty: 2,
      cookTime: 20,
      servings: 2,
      instructions: [
        { step: 1, content: '새우는 등쪽 내장을 제거하고 마늘은 다진다.' },
        { step: 2, content: '팬에 버터를 녹이고 마늘을 넣어 향이 나면 새우를 넣어 볶는다.' },
        { step: 3, content: '소금, 후추로 간하고 파슬리나 대파를 뿌려 완성한다.' },
      ],
      ingredients: [
        ri('새우', 200, 'g', false),
        ri('버터', 20, 'g', false),
        ri('마늘', 4, '쪽', false),
        ri('소금', null, null, false),
        ri('후추', null, null, false),
      ],
    },
    {
      title: '브로콜리 치즈 수프',
      description: '크리미한 브로콜리 수프',
      difficulty: 2,
      cookTime: 25,
      servings: 2,
      instructions: [
        { step: 1, content: '브로콜리는 작은 송이로 나누고 당근은 작게 썬다.' },
        { step: 2, content: '냄비에 버터를 녹이고 브로콜리, 당근을 넣어 살짝 볶는다.' },
        { step: 3, content: '물, 우유를 넣고 끓인 뒤 믹서로 갈아 치즈를 넣어 녹인다. 소금, 후추로 간한다.' },
      ],
      ingredients: [
        ri('브로콜리', 1, '줄기', false),
        ri('당근', 0.25, '개', false),
        ri('우유', 200, 'ml', false),
        ri('치즈', 50, 'g', false),
        ri('버터', 15, 'g', false),
        ri('물', 100, 'ml', false),
        ri('소금', null, null, false),
        ri('후추', null, null, false),
      ],
    },
  ];

  for (const r of recipes) {
    const recipe = await prisma.recipe.create({
      data: {
        title: r.title,
        description: r.description,
        difficulty: r.difficulty,
        cookTime: r.cookTime,
        servings: r.servings,
        instructions: r.instructions as object,
        recipeIngredients: {
          create: r.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            amount: ing.amount,
            unit: ing.unit,
            isOptional: ing.isOptional,
          })),
        },
      },
    });
    console.log(`  ✓ 레시피: ${recipe.title} (id: ${recipe.id})`);
  }

  console.log('✅ 시드 데이터 삽입 완료 (유저 4명, 레시피 10개)');
}

main()
  .catch((e) => {
    console.error('❌ 시드 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
