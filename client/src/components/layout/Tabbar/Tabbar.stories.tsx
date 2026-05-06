import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type ComponentProps, useState } from 'react';
import { fn } from 'storybook/test';

import { Tabbar, type TabbarTabId } from '@/components/layout/Tabbar';

const meta = {
  title: 'Layout/Tabbar',
  component: Tabbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/recipe',
      },
    },
  },
  args: {
    onSelect: fn(),
  },
} satisfies Meta<typeof Tabbar>;

export default meta;

type Story = StoryObj<typeof meta>;
type TabbarStoryArgs = ComponentProps<typeof Tabbar>;

export const Interactive = {
  args: {
    activeId: 'recipe' as TabbarTabId,
  },
  render: function Render(args: TabbarStoryArgs) {
    const [activeId, setActiveId] = useState<TabbarTabId>(
      args.activeId ?? 'recipe',
    );
    return (
      <div className="flex min-h-[200px] flex-col bg-background-primary">
        <div className="flex flex-1 items-center justify-center style-text-secondary">
          선택: {activeId}
        </div>
        <Tabbar
          {...args}
          activeId={activeId}
          preventLinkNavigation
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
  args: { activeId: 'recipe' },
  parameters: {
    nextjs: {
      navigation: { pathname: '/recipe' },
    },
  },
} satisfies Story;

export const ActiveChatbot = {
  args: { activeId: 'chatbot' },
  parameters: {
    nextjs: {
      navigation: { pathname: '/chatbot' },
    },
  },
} satisfies Story;

export const ActiveInventory = {
  args: { activeId: 'inventory' },
  parameters: {
    nextjs: {
      navigation: { pathname: '/inventory' },
    },
  },
} satisfies Story;

export const ActiveMypage = {
  args: { activeId: 'mypage' },
  parameters: {
    nextjs: {
      navigation: { pathname: '/mypage' },
    },
  },
} satisfies Story;
