import { Apple, Beef, Egg, Fish, Milk, Wheat } from 'lucide-react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ReactNode } from 'react';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { IngredientGrid } from '@/components/inventory/IngredientGrid/index';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[360px] max-w-full">
    <Story />
  </div>
);

const meta = {
  title: 'Inventory/IngredientGrid',
  component: IngredientGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof IngredientGrid>;

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

const iconMap = new Map<number, ReactNode>([
  [1, <Apple className="size-5" strokeWidth={2} />],
  [2, <Beef className="size-5" strokeWidth={2} />],
  [3, <Egg className="size-5" strokeWidth={2} />],
  [4, <Fish className="size-5" strokeWidth={2} />],
  [5, <Milk className="size-5" strokeWidth={2} />],
  [6, <Wheat className="size-5" strokeWidth={2} />],
]);

export const Default = {
  args: {
    items: sampleItems,
    getLeadingIcon: (ingredient) => iconMap.get(ingredient.id),
    onRemoveIngredient: () => undefined,
  },
} satisfies Story;

export const WithSelectedItem = {
  args: {
    items: sampleItems,
    selectedIngredientIds: [1],
    getLeadingIcon: (ingredient) => iconMap.get(ingredient.id),
    onRemoveIngredient: () => undefined,
  },
} satisfies Story;
