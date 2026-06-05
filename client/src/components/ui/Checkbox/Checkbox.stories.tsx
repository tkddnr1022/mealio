import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Checkbox } from '@/components/ui/Checkbox';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  args: {
    selected: false,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground = {} satisfies Story;

export const Selected = {
  name: 'Selected',
  args: {
    selected: true,
  },
} satisfies Story;

export const Unselected = {
  name: 'Unselected',
  args: {
    selected: false,
  },
} satisfies Story;
