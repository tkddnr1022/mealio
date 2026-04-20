import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";

import { CustomScrollbar } from "@/components/ui/CustomScrollbar";

const figmaMobileFrame = (Story: () => ReactNode) => (
  <div className="mx-auto flex h-[640px] w-full max-w-[400px] flex-col border border-border-subtle bg-background shadow-md">
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

export const InMainContent: Story = {
  name: "CustomScrollbar 확인",
  render: (args) => (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background">
      <CustomScrollbar {...args} className="flex flex-col gap-8 px-4 py-6">
        <ul className="divide-y divide-border-subtle">
          {Array.from({ length: 40 }, (_, i) => (
            <li key={i} className="py-3 typography-body text-text-primary">
              스크롤 테스트 아이템 {i + 1}
            </li>
          ))}
        </ul>
      </CustomScrollbar>
    </div>
  ),
};
