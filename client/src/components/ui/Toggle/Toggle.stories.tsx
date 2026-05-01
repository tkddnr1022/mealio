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

export const Playground = {} satisfies Story;

export const SelectedLargeDefault = {
  name: "Selected / Large",
  args: {
    selected: true,
    size: "large",
  },
} satisfies Story;

export const UnselectedLargeDefault = {
  name: "Unselected / Large",
  args: {
    selected: false,
    size: "large",
  },
} satisfies Story;

export const SelectedMediumDefault = {
  name: "Selected / Medium",
  args: {
    selected: true,
    size: "medium",
  },
} satisfies Story;

export const UnselectedMediumDefault = {
  name: "Unselected / Medium",
  args: {
    selected: false,
    size: "medium",
  },
} satisfies Story;
