import { describe, expect, it } from 'vitest';

import {
  buildLoginUrl,
  buildSsrRefreshBridgeUrl,
  DEFAULT_POST_LOGIN_PATH,
  NEXT_QUERY_PARAM,
  resolveSafeNextPath,
  SESSION_EXPIRED_QUERY_PARAM,
  SSR_REFRESH_GUARD_QUERY_PARAM,
  SSR_REFRESH_BRIDGE_PATH,
} from './routes';

describe('auth routes helpers', () => {
  it('buildLoginUrl keeps next parameter', () => {
    expect(buildLoginUrl('/chatbot/list?q=kimchi')).toBe(
      '/login?next=%2Fchatbot%2Flist%3Fq%3Dkimchi',
    );
  });

  it('buildLoginUrl adds sessionExpired=1 when session expired', () => {
    expect(buildLoginUrl('/mypage', true)).toBe(
      `/login?${SESSION_EXPIRED_QUERY_PARAM}=1&next=%2Fmypage`,
    );
  });

  it('resolveSafeNextPath rejects unsafe paths', () => {
    expect(resolveSafeNextPath('/mypage')).toBe('/mypage');
    expect(resolveSafeNextPath('//evil')).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(resolveSafeNextPath(null)).toBe(DEFAULT_POST_LOGIN_PATH);
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
