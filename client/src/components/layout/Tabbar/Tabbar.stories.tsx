import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Tabbar, type TabbarTabId } from "@/components/layout/Tabbar";

const meta = {
  title: "Layout/Tabbar",
  component: Tabbar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    activeId: "recipe",
    onSelect: fn(),
  },
} satisfies Meta<typeof Tabbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: function Render(args) {
    const [activeId, setActiveId] = useState<TabbarTabId>(args.activeId);
    return (
      <div className="flex min-h-[200px] flex-col bg-background-primary">
        <div className="flex flex-1 items-center justify-center style-text-secondary">
          선택: {activeId}
        </div>
        <Tabbar
          {...args}
          activeId={activeId}
          onSelect={(id) => {
            args.onSelect?.(id);
            setActiveId(id);
          }}
        />
      </div>
    );
  },
};

export const ActiveRecipe: Story = {
  args: { activeId: "recipe" },
};

export const ActiveChatbot: Story = {
  args: { activeId: "chatbot" },
};

export const ActivePantry: Story = {
  args: { activeId: "inventory" },
};

export const ActiveMypage: Story = {
  args: { activeId: "mypage" },
};
