import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { SearchResultTop } from '@/components/recipe/search/SearchResultTop';

const rowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Search/SearchResultTop',
  component: SearchResultTop,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [rowWidth],
  args: {
    query: 'Text',
    onBackClick: fn(),
  },
} satisfies Meta<typeof SearchResultTop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
