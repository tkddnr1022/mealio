import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { RangeSlider } from "@/components/ui/RangeSlider";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,23rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/RangeSlider",
  component: RangeSlider,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    min: 0,
    max: 180,
    step: 5,
    defaultMinValue: 0,
    defaultMaxValue: 180,
    unit: "time",
  },
} satisfies Meta<typeof RangeSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "기본 범위" };
export const SmallRange: Story = {
  name: "작은 범위",
  args: { min: 0, max: 10, step: 1, defaultMinValue: 3, defaultMaxValue: 7 },
};
export const WideRange: Story = {
  name: "넓은 범위",
  args: { min: 0, max: 1000, step: 10, defaultMinValue: 200, defaultMaxValue: 700 },
};
