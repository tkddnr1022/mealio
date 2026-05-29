import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { RecipeTipsCard } from '@/components/recipe/detail/RecipeTipsCard';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Detail/RecipeTipsCard',
  component: RecipeTipsCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    tip: '나트륨을 줄이려면 저염 재료를 사용하고, 간은 새우에 들어 있는 염분으로 맛을 냅니다.',
  },
} satisfies Meta<typeof RecipeTipsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
