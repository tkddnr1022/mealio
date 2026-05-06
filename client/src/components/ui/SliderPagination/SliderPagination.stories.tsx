import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ComponentProps } from 'react';

import { SliderPagination } from '@/components/ui/SliderPagination';

const paddedRow: Decorator = (Story) => (
  <div className="w-full max-w-[400px] py-4">
    <Story />
  </div>
);

const meta = {
  title: 'UI/SliderPagination',
  component: SliderPagination,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [paddedRow],
  args: {
    total: 3,
    activeIndex: 0,
  },
} satisfies Meta<typeof SliderPagination>;

export default meta;

type Story = StoryObj<typeof meta>;
type SliderPaginationStoryArgs = ComponentProps<typeof SliderPagination>;

export const FirstActive = {
  name: '첫 번째 활성',
  args: {
    total: 3,
    activeIndex: 0,
  },
} satisfies Story;

export const SecondActive = {
  name: '두 번째 활성',
  args: {
    total: 3,
    activeIndex: 1,
  },
} satisfies Story;

export const ThirdActive = {
  name: '세 번째 활성',
  args: {
    total: 3,
    activeIndex: 2,
  },
} satisfies Story;

export const FiveSlides = {
  name: '슬라이드 5개',
  args: {
    total: 5,
    activeIndex: 2,
  },
} satisfies Story;

export const SingleSlide = {
  name: '슬라이드 1개',
  args: {
    total: 1,
    activeIndex: 0,
  },
} satisfies Story;

/** total이 0이면 아무것도 렌더하지 않음 */
export const EmptyTotal = {
  name: 'total 0 (미렌더)',
  args: {
    total: 0,
    activeIndex: 0,
  },
  render: (args: SliderPaginationStoryArgs) => (
    <div className="flex min-h-[2rem] flex-col items-center justify-center gap-2 typo-caption-regular style-text-caption">
      <SliderPagination {...args} />
      <span aria-live="polite">위 영역은 비어 있습니다 (null).</span>
    </div>
  ),
} satisfies Story;
