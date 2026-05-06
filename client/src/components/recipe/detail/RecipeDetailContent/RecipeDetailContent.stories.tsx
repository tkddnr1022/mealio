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
      category: '한식',
      title: '비빔밥',
      description:
        '한국의 대표적인 건강식으로, 다양한 나물과 고기, 계란을 넣어 비벼 먹는 전통 요리입니다.',
    },
    tags: [
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
        { name: '밥', quantity: '2공기' },
        { name: '소고기', quantity: '150g' },
      ],
    },
    stepsCardProps: {
      steps: [
        { step: '1', instruction: '첫 번째 조리 단계입니다.' },
        { step: '2', instruction: '다음 단계를 진행합니다.' },
      ],
    },
  },
} satisfies Meta<typeof RecipeDetailContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
