import { Injectable } from '@nestjs/common';
import { SearchRecipesHandler } from '../handlers/SearchRecipesHandler';
import type { SearchRecipesContext } from '../handlers/SearchRecipesHandler';

export interface ToolContext {
  userIngredientIds: number[];
  favoriteIngredientIds: number[];
}

/**
 * function name → Handler 매핑·실행, tool result를 GPT에 반환
 */
@Injectable()
export class ToolDispatcher {
  constructor(
    private readonly searchRecipesHandler: SearchRecipesHandler,
  ) {}

  async execute(
    functionName: string,
    args: Record<string, unknown>,
    context: ToolContext,
  ): Promise<string> {
    switch (functionName) {
      case 'search_recipes': {
        const payload = {
          keywords: Array.isArray(args.keywords)
            ? (args.keywords as string[])
            : [],
          maxCookTime:
            typeof args.maxCookTime === 'number'
              ? args.maxCookTime
              : undefined,
          limit:
            typeof args.limit === 'number' ? args.limit : undefined,
        };
        const ctx: SearchRecipesContext = {
          userIngredientIds: context.userIngredientIds ?? [],
          favoriteIngredientIds: context.favoriteIngredientIds ?? [],
        };
        const result =
          await this.searchRecipesHandler.execute(payload, ctx);
        return JSON.stringify(result);
      }
      default:
        return JSON.stringify({
          error: `Unknown function: ${functionName}`,
        });
    }
  }
}
