import { Injectable, Logger } from '@nestjs/common';
import { INGREDIENT_VECTOR_MATCH_THRESHOLD, PrismaService } from '@mealio/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { IngredientEmbeddingRepository } from 'src/persistence/repositories/postgresql/ingredient-embedding.repository';
import { IngredientRepository } from 'src/persistence/repositories/postgresql/ingredient.repository';
import { RECIPE_SEARCH_INGREDIENT_RESOLVE_TOP_K } from '../../../policy/recipe-search.policy';

export interface ResolvedIngredient {
  inputName: string;
  ingredientId: number;
  canonicalName: string;
  score: number;
  matchMethod: 'exact' | 'vector';
}

/**
 * 챗봇 search_recipes 재료명 → Ingredient ID 해상.
 * exact name → IngredientEmbedding ANN 순으로 매칭한다.
 */
@Injectable()
export class IngredientSemanticResolverService {
  private readonly logger = new Logger(IngredientSemanticResolverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
    private readonly ingredientRepository: IngredientRepository,
    private readonly ingredientEmbeddingRepository: IngredientEmbeddingRepository,
  ) {}

  async resolveNames(names: string[]): Promise<ResolvedIngredient[]> {
    const normalizedNames = this.normalizeNames(names);
    if (normalizedNames.length === 0) {
      return [];
    }

    const resolved: ResolvedIngredient[] = [];
    const unresolved: string[] = [];

    for (const name of normalizedNames) {
      const exactMatch = await this.ingredientRepository.findByName(name);
      if (exactMatch) {
        resolved.push({
          inputName: name,
          ingredientId: exactMatch.id,
          canonicalName: exactMatch.name,
          score: 1,
          matchMethod: 'exact',
        });
        continue;
      }
      unresolved.push(name);
    }

    if (unresolved.length === 0) {
      return resolved;
    }

    const embeddings = await this.openaiService.createEmbeddings(unresolved);
    const threshold = Number(INGREDIENT_VECTOR_MATCH_THRESHOLD);

    for (let index = 0; index < unresolved.length; index += 1) {
      const inputName = unresolved[index];
      const queryEmbedding = embeddings[index];
      if (!queryEmbedding || queryEmbedding.length === 0) {
        continue;
      }

      const vectorMatches = await this.ingredientEmbeddingRepository.searchTopK(
        this.prisma,
        queryEmbedding,
        RECIPE_SEARCH_INGREDIENT_RESOLVE_TOP_K,
        threshold,
      );
      const topMatch = vectorMatches[0];
      if (!topMatch) {
        continue;
      }

      const nameRows = await this.ingredientRepository.findManyNamesByIds([
        topMatch.ingredientId,
      ]);
      const canonicalName = nameRows[0]?.name ?? inputName;
      resolved.push({
        inputName,
        ingredientId: topMatch.ingredientId,
        canonicalName,
        score: topMatch.score,
        matchMethod: 'vector',
      });
    }

    this.logger.debug(
      `resolved ingredients input=${normalizedNames.length} matched=${resolved.length}`,
    );

    return resolved;
  }

  private normalizeNames(names: string[]): string[] {
    return [
      ...new Set(names.map((name) => name.trim()).filter((name) => name.length > 0)),
    ];
  }
}
