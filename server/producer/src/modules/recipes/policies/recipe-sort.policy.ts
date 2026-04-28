import { Prisma } from '@cook/shared/prisma-client';

export type RecipeListOrder =
  | 'latest'
  | 'cookTime'
  | 'difficulty'
  | 'viewCount'
  | 'likeCount';

export interface RecipeSortPolicy {
  key: RecipeListOrder;
  orderBy: Prisma.RecipeOrderByWithRelationInput[];
}

const RECIPE_SORT_POLICIES: Record<RecipeListOrder, RecipeSortPolicy> = {
  latest: {
    key: 'latest',
    orderBy: [{ createdAt: 'desc' }, { stats: { viewCount: 'desc' } }, { stats: { likeCount: 'desc' } }, { id: 'desc' }],
  },
  cookTime: {
    key: 'cookTime',
    orderBy: [{ cookTime: 'asc' }, { stats: { viewCount: 'desc' } }, { stats: { likeCount: 'desc' } }, { id: 'desc' }],
  },
  difficulty: {
    key: 'difficulty',
    orderBy: [{ difficulty: 'asc' }, { stats: { viewCount: 'desc' } }, { stats: { likeCount: 'desc' } }, { id: 'desc' }],
  },
  viewCount: {
    key: 'viewCount',
    orderBy: [{ stats: { viewCount: 'desc' } }, { stats: { likeCount: 'desc' } }, { id: 'desc' }],
  },
  likeCount: {
    key: 'likeCount',
    orderBy: [{ stats: { likeCount: 'desc' } }, { stats: { viewCount: 'desc' } }, { id: 'desc' }],
  },
};

export function resolveRecipeSortPolicy(sort?: RecipeListOrder): RecipeSortPolicy {
  return RECIPE_SORT_POLICIES[sort ?? 'latest'];
}

