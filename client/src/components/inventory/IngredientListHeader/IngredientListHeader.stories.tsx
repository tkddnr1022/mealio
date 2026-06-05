import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IngredientListHeader } from '@/components/inventory/IngredientListHeader';

const meta = {
  title: 'Inventory/IngredientListHeader',
  component: IngredientListHeader,
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
} satisfies Meta<typeof IngredientListHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    title: '재료 선택',
    countText: '6개의 재료',
  },
} satisfies Story;
