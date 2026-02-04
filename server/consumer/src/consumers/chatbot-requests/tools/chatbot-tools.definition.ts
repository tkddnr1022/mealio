import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * OpenAI Function Calling용 tools 배열 (search_recipes, get_user_ingredients 등)
 */
export const CHATBOT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_user_ingredients',
      description:
        '해당 사용자의 보유 재료·즐겨찾기 재료 목록(id, name)을 조회합니다. 사용자 재료 기반 추천이 필요할 때 먼저 호출하세요.',
      parameters: {
        type: 'object',
        properties: {
          userId: {
            type: 'number',
            description: '사용자 ID',
          },
        },
        required: ['userId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_recipes',
      description:
        '키워드·조리시간·선택적 재료 ID로 레시피를 검색합니다. 재료 없이 키워드만으로 탐색할 수도 있고, get_user_ingredients 결과를 활용해 재료 기반 검색도 가능합니다.',
      parameters: {
        type: 'object',
        properties: {
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: '검색 키워드 (예: 간단, 저녁, 김치)',
          },
          ingredientIds: {
            type: 'array',
            items: { type: 'number' },
            description:
              '검색에 반영할 재료 ID 목록. 선택 사항. 없으면 키워드·조리시간만으로 검색합니다.',
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
