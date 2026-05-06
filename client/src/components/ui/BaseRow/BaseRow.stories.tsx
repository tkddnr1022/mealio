import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import type { ComponentProps } from 'react';

import { BaseRow } from '@/components/ui/BaseRow';
import { Toggle } from '@/components/ui/Toggle';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,24rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'UI/BaseRow',
  component: BaseRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
} satisfies Meta<typeof BaseRow>;

export default meta;
type Story = StoryObj<typeof meta>;
type BaseRowStoryArgs = ComponentProps<typeof BaseRow>;

export const WithToggles = {
  name: 'Toggle 배치',
  render: (args: BaseRowStoryArgs) => (
    <BaseRow {...args}>
      <Toggle selected label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected={false} label="Label" />
      <Toggle selected label="Label" />
    </BaseRow>
  ),
} satisfies Story;
