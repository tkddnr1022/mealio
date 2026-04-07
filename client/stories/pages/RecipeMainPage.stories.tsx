import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ReactNode } from 'react';

import RecipeMainPage from '../../app/page';
import { AppRootFrame } from '../../components/layout/AppRootFrame';

const mobileCanvas = (Story: () => ReactNode) => (
  <AppRootFrame className="bg-background">
    <Story />
  </AppRootFrame>
);

const meta = {
  title: 'Pages/RecipeMainPage',
  component: RecipeMainPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile' },
  },
  decorators: [mobileCanvas],
} satisfies Meta<typeof RecipeMainPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본 화면',
};
