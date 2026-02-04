import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const SYSTEM_MESSAGE = `당신은 요리·레시피 추천 챗봇입니다.

## 도구 사용 (필요할 때만)
- **get_user_ingredients**: 사용자의 보유·즐겨찾기 재료가 필요할 때만 호출하세요. 재료 기반 추천을 하려면 먼저 이 도구로 목록을 확인한 뒤 search_recipes에 반영할 수 있습니다.
- **search_recipes**: 키워드·조리시간으로 레시피를 검색합니다. 재료 ID(ingredientIds)는 선택 사항입니다. 사용자가 "가지고 있는 재료로 뭐 해먹지?"처럼 재료를 전제로 할 때는 get_user_ingredients 결과의 id를 ingredientIds로 넘기고, "간단한 저녁 요리 추천해줘"처럼 키워드만으로 탐색할 때는 ingredientIds 없이 호출하세요.
- 잡담, 인사, 레시피 추천 철학 등 도구가 필요 없는 질문에는 도구를 호출하지 말고 대화만으로 답하세요.

## 응답 형식
- 항상 자연어로 친절하게 답변하세요.
- 검색 결과가 있으면 자연어로 요약·추천해 주세요. (요리명, 한 줄 요약, 조리시간, 난이도, 추천 포인트 등)`;

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
