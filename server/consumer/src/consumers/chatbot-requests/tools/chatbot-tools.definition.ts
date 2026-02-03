import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * OpenAI Function Calling용 tools 배열 (search_recipes 등)
 */
export const CHATBOT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_recipes',
      description:
        '재료·키워드·조리시간 조건으로 레시피를 검색합니다. 사용자가 갖고 있는 재료나 원하는 요리 스타일에 맞는 레시피를 찾을 때 호출하세요.',
      parameters: {
        type: 'object',
        properties: {
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: '검색 키워드 (예: 간단, 저녁, 김치)',
          },
          maxCookTime: {
            type: 'number',
            description: '최대 조리 시간(분). 선택 사항.',
          },
          limit: {
            type: 'number',
            description: '반환할 최대 레시피 수. 기본 5',
          },
        },
        required: ['keywords'],
      },
    },
  },
];
