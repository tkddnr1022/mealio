import { Apple, Beef, Egg, Fish, Milk, Wheat } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { IngredientCard } from "@/components/inventory/IngredientCard/index";

const meta = {
  title: "Inventory/IngredientCard",
  component: IngredientCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof IngredientCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unselected: Story = {
  name: "selected=false",
  args: {
    name: "사과",
    leadingIcon: <Apple />,
    onRemove: () => undefined,
  },
};

export const Selected: Story = {
  name: "selected=true",
  args: {
    name: "사과",
    selected: true,
    leadingIcon: <Apple className="size-5" strokeWidth={2} />,
  },
};

export const IconExamples: Story = {
  name: "아이콘 예시",
  render: () => (
    <div className="grid grid-cols-5 gap-4">
      <IngredientCard name="소고기" leadingIcon={<Beef className="size-5" strokeWidth={2} />} />
      <IngredientCard name="계란" leadingIcon={<Egg className="size-5" strokeWidth={2} />} />
      <IngredientCard name="고등어" leadingIcon={<Fish className="size-5" strokeWidth={2} />} />
      <IngredientCard name="우유" leadingIcon={<Milk className="size-5" strokeWidth={2} />} />
      <IngredientCard name="밀가루" leadingIcon={<Wheat className="size-5" strokeWidth={2} />} />
    </div>
  ),
};
