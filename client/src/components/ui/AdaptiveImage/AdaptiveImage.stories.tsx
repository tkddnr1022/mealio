import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { AdaptiveImage } from '@/components/ui/AdaptiveImage';

const frame: Decorator = (Story) => (
  <div className="relative aspect-square w-48 overflow-hidden rounded-xl bg-background-placeholder">
    <Story />
  </div>
);

const meta = {
  title: 'UI/AdaptiveImage',
  component: AdaptiveImage,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [frame],
  args: {
    src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    alt: '샘플 이미지',
    fill: true,
    className: 'object-cover',
    sizes: '200px',
  },
} satisfies Meta<typeof AdaptiveImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ExternalSrc = {} satisfies Story;

export const AppPathSrc = {
  args: {
    src: '/oauth/google.svg',
    fill: false,
    width: 32,
    height: 32,
    className: 'size-8',
  },
} satisfies Story;
