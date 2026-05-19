/**
 * OpenAI Function `name` 값 — 서버 `chatbot-tools.definition.ts`의 `CHATBOT_TOOLS[].function.name`과 동기화할 것.
 */
export const CHATBOT_TOOL_FUNCTION_NAME = {
  FINALIZE_RECIPE_SELECTION: 'finalize_recipe_selection',
  SEARCH_RECIPES: 'search_recipes',
  GET_USER_INVENTORY: 'get_user_inventory',
  GET_FOOD_CATEGORIES: 'get_food_categories',
} as const;

export type ChatbotToolFunctionName =
  (typeof CHATBOT_TOOL_FUNCTION_NAME)[keyof typeof CHATBOT_TOOL_FUNCTION_NAME];

const TOOL_PROGRESS_LABELS: Record<ChatbotToolFunctionName, string> = {
  [CHATBOT_TOOL_FUNCTION_NAME.FINALIZE_RECIPE_SELECTION]:
    '추천 레시피 선정 중…',
  [CHATBOT_TOOL_FUNCTION_NAME.SEARCH_RECIPES]: '레시피 검색 중…',
  [CHATBOT_TOOL_FUNCTION_NAME.GET_USER_INVENTORY]: '재료 목록 불러오는 중…',
  [CHATBOT_TOOL_FUNCTION_NAME.GET_FOOD_CATEGORIES]: '카테고리 불러오는 중…',
};

const KNOWN_NAMES = new Set<string>(Object.values(CHATBOT_TOOL_FUNCTION_NAME));

export function getChatbotToolProgressLabel(functionName: string): string {
  if (KNOWN_NAMES.has(functionName)) {
    return TOOL_PROGRESS_LABELS[functionName as ChatbotToolFunctionName];
  }
  return '처리 중…';
}
