import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

const figmaWidth = (Story: () => ReactNode) => (
  <div className="w-[min(100vw-2rem,9rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/Dropdown/DropdownItem",
  component: DropdownItem,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    label: "Label",
    selected: false,
  },
  argTypes: {
    selected: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof DropdownItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {
  args: {
    selected: false,
  },
};

export const Selected: Story = {
  args: {
    selected: true,
  },
};
