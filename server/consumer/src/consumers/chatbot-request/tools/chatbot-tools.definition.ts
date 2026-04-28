import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * OpenAI Function Calling용 tools 배열 (search_recipes, get_user_inventory 등)
 */
export const CHATBOT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_user_inventory',
      description:
        '사용자의 인벤토리를 조회합니다. 응답 구조는 ownedIngredients, favoriteIngredients, favoriteRecipes 입니다. 재료 항목에는 id, name, 재료 분류(categoryId, categoryName, categoryKey)가 포함되고, favoriteRecipes는 레시피 요약 정보를 포함합니다. 재료 분류 기반 필터링 시 search_recipes의 ingredientCategoryIds에 categoryId를 넣을 수 있습니다.',
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_food_categories',
      description:
        '레시피 종류(한식·양식 등)와 재료 분류(채소·육류 등)의 id·key·name 목록을 조회합니다. 사용자가 "한식"처럼 말할 때 search_recipes의 recipeCategoryIds / ingredientCategoryIds에 쓸 수 있는 숫자 id를 확인할 때 호출하세요.',
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_recipes',
      description:
        '키워드·조리시간·재료 ID·레시피/재료 카테고리로 레시피를 검색합니다. get_user_inventory로 재료 id·재료 분류를, get_food_categories로 레시피/재료 분류 id를 확인한 뒤 조합해 사용할 수 있습니다.',
      parameters: {
        type: 'object',
        properties: {
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description:
              '제목·설명에 매칭할 키워드 (예: 간단, 저녁, 김치). 비우면 키워드 필터 없음.',
          },
          ingredientIds: {
            type: 'array',
            items: { type: 'number' },
            description:
              '보유 인벤토리와 겹치는 재료가 많은 레시피에 가산점. get_user_inventory 결과의 ownedIngredients/favoriteIngredients id 목록을 사용.',
          },
          recipeCategoryIds: {
            type: 'array',
            items: { type: 'number' },
            description:
              '레시피 종류(한식 등)로 한정. get_food_categories의 recipeCategories id.',
          },
          ingredientCategoryIds: {
            type: 'array',
            items: { type: 'number' },
            description:
              '해당 재료 분류를 쓰는 레시피만 포함. get_food_categories 또는 get_user_inventory 결과의 *Ingredients[].categoryId.',
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
      },
    },
  },
];
