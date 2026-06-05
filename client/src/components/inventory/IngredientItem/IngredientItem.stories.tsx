import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { Checkbox } from '@/components/ui/Checkbox';
import { IngredientItem } from '@/components/inventory/IngredientItem/index';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[360px] max-w-full">
    <Story />
  </div>
);

const filterCheckboxClassName =
  'absolute top-1/2 right-4 -translate-y-1/2';

const appleIngredient: InventoryIngredient = {
  id: 1,
  name: '사과',
  categoryId: 1,
  categoryName: '채소',
};

const beefIngredient: InventoryIngredient = {
  id: 2,
  name: '소고기',
  categoryId: 2,
  categoryName: '육류',
};

const favoriteIngredients: readonly InventoryIngredient[] = [
  appleIngredient,
  beefIngredient,
  { id: 3, name: '계란', categoryId: 3, categoryName: '양념' },
  { id: 4, name: '고등어', categoryId: 4, categoryName: '곡류' },
  { id: 5, name: '우유', categoryId: 5, categoryName: '유제품' },
  { id: 6, name: '밀가루', categoryId: 6, categoryName: '곡류' },
];

const meta = {
  title: 'Inventory/IngredientItem',
  component: IngredientItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof IngredientItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FavoriteIngredientRemove = {
  name: '관심 재료 · 제거',
  args: {
    ingredient: appleIngredient,
    onRemove: () => undefined,
  },
} satisfies Story;

export const FilterSelectionUnselected = {
  name: '재료 선택 · 미선택',
  args: {
    ingredient: beefIngredient,
  },
  render: (args) => (
    <IngredientItem
      {...args}
      trailing={
        <Checkbox
          selected={false}
          tabIndex={-1}
          aria-hidden
          className={filterCheckboxClassName}
        />
      }
    />
  ),
} satisfies Story;

export const FilterSelectionSelected = {
  name: '재료 선택 · 선택',
  args: {
    ingredient: appleIngredient,
    selected: true,
  },
} satisfies Story;

export const ComponentSet = {
  name: 'Figma 세트',
  args: {
    ingredient: appleIngredient,
  },
  render: () => (
    <div className="flex w-full flex-col">
      <IngredientItem
        ingredient={beefIngredient}
        trailing={
          <Checkbox
            selected={false}
            tabIndex={-1}
            aria-hidden
            className={filterCheckboxClassName}
          />
        }
      />
      <IngredientItem ingredient={appleIngredient} selected />
    </div>
  ),
} satisfies Story;

export const FavoriteIngredientListPreview = {
  name: '관심 재료 · 목록 미리보기',
  args: {
    ingredient: appleIngredient,
  },
  render: () => (
    <div className="flex w-full flex-col">
      {favoriteIngredients.map((ingredient) => (
        <IngredientItem
          key={ingredient.id}
          ingredient={ingredient}
          onRemove={() => undefined}
        />
      ))}
    </div>
  ),
} satisfies Story;
