import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CreditUsageCard } from '@/components/mypage/CreditUsageCard/index';

const meta = {
  title: 'Mypage/CreditUsageCard',
  component: CreditUsageCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CreditUsageCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Figma `581:3694` 기본 상태 */
export const Default = {
  args: {
    used: 250,
    max: 1000,
  },
} satisfies Story;

export const LowUsage = {
  args: {
    used: 50,
    max: 1000,
  },
} satisfies Story;

export const FullUsage = {
  args: {
    used: 1000,
    max: 1000,
  },
} satisfies Story;

export const CustomLabel = {
  args: {
    used: 12,
    max: 100,
    label: '이번 달 크레딧',
  },
} satisfies Story;
