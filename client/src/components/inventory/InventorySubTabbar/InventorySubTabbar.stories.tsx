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

export const SelectedIndex1: Story = {
  name: "selectedIndex=1",
  args: {
    selectedIndex: 1,
  },
};

export const SelectedIndex2: Story = {
  name: "selectedIndex=2",
  args: {
    selectedIndex: 2,
  },
};

export const SelectedIndex3: Story = {
  name: "selectedIndex=3",
  args: {
    selectedIndex: 3,
  },
};
