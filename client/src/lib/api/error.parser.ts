/**
 * HTTP 에러 응답 → {@link ApiError} 정규화 모듈.
 *
 * REST `HttpClient`뿐 아니라 SSE·파일 업로드 등 **원시 Response**를 다루는 곳에서도
 * 동일한 방식으로 에러를 해석할 수 있도록 {@link HttpClient}에서 분리해 공용으로 노출한다.
 *
 * 계약:
 * - 서버가 `application/json`으로 `{ message?, code?, details? }` 형태를 보낼 것을 기대.
 * - JSON 파싱 실패·empty body 등은 `response.statusText` 기반 메시지로 폴백한다.
 * - 응답 헤더에 Correlation-Id가 있으면 서버 값을 우선 사용한다.
 */

import type { ApiErrorResponse } from '@/lib/types/api';

import { CORRELATION_ID_HEADER } from './correlation-id';
import { ApiError } from './error';

/**
 * 에러 응답 본문(JSON)을 파싱해 `ApiError`를 만든다.
 * 본문 파싱에 실패하면 `statusText` 기반 메시지로 폴백한다.
 */
export async function parseErrorResponse(
  response: Response,
  fallbackCorrelationId: string,
): Promise<ApiError> {
  const serverCorrelationId =
    response.headers.get(CORRELATION_ID_HEADER) ?? fallbackCorrelationId;

  let message = response.statusText || `HTTP ${response.status}`;
  let code: string | undefined;
  let details: unknown;

  const payload = await readJsonBodySafely(response);
  if (payload && typeof payload === 'object') {
    const p = payload as ApiErrorResponse;
    if (typeof p.message === 'string' && p.message) message = p.message;
    if (typeof p.code === 'string') code = p.code;
    details = payload;
  }

  return new ApiError({
    status: response.status,
    message,
    code,
    details,
    correlationId: serverCorrelationId,
  });
}

async function readJsonBodySafely(response: Response): Promise<unknown> {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) return undefined;
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}
