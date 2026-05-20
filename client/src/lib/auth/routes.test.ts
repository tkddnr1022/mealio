import { describe, expect, it } from 'vitest';

import {
  buildLoginUrl,
  buildSsrRefreshBridgeUrl,
  NEXT_QUERY_PARAM,
  SSR_REFRESH_GUARD_QUERY_PARAM,
  SSR_REFRESH_BRIDGE_PATH,
} from './routes';

describe('auth routes helpers', () => {
  it('buildLoginUrl keeps next parameter', () => {
    expect(buildLoginUrl('/chatbot/list?q=kimchi')).toBe(
      '/login?next=%2Fchatbot%2Flist%3Fq%3Dkimchi',
    );
  });

  it('buildSsrRefreshBridgeUrl includes next and refreshed guard', () => {
    const url = buildSsrRefreshBridgeUrl('/recipe/search?q=egg');
    const parsed = new URL(`https://example.com${url}`);

    expect(parsed.pathname).toBe(SSR_REFRESH_BRIDGE_PATH);
    expect(parsed.searchParams.get(NEXT_QUERY_PARAM)).toBe(
      '/recipe/search?q=egg',
    );
    expect(parsed.searchParams.get(SSR_REFRESH_GUARD_QUERY_PARAM)).toBe('1');
  });
});
