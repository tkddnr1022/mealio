import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { RecipeSummary } from '@/lib/types/recipe';

import { RecipeGridCard } from '@/components/recipe';

/** Figma 그리드 열 폭에 가깝게 두기 (~170px) */
const gridColumn: Decorator = (Story) => (
  <div className="w-[170px]">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Cards/RecipeGridCard',
  component: RecipeGridCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [gridColumn],
} satisfies Meta<typeof RecipeGridCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleImage =
  'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop';
const baseRecipe: RecipeSummary = {
  id: 1,
  title: '치킨 카레',
  description: null,
  difficulty: 2,
  cookTime: 45,
  imageUrl: sampleImage,
  servings: 4,
  viewCount: 30,
  likeCount: 12,
  isPublished: true,
  createdAt: new Date().toISOString(),
};

export const Default = {
  name: '기본',
  args: {
    recipe: baseRecipe,
  },
} satisfies Story;

export const LongTitle = {
  name: '긴 제목',
  args: {
    recipe: {
      ...baseRecipe,
      title:
        '한 입에 녹아드는 부드러운 닭고기와 향신료가 어우러진 정통 스타일 치킨 카레',
    },
  },
} satisfies Story;

export const MetaPartial = {
  name: '메타 일부만',
  args: {
    recipe: {
      ...baseRecipe,
      title: '토마토 파스타',
      cookTime: 20,
    },
  },
} satisfies Story;

export const TitleOnly = {
  name: '제목만',
  args: {
    recipe: {
      ...baseRecipe,
      title: '간단 샐러드',
    },
  },
} satisfies Story;
