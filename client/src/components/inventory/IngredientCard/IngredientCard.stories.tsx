import { Apple, Beef, Egg, Fish, Milk, Wheat } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { IngredientCard } from '@/components/inventory/IngredientCard/index';

const meta = {
  title: 'Inventory/IngredientCard',
  component: IngredientCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof IngredientCard>;

export default meta;

type Story = StoryObj<typeof meta>;
const appleIngredient: InventoryIngredient = {
  id: 1,
  name: '사과',
  categoryId: 1,
};

export const Unselected = {
  name: 'selected=false',
  args: {
    ingredient: appleIngredient,
    leadingIcon: <Apple />,
    onRemove: () => undefined,
  },
} satisfies Story;

export const Selected = {
  name: 'selected=true',
  args: {
    ingredient: appleIngredient,
    selected: true,
    leadingIcon: <Apple className="size-5" strokeWidth={2} />,
  },
} satisfies Story;

export const IconExamples = {
  name: '아이콘 예시',
  render: () => (
    <div className="grid grid-cols-5 gap-4">
      <IngredientCard
        ingredient={{ id: 2, name: '소고기', categoryId: 2 }}
        leadingIcon={<Beef className="size-5" strokeWidth={2} />}
      />
      <IngredientCard
        ingredient={{ id: 3, name: '계란', categoryId: 3 }}
        leadingIcon={<Egg className="size-5" strokeWidth={2} />}
      />
      <IngredientCard
        ingredient={{ id: 4, name: '고등어', categoryId: 4 }}
        leadingIcon={<Fish className="size-5" strokeWidth={2} />}
      />
      <IngredientCard
        ingredient={{ id: 5, name: '우유', categoryId: 5 }}
        leadingIcon={<Milk className="size-5" strokeWidth={2} />}
      />
      <IngredientCard
        ingredient={{ id: 6, name: '밀가루', categoryId: 6 }}
        leadingIcon={<Wheat className="size-5" strokeWidth={2} />}
      />
    </div>
  ),
} satisfies Story;
