import type { MetadataRoute } from 'next';

import { getMetadataBase } from '@/lib/config/app.config';
import { env } from '@/lib/config/env';
import { ROBOTS_DISALLOW_PATH_PREFIXES } from '@/lib/policy/seo.policy';

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = new URL('/sitemap.xml', getMetadataBase()).href;

  if (!env.isProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
      sitemap: sitemapUrl,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...ROBOTS_DISALLOW_PATH_PREFIXES],
    },
    sitemap: sitemapUrl,
  };
}
