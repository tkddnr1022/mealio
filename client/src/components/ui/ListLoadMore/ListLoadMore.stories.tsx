import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { ListLoadMore } from '@/components/ui/ListLoadMore';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'UI/ListLoadMore',
  component: ListLoadMore,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    hasMore: true,
    isLoading: false,
    onLoadMore: () => undefined,
  },
} satisfies Meta<typeof ListLoadMore>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const Loading = {
  args: {
    isLoading: true,
  },
} satisfies Story;

export const Hidden = {
  args: {
    hasMore: false,
  },
} satisfies Story;

export const Interactive = {
  render: (args) => {
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    return (
      <ListLoadMore
        {...args}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={() => {
          setIsLoading(true);
          window.setTimeout(() => {
            setIsLoading(false);
            setHasMore(false);
          }, 800);
        }}
      />
    );
  },
} satisfies Story;
