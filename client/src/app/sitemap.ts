import type { MetadataRoute } from 'next';

import { getRecipeStaticIds } from '@/lib/api/domains';
import { fetchForIsr } from '@/lib/api/server';
import { getMetadataBase } from '@/lib/config/app.config';
import { HOME_PATH } from '@/lib/constants/routes.constants';
import { ISR_FETCH_PERIODIC } from '@/lib/policy/cache.policy';
import {
  PUBLIC_SITEMAP_STATIC_PATHS,
  RECIPE_DETAIL_SITEMAP_ENTRY,
  SITEMAP_RECIPE_ID_LIMIT,
  STATIC_SITEMAP_CONFIG,
} from '@/lib/policy/seo.policy';

export const revalidate = 3600;

function toAbsoluteSitemapUrl(path: string): string {
  return new URL(path, getMetadataBase()).href;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap =
    PUBLIC_SITEMAP_STATIC_PATHS.map((path) => ({
      url: toAbsoluteSitemapUrl(path),
      lastModified,
      ...STATIC_SITEMAP_CONFIG[path],
    }));

  let recipeIds: number[] = [];
  try {
    const recipeIdsResult = await fetchForIsr({
      fetcher: () =>
        getRecipeStaticIds(
          { size: SITEMAP_RECIPE_ID_LIMIT },
          ISR_FETCH_PERIODIC,
        ),
      fallback: { data: [] },
    });
    recipeIds = recipeIdsResult.data;
  } catch {
    // API 장애·rate limit 시에도 공개 정적 URL은 sitemap에 남긴다.
    recipeIds = [];
  }

  const recipeEntries: MetadataRoute.Sitemap = recipeIds.map((id) => ({
    url: toAbsoluteSitemapUrl(`${HOME_PATH}/${id}`),
    lastModified,
    ...RECIPE_DETAIL_SITEMAP_ENTRY,
  }));

  return [...staticEntries, ...recipeEntries];
}
