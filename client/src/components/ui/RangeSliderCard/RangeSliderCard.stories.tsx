import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";

import { RangeSliderCard } from "@/components/ui/RangeSliderCard";

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,24rem)]">
    <Story />
  </div>
);

const meta = {
  title: "UI/RangeSliderCard",
  component: RangeSliderCard,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaWidth],
  args: {
    heading: "Heading",
    sliderProps: {
      min: 0,
      max: 180,
      step: 5,
      defaultMinValue: 0,
      defaultMaxValue: 180,
      unit: "time",
    },
  },
} satisfies Meta<typeof RangeSliderCard>;

export default meta;
type Story = StoryObj<typeof meta>;
type RangeSliderCardStoryArgs = ComponentProps<typeof RangeSliderCard>;

export const Default = {} satisfies Story;

export const DifferentRanges = {
  name: "다양한 범위 설정",
  render: (args: RangeSliderCardStoryArgs) => (
    <div className="flex w-[min(100vw-2rem,24rem)] flex-col gap-4">
      <RangeSliderCard
        {...args}
        heading="기본"
        sliderProps={{ min: 0, max: 100, step: 1, defaultMinValue: 20, defaultMaxValue: 80 }}
      />
      <RangeSliderCard
        {...args}
        heading="가격대"
        sliderProps={{ min: 0, max: 50000, step: 1000, defaultMinValue: 10000, defaultMaxValue: 35000 }}
      />
      <RangeSliderCard
        {...args}
        heading="조리 시간(분)"
        sliderProps={{ min: 0, max: 180, step: 5, defaultMinValue: 15, defaultMaxValue: 90 }}
      />
    </div>
  ),
} satisfies Story;
