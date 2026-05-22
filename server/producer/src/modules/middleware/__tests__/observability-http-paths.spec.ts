import {
  getHttpRequestPathname,
  isExcludedFromAppHttpObservability,
  shouldExcludeRequestFromAppHttpObservability,
} from '../observability-http-paths';

describe('observability-http-paths', () => {
  it('getHttpRequestPathname should prefer originalUrl over path', () => {
    expect(
      getHttpRequestPathname({
        path: '/',
        originalUrl: '/metrics',
        url: '/metrics',
      }),
    ).toBe('/metrics');
  });

  it('shouldExcludeRequestFromAppHttpObservability when path is / but originalUrl is /metrics', () => {
    expect(
      shouldExcludeRequestFromAppHttpObservability({
        path: '/',
        originalUrl: '/metrics',
        url: '/metrics',
      }),
    ).toBe(true);
  });

  it('isExcludedFromAppHttpObservability should match /metrics only', () => {
    expect(isExcludedFromAppHttpObservability('/metrics')).toBe(true);
    expect(isExcludedFromAppHttpObservability('/api/v1/recipes')).toBe(false);
    expect(isExcludedFromAppHttpObservability('/')).toBe(false);
  });
});
