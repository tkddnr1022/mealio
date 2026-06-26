import { Injectable, Logger } from '@nestjs/common';
import { INGREDIENT_VECTOR_MATCH_THRESHOLD } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';
import {
  logIngestion,
  RECIPE_INGESTION_LOG_EVENTS,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-logger';
import type { RetrievedIngredientPayload } from '../validators/retrieved-data.validator';
import { CategoryResolverService } from './category-resolver.domain';
import { IngredientEmbeddingRepository } from 'src/persistence/repositories/postgresql/ingredient-embedding.repository';
import { IngredientRepository } from 'src/persistence/repositories/postgresql/ingredient.repository';

export type IngredientMatchMethod = 'alias' | 'exact' | 'vector' | 'new';

export interface IngredientMatchResult {
  ingredientId: number;
  matchMethod: IngredientMatchMethod;
}

/**
 * 재료 매칭 — alias → exact → vector → 신규 생성
 */
@Injectable()
export class IngredientMatcherService {
  private readonly logger = new Logger(IngredientMatcherService.name);

  constructor(
    private readonly categoryResolver: CategoryResolverService,
    private readonly ingredientRepository: IngredientRepository,
    private readonly ingredientEmbeddingRepository: IngredientEmbeddingRepository,
  ) {}

  async match(
    tx: Prisma.TransactionClient,
    ingredient: RetrievedIngredientPayload,
    queryEmbedding?: number[],
    correlationId?: string,
  ): Promise<IngredientMatchResult> {
    const alias = ingredient.ingredientAlias.trim();
    if (alias.length > 0) {
      const byAlias = await this.ingredientRepository.findFirstByNameInTx(
        tx,
        alias,
      );
      if (byAlias) {
        return { ingredientId: byAlias.id, matchMethod: 'alias' };
      }
    }

    const normalized = ingredient.normalizedName.trim();
    if (normalized.length > 0) {
      const byNormalized = await this.ingredientRepository.findFirstByNameInTx(
        tx,
        normalized,
      );
      if (byNormalized) {
        return { ingredientId: byNormalized.id, matchMethod: 'exact' };
      }
    }

    if (Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
      const vectorThreshold = Number(INGREDIENT_VECTOR_MATCH_THRESHOLD);
      const vectorMatches = await this.ingredientEmbeddingRepository.searchTopK(
        tx,
        queryEmbedding,
        1,
        vectorThreshold,
      );
      const topMatch = vectorMatches[0];
      if (topMatch) {
        return { ingredientId: topMatch.ingredientId, matchMethod: 'vector' };
      }
    }

    const categoryId = await this.categoryResolver.resolveIngredientCategoryId(
      tx,
      ingredient.categoryId,
      ingredient.proposedCategory,
    );

    const name =
      alias.length > 0
        ? alias
        : normalized.length > 0
          ? normalized
          : ingredient.rawName.trim();

    const created = await this.ingredientRepository.createInTx(tx, {
      name,
      categoryId,
    });

    logIngestion(this.logger, 'debug', {
      event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
      stage: 'persist',
      correlationId,
      count: 1,
      ingredientId: created.id,
      matchMethod: 'new',
      message: 'Created new ingredient',
    });

    return { ingredientId: created.id, matchMethod: 'new' };
  }
}
