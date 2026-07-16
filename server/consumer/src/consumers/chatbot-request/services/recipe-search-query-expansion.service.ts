import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { parseJson } from 'src/integrations/openai/response-parser';
import { RECIPE_SEARCH_QUERY_EXPANSION_MAX } from '../../../policy/recipe-search.policy';

export interface QueryExpansionInput {
  baseQueryText: string;
  mustHaveIngredients?: string[];
  avoidIngredients?: string[];
}

interface QueryExpansionResponse {
  queries?: string[];
}

@Injectable()
export class RecipeSearchQueryExpansionService {
  private readonly logger = new Logger(RecipeSearchQueryExpansionService.name);

  constructor(private readonly openaiService: OpenAIService) {}

  /**
   * 원질의를 보존하고 의미적으로 다양한 확장 질의를 생성한다.
   * 실패 시 원질의만 반환한다.
   */
  async expandQueries(input: QueryExpansionInput): Promise<string[]> {
    const baseQuery = input.baseQueryText.trim();
    if (baseQuery.length === 0) {
      return [];
    }

    try {
      const completion = await this.openaiService.createResponse(
        [{ role: 'user', content: this.buildExpansionPrompt(input) }],
        {
          instructions: [
            'You expand recipe search queries for semantic retrieval.',
            'Return JSON: {"queries":["..."]}.',
            `Provide up to ${RECIPE_SEARCH_QUERY_EXPANSION_MAX} alternative queries.`,
            'Preserve must-have and avoid ingredient intent from the original query.',
            'Do not include avoid ingredients in expanded queries.',
            'Use Korean when the original query is Korean.',
          ].join(' '),
          maxOutputTokens: 300,
          responseFormat: { type: 'json_object' },
        },
      );

      const content = completion.content?.trim();
      if (!content) {
        return [baseQuery];
      }

      const parsed = parseJson<QueryExpansionResponse>(content);
      const expanded = (parsed.queries ?? [])
        .map((query) => query.trim())
        .filter((query) => query.length > 0 && query !== baseQuery)
        .slice(0, RECIPE_SEARCH_QUERY_EXPANSION_MAX);

      return [baseQuery, ...expanded];
    } catch (error) {
      this.logger.warn(
        `Query expansion failed. fallback to base query only. reason=${(error as Error).message}`,
      );
      return [baseQuery];
    }
  }

  private buildExpansionPrompt(input: QueryExpansionInput): string {
    const sections = [`base_query:\n${input.baseQueryText}`];
    const mustHave = (input.mustHaveIngredients ?? []).filter(
      (value) => value.trim().length > 0,
    );
    const avoid = (input.avoidIngredients ?? []).filter(
      (value) => value.trim().length > 0,
    );

    if (mustHave.length > 0) {
      sections.push(`must_have_ingredients: ${mustHave.join(', ')}`);
    }
    if (avoid.length > 0) {
      sections.push(`avoid_ingredients: ${avoid.join(', ')}`);
    }

    sections.push('Respond in json: {"queries":["..."]}.');

    return sections.join('\n');
  }
}
