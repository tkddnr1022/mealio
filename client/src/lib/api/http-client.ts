import { env } from '@/lib/config/env';
import {
  API_REQUEST_TIMEOUT_MS,
  API_RETRY_POLICY,
  type ApiRetryPolicy,
} from '@/lib/config/api.config';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

import {
  CORRELATION_ID_HEADER,
  defaultCorrelationIdGenerator,
} from './correlation-id';
import { ApiError } from './error';
import { parseErrorResponse } from './error.parser';
import { buildQueryString, type Query } from './query';

/**
 * 백엔드 REST/SSE API를 호출하는 fetch 래퍼.
 *
 * - `credentials: 'include'`로 JWT HttpOnly 쿠키를 자동 포함한다.
 * - 기본 `Content-Type: application/json`, JSON 본문 자동 직렬화/역직렬화.
 * - 모든 요청에 분산 추적용 `X-Correlation-Id` 헤더를 부여한다(외부에서 지정 가능).
 * - 비 2xx 응답·네트워크 오류는 {@link ApiError}로 정규화되어 throw된다.
 * - SSE·스트리밍처럼 원시 Response가 필요한 경우 {@link HttpClient.raw}를 사용한다.
 *
 * 교차 관심사는 **인터셉터**로 처리한다:
 * - `requestInterceptors`: 요청 URL·헤더·본문을 변경·관찰 (인증 헤더 주입, 로깅 등)
 * - `responseInterceptors`: 응답을 관찰·변형 (성공 응답 로깅, 캐시 write-through 등)
 * 인터셉터는 선언 순서대로 실행되며, 실패 시 `ApiError`로 던진다.
 *
 * 안정성 정책(`@/lib/config/api.config`):
 * - `timeoutMs`: 단일 시도의 타임아웃. 기본 {@link API_REQUEST_TIMEOUT_MS}.
 * - `retry`: GET에 한해 idempotent 정책({@link API_RETRY_POLICY})을 기본 적용.
 *   비-GET(POST/PUT/PATCH/DELETE)은 기본 off — 부작용 이중 실행 방지.
 *
 * base URL은 `@/lib/config/env`의 `env.apiBaseUrl`을 단일 원천으로 사용한다.
 * 설정되지 않은 경우 빈 문자열(same-origin, 예: Next.js 리라이트·로컬 개발)을 사용한다.
 *
 * 의존성 주입:
 * - 앱 전역 기본 인스턴스 `httpClient`를 노출한다.
 * - 테스트·스코프 분리가 필요하면 {@link createHttpClient}로 새 인스턴스를 만든다.
 */

export type { Query, QueryValue } from './query';

export interface RequestContext {
  readonly method: HttpMethod;
  readonly url: string;
  readonly path: string;
  readonly headers: Headers;
  readonly body: BodyInit | undefined;
  readonly correlationId: string;
  readonly attempt: number;
  readonly signal: AbortSignal | undefined;
}

export type RequestInterceptor = (
  ctx: RequestContext,
) => RequestContext | Promise<RequestContext>;

export type ResponseInterceptor = (
  response: Response,
  ctx: RequestContext,
) => Response | Promise<Response>;

export interface RequestOptions {
  query?: Query;
  headers?: HeadersInit;
  signal?: AbortSignal;
  /** 명시적으로 Correlation-Id를 지정하고 싶을 때 사용 */
  correlationId?: string;
  /** 단일 시도 타임아웃(ms). 0 또는 Infinity면 타임아웃 없음. 기본값은 클라이언트 설정. */
  timeoutMs?: number;
  /**
   * 재시도 정책 오버라이드.
   * - `false`: 재시도 비활성화
   * - `Partial<ApiRetryPolicy>`: 정책 필드 단위 덮어쓰기
   * - 미지정: GET만 기본 정책 적용, 그 외 메서드는 off
   */
  retry?: false | Partial<ApiRetryPolicy>;
}

export interface HttpClientConfig {
  baseUrl?: string;
  /** 요청별 Correlation-Id 생성기. 기본값: crypto.randomUUID */
  generateCorrelationId?: () => string;
  /** 기본 타임아웃(ms). 요청별 `timeoutMs`로 덮어쓸 수 있다. */
  defaultTimeoutMs?: number;
  /** 기본 재시도 정책. 요청별 `retry`로 덮어쓸 수 있다. */
  defaultRetryPolicy?: ApiRetryPolicy;
  /** 요청 인터셉터 체인 (선언 순서대로 실행) */
  requestInterceptors?: readonly RequestInterceptor[];
  /** 응답 인터셉터 체인 (선언 순서대로 실행) */
  responseInterceptors?: readonly ResponseInterceptor[];
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const IDEMPOTENT_METHODS: ReadonlySet<HttpMethod> = new Set(['GET']);

export class HttpClient {
  private readonly baseUrl: string;
  private readonly generateCorrelationId: () => string;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryPolicy: ApiRetryPolicy;
  private readonly requestInterceptors: RequestInterceptor[];
  private readonly responseInterceptors: ResponseInterceptor[];
  private refreshInFlight: Promise<boolean> | null = null;

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = stripTrailingSlash(config.baseUrl ?? env.apiBaseUrl);
    this.generateCorrelationId =
      config.generateCorrelationId ?? defaultCorrelationIdGenerator;
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? API_REQUEST_TIMEOUT_MS;
    this.defaultRetryPolicy = config.defaultRetryPolicy ?? API_RETRY_POLICY;
    this.requestInterceptors = [...(config.requestInterceptors ?? [])];
    this.responseInterceptors = [...(config.responseInterceptors ?? [])];
  }

  /** 런타임에 인터셉터를 추가한다. 초기화 이후 분석/계측 훅 주입용. */
  useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  /**
   * 원시 Response를 반환하는 저수준 API. SSE/스트리밍·파일 다운로드 등에 사용.
   * 인터셉터·재시도·타임아웃은 적용되지 않는다(호출부가 직접 관리).
   */
  async raw(
    method: HttpMethod,
    path: string,
    init?: Omit<RequestInit, 'method'> & { query?: Query },
  ): Promise<Response> {
    const url = this.buildUrl(path, init?.query);
    const headers = new Headers(init?.headers);
    if (!headers.has(CORRELATION_ID_HEADER)) {
      headers.set(CORRELATION_ID_HEADER, this.generateCorrelationId());
    }
    try {
      return await fetch(url, {
        ...init,
        method,
        headers,
        credentials: init?.credentials ?? 'include',
      });
    } catch (error) {
      throw ApiError.fromUnknown(
        error,
        headers.get(CORRELATION_ID_HEADER) ?? undefined,
      );
    }
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const correlationId = options.correlationId ?? this.generateCorrelationId();
    const url = this.buildUrl(path, options.query);

    const headers = new Headers(options.headers);
    headers.set(CORRELATION_ID_HEADER, correlationId);
    headers.set('Accept', headers.get('Accept') ?? 'application/json');

    let serializedBody: BodyInit | undefined;
    if (body !== undefined && body !== null) {
      if (isBodyInit(body)) {
        serializedBody = body;
      } else {
        serializedBody = JSON.stringify(body);
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
      }
    }

    const retryPolicy = this.resolveRetryPolicy(method, options.retry);
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const maxAttempts = retryPolicy?.maxAttempts ?? 1;
    let refreshTried = false;

    let lastError: ApiError | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.executeAttempt({
          method,
          url,
          path,
          headers,
          body: serializedBody,
          correlationId,
          attempt,
          signal: options.signal,
          timeoutMs,
        });

        if (!response.ok) {
          if (
            this.shouldAttemptTokenRefresh(path, response.status, refreshTried)
          ) {
            refreshTried = true;
            const refreshed = await this.refreshAccessTokenWithLock();
            if (refreshed) {
              attempt -= 1;
              continue;
            }
          }
          const apiError = await parseErrorResponse(response, correlationId);
          if (
            attempt < maxAttempts &&
            retryPolicy &&
            isRetryableStatus(response.status, retryPolicy)
          ) {
            await sleep(computeBackoffMs(retryPolicy, attempt));
            lastError = apiError;
            continue;
          }
          throw apiError;
        }

        return (await parseResponseBody(response)) as T;
      } catch (error) {
        const apiError =
          error instanceof ApiError
            ? error
            : ApiError.fromUnknown(error, correlationId);
        if (
          attempt < maxAttempts &&
          retryPolicy &&
          apiError.status === 0 &&
          !options.signal?.aborted
        ) {
          await sleep(computeBackoffMs(retryPolicy, attempt));
          lastError = apiError;
          continue;
        }
        throw apiError;
      }
    }
    throw lastError ?? new ApiError({ status: 0, message: 'unreachable' });
  }

  private async executeAttempt(args: {
    method: HttpMethod;
    url: string;
    path: string;
    headers: Headers;
    body: BodyInit | undefined;
    correlationId: string;
    attempt: number;
    signal: AbortSignal | undefined;
    timeoutMs: number;
  }): Promise<Response> {
    const ctx = await this.applyRequestInterceptors({
      method: args.method,
      url: args.url,
      path: args.path,
      headers: args.headers,
      body: args.body,
      correlationId: args.correlationId,
      attempt: args.attempt,
      signal: args.signal,
    });

    const composed = composeSignalsWithTimeout(ctx.signal, args.timeoutMs);

    try {
      const response = await fetch(ctx.url, {
        method: ctx.method,
        headers: ctx.headers,
        body: ctx.body,
        credentials: 'include',
        signal: composed.signal,
      });

      return await this.applyResponseInterceptors(response, ctx);
    } catch (error) {
      if (composed.timedOut) {
        throw new ApiError({
          status: 408,
          message: `Request timed out after ${args.timeoutMs}ms`,
          code: 'TIMEOUT',
          correlationId: ctx.correlationId,
        });
      }
      throw ApiError.fromUnknown(error, ctx.correlationId);
    } finally {
      composed.dispose();
    }
  }

  private async applyRequestInterceptors(
    initial: RequestContext,
  ): Promise<RequestContext> {
    let ctx = initial;
    for (const interceptor of this.requestInterceptors) {
      ctx = await interceptor(ctx);
    }
    return ctx;
  }

  private async applyResponseInterceptors(
    initial: Response,
    ctx: RequestContext,
  ): Promise<Response> {
    let response = initial;
    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response, ctx);
    }
    return response;
  }

  private resolveRetryPolicy(
    method: HttpMethod,
    override: RequestOptions['retry'],
  ): ApiRetryPolicy | null {
    if (override === false) return null;
    if (override) return { ...this.defaultRetryPolicy, ...override };
    return IDEMPOTENT_METHODS.has(method) ? this.defaultRetryPolicy : null;
  }

  private buildUrl(path: string, query?: Query): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const base = `${this.baseUrl}${normalizedPath}`;
    const qs = buildQueryString(query);
    return qs ? `${base}?${qs}` : base;
  }

  private shouldAttemptTokenRefresh(
    path: string,
    status: number,
    refreshTried: boolean,
  ): boolean {
    if (typeof window === 'undefined') return false;
    if (status !== 401) return false;
    if (refreshTried) return false;
    return path !== API_ENDPOINTS.auth.refresh;
  }

  private async refreshAccessTokenWithLock(): Promise<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = this.doRefreshAccessToken().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async doRefreshAccessToken(): Promise<boolean> {
    try {
      const response = await this.raw('POST', API_ENDPOINTS.auth.refresh);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * 테스트·스코프 분리용 팩토리. 기본 동작은 `new HttpClient(config)`와 동일하다.
 * 앱 전역에서는 기본 인스턴스 {@link httpClient}를 사용한다.
 */
export function createHttpClient(config: HttpClientConfig = {}): HttpClient {
  return new HttpClient(config);
}

export const httpClient: HttpClient = createHttpClient();

// ─── 내부 유틸 ─────────────────────────────────────────────────────────────────

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === 'string' ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value as ArrayBufferView) ||
    (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream)
  );
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    const text = await response.text();
    return text ? JSON.parse(text) : undefined;
  }
  if (contentType.startsWith('text/')) {
    return response.text();
  }
  return response.blob();
}

function isRetryableStatus(status: number, policy: ApiRetryPolicy): boolean {
  return (policy.retryableStatuses as readonly number[]).includes(status);
}

function computeBackoffMs(policy: ApiRetryPolicy, attempt: number): number {
  const exp = policy.baseDelayMs * 2 ** (attempt - 1);
  const capped = Math.min(policy.maxDelayMs, exp);
  const jitter = Math.random() * policy.jitterMs;
  return Math.floor(capped + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ComposedSignal {
  signal: AbortSignal;
  /** timeout으로 인해 abort되었는지 여부. finally에서 확인해 에러 분기 처리에 사용한다. */
  readonly timedOut: boolean;
  dispose(): void;
}

/**
 * 호출자의 signal과 timeout을 결합한 AbortSignal을 만든다.
 * 둘 중 하나라도 abort되면 결과 signal이 abort된다.
 * - timeoutMs ≤ 0 또는 Infinity면 timeout을 적용하지 않는다.
 * - 호출자의 signal이 없으면 timeout-only.
 */
function composeSignalsWithTimeout(
  external: AbortSignal | undefined,
  timeoutMs: number,
): ComposedSignal {
  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => controller.abort(external?.reason);
  if (external) {
    if (external.aborted) {
      controller.abort(external.reason);
    } else {
      external.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  const hasTimeout =
    Number.isFinite(timeoutMs) && timeoutMs > 0 && !controller.signal.aborted;
  if (hasTimeout) {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException('Timeout', 'TimeoutError'));
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    get timedOut() {
      return timedOut;
    },
    dispose() {
      if (timer) clearTimeout(timer);
      if (external) external.removeEventListener('abort', onExternalAbort);
    },
  };
}
