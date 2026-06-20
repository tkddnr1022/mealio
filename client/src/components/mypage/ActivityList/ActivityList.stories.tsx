import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { UserActivityItem } from '@/lib/types/user';
import { ActivityList } from '@/components/mypage/ActivityList';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const sampleItems: readonly UserActivityItem[] = [
  {
    id: 'activity-1',
    type: 'chatbot.message',
    occurredAt: '2026-06-02T20:31:00+09:00',
  },
  {
    id: 'activity-2',
    type: 'recipe.favorites_add',
    occurredAt: '2026-06-01T14:10:00+09:00',
  },
  {
    id: 'activity-3',
    type: 'ingredient.update',
    occurredAt: '2026-05-30T09:00:00+09:00',
  },
];

const meta = {
  title: 'Mypage/ActivityList',
  component: ActivityList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    items: sampleItems,
  },
} satisfies Meta<typeof ActivityList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
