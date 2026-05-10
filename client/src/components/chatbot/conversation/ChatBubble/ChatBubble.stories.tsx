import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChatBubble } from '@/components/chatbot/conversation/ChatBubble';
import {
  CHATBOT_TOOL_FUNCTION_NAME,
  getChatbotToolProgressLabel,
} from '@/lib/chatbot/chatbot-tool-progress';
import { GENERATING_REPLY_LABEL } from '@/lib/chatbot/stream-progress-label';

const figmaWidth: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,10rem)]">
    <Story />
  </div>
);

const previewWide: Decorator = (Story) => (
  <div className="w-[min(100vw-2rem,22rem)]">
    <Story />
  </div>
);

const meta = {
  title: 'Chatbot/Conversation/ChatBubble',
  component: ChatBubble,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [figmaWidth],
  args: {
    role: 'assistant',
    message: '안녕하세요. 오늘은 어떤 레시피를 찾고 계신가요?',
    timestamp: new Date('2026-04-23T10:00:00+09:00'),
    pendingPlaceholder: false,
  },
  argTypes: {
    pendingPlaceholder: {
      description:
        '스트리밍 대기 문구(답변 생성 중·도구 실행 중). 캡션 톤·펄스 애니메이션·aria-live 적용.',
    },
  },
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Assistant = {} satisfies Story;

export const User = {
  args: {
    role: 'user',
    message: '김치볶음밥 레시피 알려줘',
  },
} satisfies Story;

/** 첫 SSE 이벤트 전 — 페이지와 동일한 문구·스타일 */
export const AssistantPendingGenerating = {
  args: {
    message: GENERATING_REPLY_LABEL,
    pendingPlaceholder: true,
  },
} satisfies Story;

/** tool_call 구간 — 도구 라벨 헬퍼와 동일한 문구 */
export const AssistantPendingToolSearchRecipes = {
  args: {
    message: getChatbotToolProgressLabel(
      CHATBOT_TOOL_FUNCTION_NAME.SEARCH_RECIPES,
    ),
    pendingPlaceholder: true,
  },
} satisfies Story;

export const AssistantPendingToolInventory = {
  args: {
    message: getChatbotToolProgressLabel(
      CHATBOT_TOOL_FUNCTION_NAME.GET_USER_INVENTORY,
    ),
    pendingPlaceholder: true,
  },
} satisfies Story;

export const AssistantMarkdown = {
  decorators: [previewWide],
  args: {
    message: [
      '마크다운 **강조**와 목록을 지원합니다.',
      '',
      '- 재료: 밥, 김치, 계란',
      '- [레시피 더 보기](https://example.com)',
    ].join('\n'),
    pendingPlaceholder: false,
  },
} satisfies Story;
