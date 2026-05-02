import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InventorySubTabbar } from "@/components/inventory/InventorySubTabbar";

const meta = {
  title: "Inventory/InventorySubTabbar",
  component: InventorySubTabbar,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[400px] max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InventorySubTabbar>;

export default meta;

type Story = StoryObj<typeof meta>;
const defaultItems = [
  { id: "owned", label: "보유 재료" },
  { id: "favorite", label: "관심 재료" },
  { id: "favorite-recipe", label: "관심 레시피" },
] as const;

export const SelectedOwned: Story = {
  name: "selected=owned",
  args: {
    selected: "owned",
    items: defaultItems,
  },
};

export const SelectedFavorite: Story = {
  name: "selected=favorite",
  args: {
    selected: "favorite",
    items: defaultItems,
  },
};

export const SelectedFavoriteRecipe: Story = {
  name: "selected=favorite-recipe",
  args: {
    selected: "favorite-recipe",
    items: defaultItems,
  },
};
