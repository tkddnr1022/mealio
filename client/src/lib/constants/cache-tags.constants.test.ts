import { describe, expect, it } from 'vitest';

import {
  CACHE_TAGS,
  parseRevalidateTags,
  recipeDetailTag,
  recipeMutationRevalidateTags,
} from './cache-tags.constants';

describe('cache-tags.constants', () => {
  it('builds recipe detail tag', () => {
    expect(recipeDetailTag(36)).toBe('recipe:36');
  });

  it('builds recipe mutation tag set', () => {
    expect(recipeMutationRevalidateTags(36)).toEqual([
      CACHE_TAGS.recipes,
      'recipe:36',
      CACHE_TAGS.recipeList,
      CACHE_TAGS.recipeStaticIds,
      CACHE_TAGS.sitemap,
    ]);
  });

  it('parses valid tags and deduplicates', () => {
    expect(parseRevalidateTags(['recipes', ' recipes ', 'recipe:1'])).toEqual([
      'recipes',
      'recipe:1',
    ]);
  });

  it('rejects invalid tags', () => {
    expect(parseRevalidateTags([])).toBeNull();
    expect(parseRevalidateTags(['Bad_Tag'])).toBeNull();
    expect(parseRevalidateTags('recipes')).toBeNull();
  });

  it('accepts known cache tag constants', () => {
    expect(parseRevalidateTags([CACHE_TAGS.recipeList])).toEqual([
      CACHE_TAGS.recipeList,
    ]);
  });
});
