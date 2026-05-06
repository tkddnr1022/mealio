import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { RecipeStepRow } from '@/components/recipe';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,20.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'Recipe/Detail/RecipeStepRow',
  component: RecipeStepRow,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    step: '1',
    instruction: '첫 번째 조리 단계입니다.',
  },
} satisfies Meta<typeof RecipeStepRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;
