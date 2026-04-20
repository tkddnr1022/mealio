import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AppRootFrame } from '@/components/layout/AppRootFrame';
import { MainContent } from '@/components/layout/MainContent';

const meta = {
  title: 'Layout/AppRootFrame',
  component: AppRootFrame,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' },
  },
} satisfies Meta<typeof AppRootFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본',
  args: {
    children: (
      <MainContent centered>
        <div className="w-full rounded-xl border border-border-subtle bg-surface p-4 text-center text-body text-text-primary shadow-sm">
          AppRootFrame 내부 컨텐츠
        </div>
      </MainContent>
    ),
  },
};
