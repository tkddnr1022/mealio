import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';

import { type RecipeGridItem, RecipeGrid } from '@/components/recipe';

/** Figma 2×2 프레임에 가깝게: 카드 ~170px × 2 + 가로 갭 16px */
const figmaWidth: Decorator = (Story) => (
  <div className="w-[355px] max-w-full px-2">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Lists/RecipeGrid',
  component: RecipeGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof RecipeGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

const curry =
  'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop';
const pasta =
  'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop';
const salad =
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop';
const soup =
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop';

const fourSameAsFigma: readonly RecipeGridItem[] = [
  {
    recipeId: 'r1',
    imageUrl: curry,
    title: '치킨 카레',
    cookingTime: '45분',
    difficulty: '쉬움',
    servings: '4인분',
    category: '아시안',
  },
  {
    recipeId: 'r2',
    imageUrl: curry,
    title: '치킨 카레',
    cookingTime: '45분',
    difficulty: '쉬움',
    servings: '4인분',
    category: '아시안',
  },
  {
    recipeId: 'r3',
    imageUrl: curry,
    title: '치킨 카레',
    cookingTime: '45분',
    difficulty: '쉬움',
    servings: '4인분',
    category: '아시안',
  },
  {
    recipeId: 'r4',
    imageUrl: curry,
    title: '치킨 카레',
    cookingTime: '45분',
    difficulty: '쉬움',
    servings: '4인분',
    category: '아시안',
  },
];

export const Default = {
  name: '기본 (Figma 2×2)',
  args: {
    recipes: fourSameAsFigma,
  },
} satisfies Story;

const variedRecipes: readonly RecipeGridItem[] = [
  {
    recipeId: 'a',
    imageUrl: curry,
    title: '치킨 카레',
    cookingTime: '45분',
    difficulty: '쉬움',
    servings: '4인분',
    category: '아시안',
  },
  {
    recipeId: 'b',
    imageUrl: pasta,
    title: '토마토 파스타',
    cookingTime: '30분',
    difficulty: '보통',
    servings: '2인분',
    category: '이탈리안',
  },
  {
    recipeId: 'c',
    imageUrl: salad,
    title: '채소 샐러드',
    cookingTime: '15분',
    difficulty: '쉬움',
    servings: '2인분',
  },
  {
    recipeId: 'd',
    imageUrl: soup,
    title: '버섯 스프',
    cookingTime: '40분',
    difficulty: '보통',
    servings: '3인분',
    category: '양식',
  },
];

export const VariedRecipes = {
  name: '서로 다른 레시피',
  args: {
    recipes: variedRecipes,
  },
} satisfies Story;

export const ThreeItems = {
  name: '홀수 개(3개)',
  args: {
    recipes: variedRecipes.slice(0, 3),
  },
} satisfies Story;

export const Empty = {
  name: '빈 목록',
  args: {
    recipes: [],
  },
} satisfies Story;

export const FluidContainer = {
  name: '넓은 컨테이너',
  decorators: [
    ((Story) => (
      <div className="w-full max-w-md px-4">
        <Story />
      </div>
    )) satisfies Decorator,
  ],
  args: {
    recipes: fourSameAsFigma,
  },
} satisfies Story;
