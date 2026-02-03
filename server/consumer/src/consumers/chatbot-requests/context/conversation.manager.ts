import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const SYSTEM_MESSAGE = `당신은 요리·레시피 추천 챗봇입니다.
사용자의 재료·선호에 맞춰 레시피를 검색(search_recipes)할 수 있습니다.

- 검색 결과가 있으면 자연어로만 요약·추천해 주세요. (예: 요리명, 요약 한 줄, 조리시간, 난이도, 추천 포인트 등)`;

export interface PreviousTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * 대화 히스토리 + 새 사용자 메시지로 GPT용 메시지 배열 구성
 */
export function buildMessagesForGpt(
  previousTurns: PreviousTurn[],
  newUserMessage: string,
): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_MESSAGE },
  ];

  for (const turn of previousTurns) {
    if (turn.role === 'user') {
      messages.push({ role: 'user', content: turn.content });
    } else if (turn.role === 'assistant') {
      messages.push({ role: 'assistant', content: turn.content });
    }
    // system은 맨 앞만 사용
  }

  messages.push({ role: 'user', content: newUserMessage });
  return messages;
}
