import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { IngredientSearchResult } from './IngredientSearchResult';

const meta = {
  title: 'Inventory/IngredientSearchResult',
  component: IngredientSearchResult,
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
} satisfies Meta<typeof IngredientSearchResult>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleItems: readonly InventoryIngredient[] = [
  {
    id: 1,
    name: '사과',
    categoryId: 1,
  },
  {
    id: 2,
    name: '소고기',
    categoryId: 2,
  },
  {
    id: 3,
    name: '계란',
    categoryId: 3,
  },
  {
    id: 4,
    name: '고등어',
    categoryId: 4,
  },
  {
    id: 5,
    name: '우유',
    categoryId: 5,
  },
  {
    id: 6,
    name: '밀가루',
    categoryId: 6,
  },
];

export const Default: Story = {
  args: {
    items: sampleItems,
    selectedIngredientIds: [1],
  },
};

export const Empty: Story = {
  args: {
    items: [],
    countText: '0개의 재료',
  },
};
