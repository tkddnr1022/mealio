import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { type ToggleSize, Toggle } from "@/components/ui/Toggle";

const toggleSizeOptions = ["large", "medium"] as const satisfies readonly ToggleSize[];

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    label: "Label",
    selected: true,
    size: "large",
  },
  argTypes: {
    size: {
      control: "select",
      options: toggleSizeOptions,
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SelectedLargeDefault: Story = {
  name: "Selected / Large",
  args: {
    selected: true,
    size: "large",
  },
};

export const UnselectedLargeDefault: Story = {
  name: "Unselected / Large",
  args: {
    selected: false,
    size: "large",
  },
};

export const SelectedMediumDefault: Story = {
  name: "Selected / Medium",
  args: {
    selected: true,
    size: "medium",
  },
};

export const UnselectedMediumDefault: Story = {
  name: "Unselected / Medium",
  args: {
    selected: false,
    size: "medium",
  },
};
