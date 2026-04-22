import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { FilterDropdown } from "@/components/ui/dropdown/FilterDropdown";

const figmaWidth: Decorator = (Story) => (
  <div>
    <Story />
  </div>
);

const sampleOptions = [
  { value: "selected", label: "Label" },
  { value: "option-a", label: "Label" },
  { value: "option-b", label: "Label" },
] as const;

const meta = {
  title: "UI/Dropdown/FilterDropdown",
  component: FilterDropdown,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    label: "Label",
    open: false,
    options: sampleOptions,
    selectedValue: "selected",
  },
  argTypes: {
    open: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof FilterDropdown>;

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
