import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { Checkbox } from '@/components/ui/Checkbox';
import { IngredientList } from '@/components/inventory/IngredientList/index';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[360px] max-w-full">
    <Story />
  </div>
);

const filterCheckboxClassName = 'absolute top-1/2 right-4 -translate-y-1/2';

const favoriteIngredients: readonly InventoryIngredient[] = [
  { id: 1, name: '사과', categoryId: 1, categoryName: '채소' },
  { id: 2, name: '소고기', categoryId: 2, categoryName: '육류' },
  { id: 3, name: '계란', categoryId: 3, categoryName: '양념' },
  { id: 4, name: '고등어', categoryId: 4, categoryName: '곡류' },
  { id: 5, name: '우유', categoryId: 5, categoryName: '유제품' },
  { id: 6, name: '밀가루', categoryId: 6, categoryName: '곡류' },
];

const filterSelectedIngredientIds = [1];

const meta = {
  title: 'Inventory/IngredientList',
  component: IngredientList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof IngredientList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FavoriteIngredients = {
  name: '관심 재료',
  args: {
    items: favoriteIngredients,
    onRemoveIngredient: () => undefined,
  },
} satisfies Story;

export const IngredientFilterSelection = {
  name: '재료 선택',
  args: {
    items: favoriteIngredients,
    selectedIngredientIds: filterSelectedIngredientIds,
    onClickIngredient: () => undefined,
    getTrailing: (ingredient: InventoryIngredient) => (
      <Checkbox
        selected={filterSelectedIngredientIds.includes(ingredient.id)}
        tabIndex={-1}
        aria-hidden
        className={filterCheckboxClassName}
      />
    ),
  },
} satisfies Story;
