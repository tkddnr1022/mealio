import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { FooterText } from '@/components/ui/FooterText';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'UI/FooterText',
  component: FooterText,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    children: '최근 30일간의 대화 내용만 보관돼요',
  },
} satisfies Meta<typeof FooterText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const LongText = {
  args: {
    children:
      '목록 하단에 표시되는 안내 문구입니다. 여러 줄로 길게 표시될 수 있어요.',
  },
} satisfies Story;
