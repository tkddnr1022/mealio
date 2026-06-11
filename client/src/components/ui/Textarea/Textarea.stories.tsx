import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { Textarea } from '@/components/ui/Textarea';

const narrowWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,23rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [narrowWidth],
  args: {
    placeholder: '메시지를 입력하세요',
    disabled: false,
    autoGrow: true,
    maxLines: 5,
    onChange: fn(),
    onEnterSubmit: fn(),
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty = {
  name: '기본',
} satisfies Story;

export const Filled = {
  name: '값 있음',
  args: {
    defaultValue: '한식 레시피 추천해줘',
  },
} satisfies Story;

export const Multiline = {
  name: '여러 줄',
  args: {
    defaultValue: '오늘 저녁 뭐 먹을까요?\n닭가슴살이랑 브로콜리가 있어요.',
  },
} satisfies Story;

export const LongText = {
  name: '최대 높이 초과',
  args: {
    defaultValue:
      '첫 번째 줄입니다.\n두 번째 줄입니다.\n세 번째 줄입니다.\n네 번째 줄입니다.\n다섯 번째 줄입니다.\n여섯 번째 줄부터는 스크롤됩니다.',
  },
} satisfies Story;

export const Disabled = {
  name: '비활성',
  args: {
    disabled: true,
    placeholder: '입력할 수 없어요',
  },
} satisfies Story;

export const NoAutoGrow = {
  name: '자동 높이 조절 없음',
  args: {
    autoGrow: false,
    defaultValue: '높이가 고정된 textarea입니다.\n줄바꿈해도 높이는 변하지 않아요.',
  },
} satisfies Story;

export const NoFocusWithinRing = {
  name: 'focus-within 링 없음',
  args: {
    focusWithinRing: false,
    placeholder: '상위가 포커스 링 처리',
  },
} satisfies Story;
