import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  DropdownList,
  type DropdownOption,
} from "@/components/ui/dropdown/DropdownList";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,10rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/Dropdown/DropdownList",
  component: DropdownList,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof DropdownList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleOptions = [
  { value: "selected", label: "Label" },
  { value: "option-a", label: "Label" },
  { value: "option-b", label: "Label" },
] as const satisfies readonly DropdownOption[];

export const Default = {
  args: {
    options: sampleOptions,
    selectedValue: "selected",
  },
} satisfies Story;
