import 'server-only';

import { cookies, headers } from 'next/headers';

import { CORRELATION_ID_HEADER } from '@/lib/api/correlation-id';

/**
 * SSR 시점에 들어오는 HTTP 요청에서 백엔드로 그대로 흘려보낼 헤더 빌더 모음.
 *
 * - 도메인 API 함수는 바꾸지 않고, 호출 시 `RequestOptions.headers`에 병합되는
 *   값을 만들어주는 저수준 유틸이다.
 * - `'server-only'`로 잠겨 있어 클라이언트 번들에 포함될 수 없다.
 *
 * 상위에서 자주 쓰는 조합은 `with-forwarded-headers.ts`의
 * `withForwardedHeaders`를 사용한다.
 */

/**
 * 들어오는 요청의 모든 쿠키를 `Cookie` 헤더 문자열로 직렬화한다.
 * 쿠키가 없으면 빈 문자열을 반환한다.
 */
export async function buildForwardCookieHeader(): Promise<string> {
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
}

/**
 * 들어오는 요청의 `X-Correlation-Id`를 그대로 백엔드로 전파하기 위해 읽는다.
 * - 외부에서 추적용 id를 부여하지 않은 경우 `undefined`.
 * - 그대로 다음 호출 옵션에 넣으면 `HttpClient`가 새 id를 생성하지 않고 사용한다.
 */
export async function getInboundCorrelationId(): Promise<string | undefined> {
  const h = await headers();
  return h.get(CORRELATION_ID_HEADER) ?? undefined;
}

/**
 * 들어오는 요청의 `Accept-Language`를 읽는다(선택적 SSR 로케일 전파용).
 */
export async function getInboundAcceptLanguage(): Promise<string | undefined> {
  const h = await headers();
  return h.get('accept-language') ?? undefined;
}
