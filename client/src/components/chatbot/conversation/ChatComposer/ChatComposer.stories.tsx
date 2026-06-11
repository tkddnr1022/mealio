import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { type ComponentProps, useState } from 'react';
import { fn } from 'storybook/test';
import { ChatComposer } from '@/components/chatbot/conversation/ChatComposer';

type ChatComposerStoryArgs = ComponentProps<typeof ChatComposer>;

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,25rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'Chatbot/Conversation/ChatComposer',
  component: ChatComposer,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    onValueChange: fn(),
    onSubmitMessage: fn(),
  },
  render: function Render(args: ChatComposerStoryArgs) {
    const [value, setValue] = useState(args.value ?? '');

    return (
      <ChatComposer
        {...args}
        value={value}
        onValueChange={(next) => {
          args.onValueChange?.(next);
          setValue(next);
        }}
        onSubmitMessage={(submitted) => {
          args.onSubmitMessage?.(submitted);
          setValue('');
        }}
      />
    );
  },
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty = {
  args: {
    value: '',
  },
} satisfies Story;

export const Filled = {
  args: {
    value: '한식 레시피 추천해줘',
  },
} satisfies Story;
