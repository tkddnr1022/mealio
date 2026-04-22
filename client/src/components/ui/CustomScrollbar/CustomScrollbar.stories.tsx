import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";

import { CustomScrollbar } from "@/components/ui/CustomScrollbar";

const figmaMobileFrame: Decorator = (Story) => (
  <div className="mx-auto flex h-[640px] w-full max-w-[400px] flex-col border border-border-subtle bg-background-primary shadow-md">
    <Story />
  </div>
);

const meta = {
  title: "UI/CustomScrollbar",
  component: CustomScrollbar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [figmaMobileFrame],
} satisfies Meta<typeof CustomScrollbar>;

export default meta;

type Story = StoryObj<typeof meta>;
type CustomScrollbarStoryArgs = ComponentProps<typeof CustomScrollbar>;

export const InMainContent: Story = {
  name: "CustomScrollbar 확인",
  render: (args: CustomScrollbarStoryArgs) => (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background-primary">
      <CustomScrollbar {...args} className="flex flex-col gap-8 px-4 py-6">
        <ul className="divide-y divide-border-subtle">
          {Array.from({ length: 40 }, (_, i) => (
            <li key={i} className="py-3 typo-body-regular style-text-primary">
              스크롤 테스트 아이템 {i + 1}
            </li>
          ))}
        </ul>
      </CustomScrollbar>
    </div>
  ),
};
