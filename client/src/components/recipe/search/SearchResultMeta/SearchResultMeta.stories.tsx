import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { SearchResultMeta } from '@/components/recipe/search/SearchResultMeta';

const rowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Search/SearchResultMeta',
  component: SearchResultMeta,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [rowWidth],
  args: {
    totalCount: 1,
    filterDropdownProps: {
      label: '정렬',
      selectedValue: 'latest',
      options: [
        { value: 'latest', label: '최신순' },
        { value: 'popular', label: '인기순' },
        { value: 'time-asc', label: '조리시간 짧은순' },
      ],
    },
  },
} satisfies Meta<typeof SearchResultMeta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
