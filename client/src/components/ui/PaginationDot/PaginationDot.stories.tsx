import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';

import { PaginationDot } from '@/components/ui/PaginationDot';
import { buildAriaLabel } from '@/lib/utils/a11y';

const row: Decorator = (Story) => (
  <div className="flex items-center gap-2 py-4">
    <Story />
  </div>
);

const meta = {
  title: 'UI/PaginationDot',
  component: PaginationDot,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [row],
} satisfies Meta<typeof PaginationDot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inactive = {
  name: '비활성',
  args: {
    active: false,
  },
} satisfies Story;

export const Active = {
  name: '활성',
  args: {
    active: true,
  },
} satisfies Story;

/** 인디케이터 행 사용 예시 (3번째 활성) */
export const RowExample = {
  name: '행 예시',
  render: () => (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label={buildAriaLabel('section', '슬라이드 위치')}
    >
      <PaginationDot aria-hidden />
      <PaginationDot aria-hidden />
      <PaginationDot active aria-current="true" />
      <PaginationDot aria-hidden />
      <PaginationDot aria-hidden />
    </div>
  ),
} satisfies Story;
