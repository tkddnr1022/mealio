import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { Clock3, Flame, UsersRound } from 'lucide-react';
import { CardTagsRow } from '@/components/ui/CardTagsRow';

const rowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'UI/CardTagsRow',
  component: CardTagsRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [rowWidth],
} satisfies Meta<typeof CardTagsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        label: 'Time',
        leftIcon: (
          <Clock3
            className="size-5 p-0.5 style-text-accent"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        label: 'Difficulty',
        leftIcon: (
          <Flame
            className="size-5 p-0.5 style-text-accent"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
      {
        label: 'Servings',
        leftIcon: (
          <UsersRound
            className="size-5 p-0.5 style-text-accent"
            strokeWidth={2}
            aria-hidden
          />
        ),
      },
    ],
  },
};
