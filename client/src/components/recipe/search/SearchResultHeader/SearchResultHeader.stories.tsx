import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { SearchResultHeader } from '@/components/recipe/search/SearchResultHeader';

const rowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Search/SearchResultHeader',
  component: SearchResultHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [rowWidth],
  args: {
    searchResultTopProps: {
      query: 'Text',
      onBackClick: fn(),
    },
    searchResultMetaProps: {
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
    chipsRowProps: {
      labels: ['Label', 'Label', 'Label'],
      onRemoveChip: fn(),
    },
  },
} satisfies Meta<typeof SearchResultHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
