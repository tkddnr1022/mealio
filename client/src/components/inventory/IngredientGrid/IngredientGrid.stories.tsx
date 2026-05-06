import { Apple, Beef, Egg, Fish, Milk, Wheat } from 'lucide-react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  type IngredientGridItem,
  IngredientGrid,
} from '@/components/inventory/IngredientGrid/index';

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

const sampleItems: readonly IngredientGridItem[] = [
  {
    id: 'apple',
    name: '사과',
    leadingIcon: <Apple className="size-5" strokeWidth={2} />,
    onRemove: () => undefined,
  },
  {
    id: 'beef',
    name: '소고기',
    leadingIcon: <Beef className="size-5" strokeWidth={2} />,
    onRemove: () => undefined,
  },
  {
    id: 'egg',
    name: '계란',
    leadingIcon: <Egg className="size-5" strokeWidth={2} />,
    onRemove: () => undefined,
  },
  {
    id: 'fish',
    name: '고등어',
    leadingIcon: <Fish className="size-5" strokeWidth={2} />,
    onRemove: () => undefined,
  },
  {
    id: 'milk',
    name: '우유',
    leadingIcon: <Milk className="size-5" strokeWidth={2} />,
    onRemove: () => undefined,
  },
  {
    id: 'wheat',
    name: '밀가루',
    leadingIcon: <Wheat className="size-5" strokeWidth={2} />,
    onRemove: () => undefined,
  },
];

export const Default = {
  args: {
    items: sampleItems,
  },
} satisfies Story;

export const WithSelectedItem = {
  args: {
    items: [
      ...sampleItems.slice(0, 1),
      {
        id: 'selected-apple',
        name: '사과',
        selected: true,
        leadingIcon: <Apple className="size-5" strokeWidth={2} />,
      },
      ...sampleItems.slice(2),
    ],
  },
} satisfies Story;
