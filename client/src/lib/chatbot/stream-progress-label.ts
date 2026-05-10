import { CHATBOT_TOOL_CALL_STATUS } from '@/lib/types/chatbot';
import type { ChatbotToolCallStatus } from '@/lib/types/chatbot';

import { getChatbotToolProgressLabel } from './chatbot-tool-progress';

export const GENERATING_REPLY_LABEL = '답변 생성 중…';

export interface StreamProgressLabelToolCall {
  functionName: string;
  status: ChatbotToolCallStatus;
}

export interface StreamProgressLabelInput {
  status: 'idle' | 'streaming' | 'done' | 'error';
  text: string;
  hasReceivedFirstStreamEvent: boolean;
  activeToolCalls: readonly StreamProgressLabelToolCall[];
}

/**
 * 스트리밍 중 assistant 말풍선 placeholder. 본문 텍스트가 있으면 null(실제 텍스트만 표시).
 */
export function getStreamProgressLabel(
  input: StreamProgressLabelInput,
): string | null {
  if (input.status !== 'streaming') return null;
  if (input.text.trim().length > 0) return null;

  if (!input.hasReceivedFirstStreamEvent) {
    return GENERATING_REPLY_LABEL;
  }

  const { activeToolCalls } = input;
  const starting = activeToolCalls.filter(
    (t) => t.status === CHATBOT_TOOL_CALL_STATUS.START,
  );
  if (starting.length > 0) {
    return getChatbotToolProgressLabel(
      starting[starting.length - 1].functionName,
    );
  }

  const completed = activeToolCalls.filter(
    (t) => t.status === CHATBOT_TOOL_CALL_STATUS.COMPLETE,
  );
  if (completed.length > 0) {
    return getChatbotToolProgressLabel(
      completed[completed.length - 1].functionName,
    );
  }

  return GENERATING_REPLY_LABEL;
}
