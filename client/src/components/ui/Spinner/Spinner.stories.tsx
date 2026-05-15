import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Spinner } from '@/components/ui/Spinner';
import { buildAriaLabel } from '@/lib/utils/a11y';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MediumDefault = {
  name: '중간 (기본)',
  args: {},
} satisfies Story;

export const Small = {
  name: '작음',
  args: {
    size: 'sm',
  },
} satisfies Story;

export const Large = {
  name: '큼',
  args: {
    size: 'lg',
  },
} satisfies Story;

export const Decorative = {
  name: '장식 (부모 라벨 전제)',
  args: {
    decorative: true,
  },
  decorators: [
    (Story) => (
      <div
        aria-busy="true"
        aria-live="polite"
        aria-label={buildAriaLabel('generic', '페이지 불러오는 중')}
        className="flex flex-col items-center gap-2 py-8"
      >
        <Story />
      </div>
    ),
  ],
} satisfies Story;
