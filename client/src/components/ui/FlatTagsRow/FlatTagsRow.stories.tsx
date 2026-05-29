import { Clock3, Flame, UsersRound } from 'lucide-react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { FlatTagsRow } from '@/components/ui/FlatTagsRow';

const rowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,24rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'UI/FlatTagsRow',
  component: FlatTagsRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [rowWidth],
} satisfies Meta<typeof FlatTagsRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        label: 'Time',
        leftIcon: (
          <Clock3 className="size-4 p-px" strokeWidth={2} aria-hidden />
        ),
      },
      {
        label: 'Difficulty',
        leftIcon: <Flame className="size-4 p-px" strokeWidth={2} aria-hidden />,
      },
      {
        label: 'Servings',
        leftIcon: (
          <UsersRound className="size-4 p-px" strokeWidth={2} aria-hidden />
        ),
      },
    ],
  },
};

