import 'server-only';

import { CORRELATION_ID_HEADER } from '@/lib/api/correlation-id';
import type { RequestOptions } from '@/lib/api/http-client';

import {
  buildForwardCookieHeader,
  getInboundAcceptLanguage,
  getInboundCorrelationId,
} from './forward-headers';

/**
 * 어떤 SSR 헤더를 백엔드로 전파할지 선택하는 키.
 * - `cookie`: 들어오는 요청의 모든 쿠키 → 백엔드로 그대로 전달 (JWT 등)
 * - `correlationId`: 들어오는 `X-Correlation-Id` 유지 (분산 추적 일관성)
 * - `acceptLanguage`: 들어오는 `Accept-Language` 유지 (i18n)
 */
export type ForwardKind = 'cookie' | 'correlationId' | 'acceptLanguage';

const DEFAULT_FORWARDS: readonly ForwardKind[] = ['cookie', 'correlationId'];

/**
 * SSR 시점에 백엔드 호출용 `RequestOptions`를 만들어 반환한다.
 *
 * - 도메인 API 함수(`searchRecipes`, `getMyProfile` 등) 모두에 그대로 사용 가능.
 * - 호출자가 명시적으로 지정한 헤더는 항상 우선한다(덮어쓰지 않음).
 * - 쿠키가 없거나 헤더가 없으면 해당 항목은 추가하지 않는다(익명 요청 가능).
 *
 * @example
 * ```ts
 * const result = await searchRecipes(query, await withForwardedHeaders());
 * ```
 *
 * @example 헤더 조합을 좁히고 싶을 때
 * ```ts
 * const me = await getMyProfile(await withForwardedHeaders(undefined, ['cookie']));
 * ```
 */
export async function withForwardedHeaders<T extends RequestOptions>(
  options?: T,
  forward: readonly ForwardKind[] = DEFAULT_FORWARDS,
): Promise<T> {
  const merged = new Headers(options?.headers);

  if (forward.includes('cookie') && !merged.has('Cookie')) {
    const cookieHeader = await buildForwardCookieHeader();
    if (cookieHeader) merged.set('Cookie', cookieHeader);
  }

  if (forward.includes('correlationId') && !merged.has(CORRELATION_ID_HEADER)) {
    const correlationId = await getInboundCorrelationId();
    if (correlationId) merged.set(CORRELATION_ID_HEADER, correlationId);
  }

  if (forward.includes('acceptLanguage') && !merged.has('Accept-Language')) {
    const lang = await getInboundAcceptLanguage();
    if (lang) merged.set('Accept-Language', lang);
  }

  return { ...(options ?? ({} as T)), headers: merged };
}
