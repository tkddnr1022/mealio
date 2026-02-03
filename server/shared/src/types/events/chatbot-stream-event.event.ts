/**
 * 챗봇 SSE 스트림 이벤트 타입
 * Consumer가 Redis 채널로 발행하는 메시지 형식 (Producer가 구독하여 클라이언트로 SSE 전달)
 */

export interface ChatbotStreamChunkEvent {
  type: 'chunk';
  data: string;
}

/** done 이벤트의 suggestedRecipes: RecipeMatchResult[] (기본 레시피 정보 + matchContext) */
export interface ChatbotStreamDoneEvent {
  type: 'done';
  data: {
    conversationId: string;
    suggestedRecipes?: Array<{
      id: number;
      title: string;
      description?: string;
      difficulty?: number;
      cookTime?: number;
      imageUrl?: string | null;
      servings?: number;
      viewCount?: number;
      isPublished?: boolean;
      createdAt?: string;
      matchContext?: {
        matchScore: number;
        ingredientMatch: {
          matchedIngredients: unknown[];
          missingIngredients: unknown[];
          missingOptionalIngredients: unknown[];
          stats: {
            totalRequired: number;
            matchedRequired: number;
            totalOptional: number;
            matchedOptional: number;
          };
        };
        usesFavoriteIngredients: boolean;
        favoriteIngredientsUsed: string[];
      };
    }>;
  };
}

export interface ChatbotStreamErrorEvent {
  type: 'error';
  data: { message: string };
}

/** Function Calling 실행 중 클라이언트 피드백용 (예: "레시피 검색 중…") */
export interface ChatbotStreamToolCallEvent {
  type: 'tool_call';
  data: {
    functionName: string;
    status: 'start' | 'complete';
    arguments?: string;
  };
}

export type ChatbotStreamEvent =
  | ChatbotStreamChunkEvent
  | ChatbotStreamDoneEvent
  | ChatbotStreamErrorEvent
  | ChatbotStreamToolCallEvent;
