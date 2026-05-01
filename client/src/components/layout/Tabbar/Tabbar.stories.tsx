import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type ComponentProps, useState } from "react";
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
type TabbarStoryArgs = ComponentProps<typeof Tabbar>;

export const Interactive = {
  render: function Render(args: TabbarStoryArgs) {
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
} satisfies Story;

export const ActiveRecipe = {
  args: { activeId: "recipe" },
} satisfies Story;

export const ActiveChatbot = {
  args: { activeId: "chatbot" },
} satisfies Story;

export const ActivePantry = {
  args: { activeId: "inventory" },
} satisfies Story;

export const ActiveMypage = {
  args: { activeId: "mypage" },
} satisfies Story;
