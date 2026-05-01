import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

const figmaWidth: Decorator = (Story) => (
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

export const Unselected = {
  args: {
    selected: false,
  },
} satisfies Story;

export const Selected = {
  args: {
    selected: true,
  },
} satisfies Story;
