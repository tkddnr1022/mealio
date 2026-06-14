import 'server-only';

export interface FetchForIsrOptions<T> {
  fetcher: () => Promise<T>;
  /** CI 프리렌더 fetch 실패 시 반환값. */
  fallback: T;
}

/**
 * ISR 서버 fetch 래퍼 (`page.tsx`·`generateStaticParams` 공통).
 *
 * - CI 빌드(`CI=true`): fallback 반환
 * - 그 외(로컬 빌드·런타임 재검증): throw → 빌드 실패 또는 stale 캐시 유지
 */
export async function fetchForIsr<T>(
  options: FetchForIsrOptions<T>,
): Promise<T> {
  try {
    return await options.fetcher();
  } catch (error) {
    if (process.env.CI === 'true') {
      return options.fallback;
    }

    throw error;
  }
}
