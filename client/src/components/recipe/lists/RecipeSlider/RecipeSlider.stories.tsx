import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';

import { type RecipeGridItem, RecipeSlider } from '@/components/recipe';

const centered: Decorator = (Story) => (
  <div className="flex w-full justify-center py-6">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Lists/RecipeSlider',
  component: RecipeSlider,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [centered],
  argTypes: {
    peekPx: {
      control: { type: 'number', min: 0, max: 80, step: 4 },
      description:
        '고정 peek(px). 슬라이드 너비 = 컨테이너 − 좌 오프셋(16) − 간격(16) − peek',
    },
  },
} satisfies Meta<typeof RecipeSlider>;

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

function makeRecipes(count: number): RecipeGridItem[] {
  const titles = [
    '치킨 카레',
    '토마토 파스타',
    '채소 샐러드',
    '버섯 스프',
    '된장찌개',
    '김치볶음밥',
    '연어 포케',
    '비프 스테이크',
    '에그 인 헬',
    '리조또',
    '라자냐',
    '팬케이크',
  ];
  const images = [curry, pasta, salad, soup];
  return Array.from({ length: count }, (_, i) => ({
    recipeId: `recipe-${i + 1}`,
    imageUrl: images[i % images.length] ?? curry,
    title: titles[i % titles.length] ?? `레시피 ${i + 1}`,
    cookingTime: `${20 + (i % 5) * 5}분`,
    difficulty: i % 3 === 0 ? '쉬움' : i % 3 === 1 ? '보통' : '어려움',
    servings: `${2 + (i % 3)}인분`,
    category: i % 2 === 0 ? '아시안' : '양식',
  }));
}

export const Default = {
  name: '기본 (3페이지)',
  args: {
    recipes: makeRecipes(12),
  },
} satisfies Story;

export const TwoPages = {
  name: '2페이지',
  args: {
    recipes: makeRecipes(8),
  },
} satisfies Story;

export const SinglePage = {
  name: '1페이지만',
  args: {
    recipes: makeRecipes(4),
  },
} satisfies Story;

export const WiderPeek = {
  name: 'peek 넓게 (48px)',
  args: {
    recipes: makeRecipes(12),
    peekPx: 48,
  },
} satisfies Story;
