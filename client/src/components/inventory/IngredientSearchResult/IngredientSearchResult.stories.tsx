import { Apple, Beef, Egg, Fish, Milk, Wheat } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IngredientSearchResult } from "./IngredientSearchResult";
import type { IngredientGridItem } from "@/components/inventory/IngredientGrid";

const meta = {
  title: "Inventory/IngredientSearchResult",
  component: IngredientSearchResult,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
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

const sampleItems: readonly IngredientGridItem[] = [
  { id: "apple", name: "사과", leadingIcon: <Apple className="size-5" strokeWidth={2} />, selected: true },
  { id: "beef", name: "소고기", leadingIcon: <Beef className="size-5" strokeWidth={2} /> },
  { id: "egg", name: "계란", leadingIcon: <Egg className="size-5" strokeWidth={2} /> },
  { id: "fish", name: "고등어", leadingIcon: <Fish className="size-5" strokeWidth={2} /> },
  { id: "milk", name: "우유", leadingIcon: <Milk className="size-5" strokeWidth={2} /> },
  { id: "wheat", name: "밀가루", leadingIcon: <Wheat className="size-5" strokeWidth={2} /> },
];

export const Default: Story = {
  args: {
    items: sampleItems,
  },
};

export const Empty: Story = {
  args: {
    items: [],
    countText: "0개의 재료",
  },
};
