import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { Thumbnail } from '@/components/ui/Thumbnail';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const sampleImage =
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=800&fit=crop';

const meta = {
  title: 'UI/Thumbnail',
  component: Thumbnail,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    imageUrl: sampleImage,
    imageAlt: '레시피 썸네일',
    square: true,
  },
} satisfies Meta<typeof Thumbnail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Square = {} satisfies Story;

export const Landscape = {
  args: {
    square: false,
  },
} satisfies Story;
