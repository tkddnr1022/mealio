import { ApiError, isApiError } from '@/lib/api/error';
import { reportApiErrorToSentry } from '@/lib/observability/api-error-sentry';

import { enqueueToast } from './toast-bridge';
import type { ToastActionSpec, ToastVariant } from './toast.types';

/** 동일 메시지·키의 연속 노출을 막는 최소 간격(ms) */
const NOTIFY_DEDUPE_MS = 2500;

const recentNotifyAt = new Map<string, number>();

function pruneRecent(now: number): void {
  for (const [k, t] of recentNotifyAt) {
    if (now - t > NOTIFY_DEDUPE_MS) recentNotifyAt.delete(k);
  }
}

function inferVariant(api: ApiError): ToastVariant {
  if (api.status === 401) return 'info';
  if (api.status === 403 || api.status === 409 || api.status === 429) {
    return 'warning';
  }
  return 'error';
}

function inferTitle(api: ApiError): string {
  if (api.status === 0) return '네트워크 오류';
  if (api.status >= 500) return '서버에 문제가 있어요';
  if (api.status === 401) return '로그인이 필요해요';
  return '요청을 처리하지 못했어요';
}

export interface NotifyApiErrorOptions {
  title?: string;
  /** 비우면 {@link ApiError.getUserMessage} */
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
  /** 비우면 상태·코드·사용자 메시지 기반 키 */
  dedupeKey?: string;
  action?: ToastActionSpec;
  /** true면 시간 기반 중복 억제를 건너뜀 */
  skipDedupe?: boolean;
}

/**
 * `ApiError`(또는 unknown → {@link ApiError.fromUnknown})를 전역 Toast로 보낸다.
 * Provider가 아직 없으면 `null`을 반환한다.
 */
export function notifyApiError(
  error: unknown,
  options?: NotifyApiErrorOptions,
): string | null {
  const api = isApiError(error) ? error : ApiError.fromUnknown(error);
  reportApiErrorToSentry(api);

  const dedupeKey =
    options?.dedupeKey ??
    `api:${api.status}:${api.code ?? ''}:${api.getUserMessage()}`;

  if (!options?.skipDedupe) {
    const now = Date.now();
    pruneRecent(now);
    const last = recentNotifyAt.get(dedupeKey);
    if (last !== undefined && now - last < NOTIFY_DEDUPE_MS) {
      return null;
    }
    recentNotifyAt.set(dedupeKey, now);
  }

  return enqueueToast({
    variant: options?.variant ?? inferVariant(api),
    title: options?.title ?? inferTitle(api),
    message: options?.message ?? api.getUserMessage(),
    durationMs: options?.durationMs,
    dedupeKey,
    action: options?.action,
  });
}

/** Vitest 등에서 모듈 상태를 초기화할 때만 사용한다. */
export function clearNotifyApiErrorDedupeForTests(): void {
  recentNotifyAt.clear();
}
