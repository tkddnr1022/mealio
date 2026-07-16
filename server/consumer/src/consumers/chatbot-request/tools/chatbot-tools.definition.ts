import type { Tool } from 'openai/resources/responses/responses';

/**
 * Flat tools array for OpenAI Responses API function calling.
 */
export const CHATBOT_TOOLS: Tool[] = [
  {
    type: 'function',
    name: 'get_user_inventory',
    description:
      "Fetches the user's inventory. Response shape: ownedIngredients, favoriteIngredients, favoriteRecipes. Ingredient items include id, name, and ingredient category fields (categoryId, categoryName, categoryKey). favoriteRecipes includes recipe summary info. For ingredient-category filtering, pass categoryId into search_recipes.ingredientCategoryIds.",
    parameters: {
      type: 'object',
      properties: {},
    },
    strict: null,
  },
  {
    type: 'function',
    name: 'get_food_categories',
    description:
      'Fetches id/key/name lists for recipe types (e.g. Korean, Western) and ingredient categories (e.g. vegetables, meat). Call this when the user says something like "한식" and you need numeric ids for search_recipes.recipeCategoryIds / ingredientCategoryIds.',
    parameters: {
      type: 'object',
      properties: {},
    },
    strict: null,
  },
  {
    type: 'function',
    name: 'search_recipes',
    description:
      'Searches recipes by keywords, cook time, servings, and ingredient/category constraints. Pass conditions interpreted from the user request directly as function arguments. Always returns up to 10 candidates; pick final recommendations from this result set. You may combine ingredient ids/categories from get_user_inventory with recipe/ingredient category ids from get_food_categories.',
    parameters: {
      type: 'object',
      properties: {
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Keywords to match against title/description (e.g. 간단, 저녁, 김치). Empty means no keyword filter.',
        },
        ingredientIds: {
          type: 'array',
          items: { type: 'number' },
          description:
            'Boost recipes that overlap more with owned inventory. Use ownedIngredients/favoriteIngredients ids from get_user_inventory.',
        },
        mustHaveIngredients: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Ingredient names that should preferably be included (e.g. 닭가슴살, 두부). Applied to search filters by name.',
        },
        avoidIngredientIds: {
          type: 'array',
          items: { type: 'number' },
          description:
            'Ingredient ids to exclude. Use ownedIngredients/favoriteIngredients ids from get_user_inventory.',
        },
        avoidIngredients: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Ingredient names to exclude (e.g. 우유, 땅콩). Applied to exclusion filters by name.',
        },
        cookTime: {
          type: 'object',
          properties: {
            gte: {
              type: 'number',
              description: 'Minimum cook time in minutes.',
            },
            lte: {
              type: 'number',
              description:
                'Maximum cook time in minutes. Example: "30분 이내" → { "lte": 30 }.',
            },
          },
          description: 'Cook time range in minutes. Use gte/lte for min/max.',
        },
        servings: {
          type: 'object',
          properties: {
            gte: {
              type: 'number',
              description: 'Minimum servings.',
            },
            lte: {
              type: 'number',
              description: 'Maximum servings.',
            },
          },
          description: 'Servings range. Use gte/lte for min/max.',
        },
        recipeCategoryIds: {
          type: 'array',
          items: { type: 'number' },
          description:
            'Limit to recipe types (e.g. Korean). Use recipeCategories ids from get_food_categories.',
        },
        ingredientCategoryIds: {
          type: 'array',
          items: { type: 'number' },
          description:
            'Include only recipes that use these ingredient categories. Use *Ingredients[].categoryId from get_food_categories or get_user_inventory.',
        },
      },
    },
    strict: null,
  },
  {
    type: 'function',
    name: 'finalize_recipe_selection',
    description:
      'Finalizes recommended recipes from search_recipes candidates. Pass only recipe ids that appear in the candidates as selectedRecipeIds. Array order is recommendation priority (earlier = stronger; first = rank 1). When introducing recipes in the final reply, keep this same order.',
    parameters: {
      type: 'object',
      properties: {
        selectedRecipeIds: {
          type: 'array',
          items: { type: 'number' },
          description:
            'Final recommended recipe ids from search_recipes results (preferably 3–5). Array order = recommendation rank (first id = rank 1, last = lowest rank). Arrange in the same order you will present to the user.',
        },
      },
      required: ['selectedRecipeIds'],
    },
    strict: null,
  },
];
