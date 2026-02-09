import { Injectable } from '@nestjs/common';
import { SearchRecipesHandler } from '../handlers/SearchRecipesHandler';
import { UserIngredientsHandler } from '../handlers/UserIngredientsHandler';

export interface ToolContext {
  userId: number;
}

/**
 * function name → Handler 매핑·실행, tool result를 GPT에 반환
 */
@Injectable()
export class ToolDispatcher {
  constructor(
    private readonly searchRecipesHandler: SearchRecipesHandler,
    private readonly userIngredientsHandler: UserIngredientsHandler,
  ) {}

  async execute(
    functionName: string,
    args: Record<string, unknown>,
    context: ToolContext,
  ): Promise<string> {
    switch (functionName) {
      case 'get_user_ingredients': {
        const result = await this.userIngredientsHandler.execute(
          context.userId,
        );
        return JSON.stringify(result);
      }
      case 'search_recipes': {
        const payload = {
          keywords: Array.isArray(args.keywords)
            ? (args.keywords as string[])
            : [],
          ingredientIds: Array.isArray(args.ingredientIds)
            ? (args.ingredientIds as number[])
            : undefined,
          maxCookTime:
            typeof args.maxCookTime === 'number' ? args.maxCookTime : undefined,
          limit: typeof args.limit === 'number' ? args.limit : undefined,
        };
        const result = await this.searchRecipesHandler.execute(payload);
        return JSON.stringify(result);
      }
      default:
        return JSON.stringify({
          error: `Unknown function: ${functionName}`,
        });
    }
  }
}
