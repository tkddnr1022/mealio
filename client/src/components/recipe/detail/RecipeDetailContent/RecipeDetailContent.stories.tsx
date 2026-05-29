import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { Clock3, Flame, UsersRound } from 'lucide-react';
import { formatCookingTime } from '@/lib/utils/date';
import { RecipeDetailContent } from '@/components/recipe';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)] bg-background-primary">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Detail/RecipeDetailContent',
  component: RecipeDetailContent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    headerProps: {
      title: '비빔밥',
      description:
        '한국의 대표적인 건강식으로, 다양한 나물과 고기, 계란을 넣어 비벼 먹는 전통 요리입니다.',
    },
    hashTags: [
      { label: '한식', href: '/recipe/search?categoryId=1' },
      { label: '볶기', href: '/recipe/search?cookingMethod=%EB%B3%B6%EA%B8%B0' },
      { label: '밥', href: '/recipe/search?dishType=%EB%B0%A5' },
    ],
    metaTags: [
      {
        label: formatCookingTime(15),
        leftIcon: (
          <Clock3
            className="size-5 p-0.5 style-text-accent"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        label: '쉬움',
        leftIcon: (
          <Flame
            className="size-5 p-0.5 style-text-accent"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        label: '2인분',
        leftIcon: (
          <UsersRound
            className="size-5 p-0.5 style-text-accent"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
    ],
    ingredientsCardProps: {
      ingredients: [
        { id: 1, name: '밥', amount: 2, unit: '공기', isOptional: false },
        { id: 2, name: '소고기', amount: 150, unit: 'g', isOptional: false },
      ],
    },
    nutritionCardProps: {
      nutrition: {
        calories: 520,
        carbohydrates: 62,
        protein: 22,
        fat: 18,
        sodium: 640,
      },
    },
    tipsCardProps: {
      tip: '나물은 미리 데쳐 두면 조리 시간을 줄일 수 있습니다.',
    },
    stepsCardProps: {
      steps: [
        { step: 1, content: '첫 번째 조리 단계입니다.' },
        {
          step: 2,
          content: '다음 단계를 진행합니다.',
          imageUrl:
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        },
      ],
      stepImageAlt: '비빔밥',
    },
  },
} satisfies Meta<typeof RecipeDetailContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
