import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { RecipeSummary } from '@/lib/types/recipe';

import { RecipeGrid } from '@/components/recipe';

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

const fourSameAsFigma: readonly RecipeSummary[] = [
  {
    id: 1,
    title: '치킨 카레',
    description: null,
    difficulty: 2,
    cookTime: 45,
    imageUrl: curry,
    servings: 4,
    viewCount: 10,
    likeCount: 4,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: '치킨 카레',
    description: null,
    difficulty: 2,
    cookTime: 45,
    imageUrl: curry,
    servings: 4,
    viewCount: 10,
    likeCount: 4,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: '치킨 카레',
    description: null,
    difficulty: 2,
    cookTime: 45,
    imageUrl: curry,
    servings: 4,
    viewCount: 10,
    likeCount: 4,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    title: '치킨 카레',
    description: null,
    difficulty: 2,
    cookTime: 45,
    imageUrl: curry,
    servings: 4,
    viewCount: 10,
    likeCount: 4,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
];

export const Default = {
  name: '기본 (Figma 2×2)',
  args: {
    recipes: fourSameAsFigma,
  },
} satisfies Story;

const variedRecipes: readonly RecipeSummary[] = [
  {
    id: 11,
    title: '치킨 카레',
    description: null,
    difficulty: 2,
    cookTime: 45,
    imageUrl: curry,
    servings: 4,
    viewCount: 50,
    likeCount: 8,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 12,
    title: '토마토 파스타',
    description: null,
    difficulty: 3,
    cookTime: 30,
    imageUrl: pasta,
    servings: 2,
    viewCount: 35,
    likeCount: 9,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 13,
    title: '채소 샐러드',
    description: null,
    difficulty: 1,
    cookTime: 15,
    imageUrl: salad,
    servings: 2,
    viewCount: 20,
    likeCount: 3,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 14,
    title: '버섯 스프',
    description: null,
    difficulty: 3,
    cookTime: 40,
    imageUrl: soup,
    servings: 3,
    viewCount: 40,
    likeCount: 11,
    isPublished: true,
    createdAt: new Date().toISOString(),
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

export const TwoByOne = {
  name: '2×1 (2열 1행)',
  args: {
    recipes: variedRecipes.slice(0, 2),
    layout: { columns: 2, rows: 1 },
  },
} satisfies Story;

export const OneByTwo = {
  name: '1×2 (1열 2행)',
  args: {
    recipes: variedRecipes.slice(0, 2),
    layout: { columns: 1, rows: 2 },
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
