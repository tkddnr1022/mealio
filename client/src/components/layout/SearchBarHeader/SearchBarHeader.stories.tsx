import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { SearchBarHeader } from '@/components/layout/SearchBarHeader';

const narrowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'Layout/SearchBarHeader',
  component: SearchBarHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  args: {
    href: '/recipe/filter',
  },
} satisfies Meta<typeof SearchBarHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  name: '기본',
  decorators: [narrowWidth],
} satisfies Story;

export const CustomPlaceholder = {
  name: '플레이스홀더',
  decorators: [narrowWidth],
  args: {
    searchBarProps: {
      placeholder: '재료로 검색 (예: 달걀)',
    },
  },
} satisfies Story;

export const Disabled = {
  name: '비활성',
  decorators: [narrowWidth],
  args: {
    disabled: true,
  },
} satisfies Story;
