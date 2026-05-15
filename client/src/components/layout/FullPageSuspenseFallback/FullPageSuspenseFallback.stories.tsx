import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { FullPageSuspenseFallback } from '@/components/layout/FullPageSuspenseFallback';

const meta = {
  title: 'Layout/FullPageSuspenseFallback',
  component: FullPageSuspenseFallback,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-[320px] w-full max-w-md flex-col border border-border-subtle">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FullPageSuspenseFallback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  name: '기본',
  args: {},
} satisfies Story;

export const SpinnerSmall = {
  name: '스피너 작음',
  args: {
    spinnerSize: 'sm',
  },
} satisfies Story;

export const SpinnerLarge = {
  name: '스피너 큼',
  args: {
    spinnerSize: 'lg',
  },
} satisfies Story;
