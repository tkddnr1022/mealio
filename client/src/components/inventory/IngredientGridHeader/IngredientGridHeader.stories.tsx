import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IngredientGridHeader } from '@/components/inventory/IngredientGridHeader';

const meta = {
  title: 'Inventory/IngredientGridHeader',
  component: IngredientGridHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[360px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IngredientGridHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    title: '재료 선택',
    countText: '6개의 재료',
  },
} satisfies Story;
