import { SearchX } from "lucide-react";
import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { InfoScreen } from "@/components/layout/InfoScreen";

const figmaFrame: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)] bg-background-primary">
    <Story />
  </div>
);

const meta = {
  title: "Layout/InfoScreen",
  component: InfoScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaFrame],
  args: {
    title: "Title",
    message: "Message",
    showButton: true,
    buttonLabel: "Label",
    onButtonClick: fn(),
  },
} satisfies Meta<typeof InfoScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutButton: Story = {
  args: {
    showButton: false,
  },
};

export const CustomIcon: Story = {
  args: {
    icon: <SearchX className="size-8" strokeWidth={2} aria-hidden />,
    title: "검색 결과가 없어요",
    message: "다른 키워드로 다시 시도해 주세요.",
    buttonLabel: "검색 초기화",
  },
};
