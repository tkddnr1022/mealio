import { SearchX } from 'lucide-react';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { InfoScreen } from '@/components/layout/InfoScreen';
import { HOME_PATH } from '@/lib/constants/routes.constants';

const figmaFrame: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22.5rem)] bg-background-primary">
    <Story />
  </div>
);

const meta = {
  title: 'Layout/InfoScreen',
  component: InfoScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaFrame],
  args: {
    title: 'Title',
    message: 'Message',
    showButton: true,
    buttonLabel: 'Label',
    buttonHref: HOME_PATH,
  },
} satisfies Meta<typeof InfoScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const WithoutButton = {
  args: {
    showButton: false,
  },
} satisfies Story;

export const CustomIcon = {
  args: {
    icon: <SearchX className="size-8" strokeWidth={2} aria-hidden />,
    title: '검색 결과가 없어요',
    message: '다른 키워드로 다시 시도해 주세요.',
    buttonLabel: '검색 초기화',
  },
} satisfies Story;
