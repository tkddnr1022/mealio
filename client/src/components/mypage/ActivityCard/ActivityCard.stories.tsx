import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { UserActivityItem } from '@/lib/types/user';
import { ActivityCard } from '@/components/mypage/ActivityCard';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const baseItem: UserActivityItem = {
  id: 'activity-1',
  type: 'chatbot.message',
  occurredAt: '2026-06-02T20:31:00+09:00',
};

const meta = {
  title: 'Mypage/ActivityCard',
  component: ActivityCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    item: baseItem,
  },
} satisfies Meta<typeof ActivityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chatbot: Story = {};

export const Recipe: Story = {
  args: {
    item: {
      ...baseItem,
      id: 'activity-2',
      type: 'recipe.favorites_add',
    },
  },
};

export const Ingredient: Story = {
  args: {
    item: {
      ...baseItem,
      id: 'activity-3',
      type: 'ingredient.update',
    },
  },
};
