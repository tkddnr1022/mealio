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
        '키워드·조리시간·인분·재료/카테고리 조건으로 레시피를 검색합니다. 사용자 요청에서 해석한 조건은 이 함수 인자에 직접 전달하세요. 항상 최대 10개 후보를 반환하며, 최종 추천 레시피는 이 결과 안에서 직접 고르세요. get_user_inventory로 재료 id·재료 분류를, get_food_categories로 레시피/재료 분류 id를 확인해 조합할 수 있습니다.',
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
          mustHaveIngredients: {
            type: 'array',
            items: { type: 'string' },
            description:
              '반드시 포함되면 좋은 재료 이름 목록(예: 닭가슴살, 두부). 이름 기반으로 검색 필터에 반영.',
          },
          avoidIngredientIds: {
            type: 'array',
            items: { type: 'number' },
            description:
              '제외할 재료 id 목록. get_user_inventory 결과의 ownedIngredients/favoriteIngredients id 목록을 사용.',
          },
          avoidIngredients: {
            type: 'array',
            items: { type: 'string' },
            description:
              '제외할 재료 이름 목록(예: 우유, 땅콩). 이름 기반 제외 필터에 반영.',
          },
          maxCookTime: {
            type: 'number',
            description:
              '최대 조리 시간(분). 예: "30분 이내"는 30.',
          },
          servings: {
            type: 'number',
            description:
              '희망 인분(예: 2). Recipe.servings와 일치하는 레시피만 조회.',
          },
          dietaryTags: {
            type: 'array',
            items: { type: 'string' },
            description:
              '식단/취향 태그(예: 저탄고지, 고단백, 비건). 현재는 검색 랭킹 힌트로 활용.',
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
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'finalize_recipe_selection',
      description:
        'search_recipes 후보 안에서 최종 추천 레시피를 확정합니다. 반드시 후보에 포함된 recipe id만 selectedRecipeIds로 전달하세요.',
      parameters: {
        type: 'object',
        properties: {
          selectedRecipeIds: {
            type: 'array',
            items: { type: 'number' },
            description:
              'search_recipes 결과 중 최종 추천으로 확정한 recipe id 목록(권장 3~5개).',
          },
        },
        required: ['selectedRecipeIds'],
      },
    },
  },
];
