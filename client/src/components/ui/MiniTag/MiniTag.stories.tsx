import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { MiniTag } from '@/components/ui/MiniTag';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,4rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'UI/MiniTag',
  component: MiniTag,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    label: 'Label',
  },
} satisfies Meta<typeof MiniTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
