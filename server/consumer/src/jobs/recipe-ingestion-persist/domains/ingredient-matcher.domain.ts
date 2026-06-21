import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@mealio/shared/prisma-client';
import type { RetrievedIngredientPayload } from '../validators/retrieved-data.validator';
import { CategoryResolverService } from './category-resolver.domain';

export type IngredientMatchMethod = 'alias' | 'exact' | 'new';

export interface IngredientMatchResult {
  ingredientId: number;
  matchMethod: IngredientMatchMethod;
}

/**
 * 재료 매칭 MVP — alias exact → normalized exact → 신규 생성
 */
@Injectable()
export class IngredientMatcherService {
  private readonly logger = new Logger(IngredientMatcherService.name);

  constructor(private readonly categoryResolver: CategoryResolverService) {}

  async match(
    tx: Prisma.TransactionClient,
    ingredient: RetrievedIngredientPayload,
  ): Promise<IngredientMatchResult> {
    const alias = ingredient.ingredientAlias.trim();
    if (alias.length > 0) {
      const byAlias = await tx.ingredient.findFirst({ where: { name: alias } });
      if (byAlias) {
        return { ingredientId: byAlias.id, matchMethod: 'alias' };
      }
    }

    const normalized = ingredient.normalizedName.trim();
    if (normalized.length > 0) {
      const byNormalized = await tx.ingredient.findFirst({
        where: { name: normalized },
      });
      if (byNormalized) {
        return { ingredientId: byNormalized.id, matchMethod: 'exact' };
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

    const created = await tx.ingredient.create({
      data: { name, categoryId },
    });

    this.logger.log(
      `Created ingredient id=${created.id} name="${name}" matchMethod=new`,
    );

    return { ingredientId: created.id, matchMethod: 'new' };
  }
}
