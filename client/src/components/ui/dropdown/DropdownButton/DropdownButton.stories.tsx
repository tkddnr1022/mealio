import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";
import { DropdownButton } from "@/components/ui/dropdown/DropdownButton";

const figmaWidth = (Story: () => ReactNode) => (
  <div className="w-[min(100vw-2rem,10rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/Dropdown/DropdownButton",
  component: DropdownButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    label: "Label",
    open: false,
  },
  argTypes: {
    open: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof DropdownButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    open: false,
  },
};

export const Open: Story = {
  args: {
    open: true,
  },
};
