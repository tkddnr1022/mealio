/**
 * 프론트엔드 런타임·빌드 타임 환경 변수 로드·검증.
 *
 * Next.js는 브라우저에 노출할 값만 `NEXT_PUBLIC_*` 접두어로 빌드 타임에 인라이닝하므로,
 * 본 모듈의 앱 설정값은 `NEXT_PUBLIC_*`를 사용한다(`NODE_ENV`는 런타임 판별용 예외).
 *
 * - 외부 의존성을 더하지 않기 위해 Zod 대신 수동 파서를 사용한다.
 * - 모든 값은 모듈 로드 시 한 번만 평가되어 불변 객체 {@link env}로 노출된다.
 * - 각 필드 파싱 실패는 **앱을 크래시시키지 않고** 안전한 기본값으로 대체되며,
 *   {@link env.validationErrors}에 수집된다. 빌드·부팅 단계에서 엄격히 검증하려면
 *   {@link assertEnv}를 명시적으로 호출한다.
 *
 * 값을 소비하는 곳:
 * - API base URL: `client/src/lib/config/api.config.ts`
 * - 앱 UI 워드마크: `APP_BRAND_NAME` — 네비·로그인 헤더 등
 */
export const APP_BRAND_NAME = 'Mealio' as const;

export type RuntimeEnv = 'development' | 'production' | 'test';

export interface AppEnv {
  /** 현재 실행 환경. `NODE_ENV`에서 파생. */
  readonly runtime: RuntimeEnv;
  /** production 빌드 여부 (편의 플래그) */
  readonly isProduction: boolean;
  /** development 모드 여부 (편의 플래그) */
  readonly isDevelopment: boolean;
  /**
   * 백엔드 API base URL. 비어 있으면 same-origin(`''`)으로 동작한다.
   * 예: `https://api.cook.example.com`
   */
  readonly apiBaseUrl: string;
  /**
   * 백엔드 REST API prefix.
   * 기본값: `/api/v1`
   */
  readonly apiPrefix: string;
  /**
   * 백엔드가 발급하는 JWT HttpOnly 쿠키 이름.
   * 기본값: `accessToken`
   */
  readonly authCookieName: string;
  /** Web Vitals·로그 수집 엔드포인트(선택). 비어 있으면 수집을 비활성화한다. */
  readonly observabilityEndpoint: string;
  /**
   * 파싱 중 발견된 검증 오류 목록. production에서는 런타임을 죽이지 않기 위해 수집만 하고,
   * 호출부에서 {@link assertEnv} 또는 {@link getEnvValidationErrors}로 점검한다.
   */
  readonly validationErrors: readonly EnvValidationError[];
}

const DEFAULTS = {
  apiBaseUrl: '',
  apiPrefix: '/api/v1',
  authCookieName: 'accessToken',
  observabilityEndpoint: '',
} as const;

const RAW_ENV_MAP: Record<string, string | undefined> = {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_API_PREFIX: process.env.NEXT_PUBLIC_API_PREFIX,
  NEXT_PUBLIC_AUTH_COOKIE_NAME: process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME,
  NEXT_PUBLIC_OBSERVABILITY_ENDPOINT:
    process.env.NEXT_PUBLIC_OBSERVABILITY_ENDPOINT,
};

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

function readRaw(name: string): string | undefined {
  // Next.js 클라이언트 번들에서는 `process.env[key]` 같은 동적 접근이 인라이닝되지 않는다.
  // 따라서 PUBLIC env는 정적 참조 맵으로 읽어 서버/클라이언트 값을 일치시킨다.
  const value = RAW_ENV_MAP[name];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parseRuntime(): RuntimeEnv {
  const raw = process.env.NODE_ENV;
  if (raw === 'production' || raw === 'test') return raw;
  return 'development';
}

function parseApiBaseUrl(): string {
  const raw = readRaw('NEXT_PUBLIC_API_BASE_URL');
  return parseHttpUrl('NEXT_PUBLIC_API_BASE_URL', raw, {
    allowEmpty: true,
    trimTrailingSlash: true,
  });
}

function parseApiPrefix(): string {
  const raw = readRaw('NEXT_PUBLIC_API_PREFIX');
  if (raw === undefined) return DEFAULTS.apiPrefix;

  let normalized = raw.trim();
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  if (!/^\/[A-Za-z0-9/_-]*$/.test(normalized)) {
    throw new EnvValidationError(
      `Invalid NEXT_PUBLIC_API_PREFIX: "${raw}". 예: "/api/v1" 형식이어야 합니다.`,
    );
  }

  return normalized;
}

function parseAuthCookieName(): string {
  const raw = readRaw('NEXT_PUBLIC_AUTH_COOKIE_NAME');
  if (raw === undefined) return DEFAULTS.authCookieName;

  if (!/^[A-Za-z0-9._-]+$/.test(raw)) {
    throw new EnvValidationError(
      `Invalid NEXT_PUBLIC_AUTH_COOKIE_NAME: "${raw}". 영문/숫자/.-_만 허용됩니다.`,
    );
  }

  return raw;
}

function parseObservabilityEndpoint(): string {
  const raw = readRaw('NEXT_PUBLIC_OBSERVABILITY_ENDPOINT');
  return parseHttpUrl('NEXT_PUBLIC_OBSERVABILITY_ENDPOINT', raw, {
    allowEmpty: true,
    trimTrailingSlash: false,
  });
}

function parseHttpUrl(
  envName: 'NEXT_PUBLIC_API_BASE_URL' | 'NEXT_PUBLIC_OBSERVABILITY_ENDPOINT',
  raw: string | undefined,
  options: { allowEmpty: boolean; trimTrailingSlash: boolean },
): string {
  if (raw === undefined) {
    if (options.allowEmpty) return '';
    throw new EnvValidationError(`Missing required env: ${envName}`);
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new EnvValidationError(
      `Invalid ${envName}: "${raw}". http(s) URL이어야 합니다.`,
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new EnvValidationError(
      `Invalid ${envName} protocol: "${parsed.protocol}". http(s)만 허용됩니다.`,
    );
  }

  const normalized = parsed.toString();
  if (!options.trimTrailingSlash) return normalized;
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

/**
 * 파서를 안전하게 실행한다.
 * - 성공 시 파싱 결과 반환.
 * - 실패 시 errors 배열에 에러를 추가하고 fallback을 반환한다.
 *   (development/test에서는 추가로 console에 경고를 남겨 빠르게 인지할 수 있도록 한다.)
 */
function safeParse<T>(
  parser: () => T,
  fallback: T,
  errors: EnvValidationError[],
  runtime: RuntimeEnv,
): T {
  try {
    return parser();
  } catch (error) {
    const wrapped =
      error instanceof EnvValidationError
        ? error
        : new EnvValidationError(
            error instanceof Error ? error.message : String(error),
          );
    errors.push(wrapped);
    if (runtime !== 'production') {
      console.warn(`[env] ${wrapped.message}`);
    }
    return fallback;
  }
}

function buildEnv(): AppEnv {
  const runtime = parseRuntime();
  const errors: EnvValidationError[] = [];

  const apiBaseUrl = safeParse(
    parseApiBaseUrl,
    DEFAULTS.apiBaseUrl,
    errors,
    runtime,
  );
  const apiPrefix = safeParse(
    parseApiPrefix,
    DEFAULTS.apiPrefix,
    errors,
    runtime,
  );
  const authCookieName = safeParse(
    parseAuthCookieName,
    DEFAULTS.authCookieName,
    errors,
    runtime,
  );
  const observabilityEndpoint = safeParse(
    parseObservabilityEndpoint,
    DEFAULTS.observabilityEndpoint,
    errors,
    runtime,
  );

  return Object.freeze<AppEnv>({
    runtime,
    isProduction: runtime === 'production',
    isDevelopment: runtime === 'development',
    apiBaseUrl,
    apiPrefix,
    authCookieName,
    observabilityEndpoint,
    validationErrors: Object.freeze(errors),
  });
}

export const env: AppEnv = buildEnv();

/**
 * 수집된 환경 변수 검증 오류 배열을 반환한다.
 * 오류가 없으면 빈 배열.
 */
export function getEnvValidationErrors(): readonly EnvValidationError[] {
  return env.validationErrors;
}

/**
 * 환경 변수 검증 오류가 하나라도 있으면 첫 번째 오류를 throw한다.
 *
 * - 빌드 타임(예: `next build`) 또는 서버 부팅 훅에서 명시적으로 호출해 치명적 설정 누락을 차단한다.
 * - 일반 모듈 로드 경로에서는 호출하지 말 것(런타임 전체가 죽는다).
 */
export function assertEnv(): void {
  if (env.validationErrors.length === 0) return;
  throw env.validationErrors[0];
}
