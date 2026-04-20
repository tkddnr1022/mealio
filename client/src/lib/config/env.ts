/**
 * 프론트엔드 런타임·빌드 타임 환경 변수 로드·검증.
 *
 * Next.js는 브라우저에 노출할 값만 `NEXT_PUBLIC_*` 접두어로 빌드 타임에 인라이닝하므로,
 * 본 모듈에서 참조하는 환경 변수는 모두 `NEXT_PUBLIC_*`이어야 한다.
 *
 * - 외부 의존성을 더하지 않기 위해 Zod 대신 수동 파서를 사용한다.
 * - 모든 값은 모듈 로드 시 한 번만 평가되어 불변 객체 {@link env}로 노출된다.
 * - 각 필드 파싱 실패는 **앱을 크래시시키지 않고** 안전한 기본값으로 대체되며,
 *   {@link env.validationErrors}에 수집된다. 빌드·부팅 단계에서 엄격히 검증하려면
 *   {@link assertEnv}를 명시적으로 호출한다.
 *
 * 값을 소비하는 곳:
 * - API base URL: `client/src/lib/config/api.config.ts`
 * - OAuth Provider 노출 플래그: 로그인 페이지 소셜 로그인 버튼 가시성 제어
 */

import type { OAuthProvider } from '@/lib/types/auth';

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
  /** 로그인 화면에 노출할 OAuth Provider 목록 (순서 유지) */
  readonly enabledOAuthProviders: readonly OAuthProvider[];
  /** Web Vitals·로그 수집 엔드포인트(선택). 비어 있으면 수집을 비활성화한다. */
  readonly observabilityEndpoint: string;
  /**
   * 파싱 중 발견된 검증 오류 목록. production에서는 런타임을 죽이지 않기 위해 수집만 하고,
   * 호출부에서 {@link assertEnv} 또는 {@link getEnvValidationErrors}로 점검한다.
   */
  readonly validationErrors: readonly EnvValidationError[];
}

const ALL_OAUTH_PROVIDERS: readonly OAuthProvider[] = [
  'google',
  'kakao',
  'naver',
] as const;

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

function readRaw(name: string): string | undefined {
  const value = process.env[name];
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
  if (raw === undefined) return '';

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new EnvValidationError(
      `Invalid NEXT_PUBLIC_API_BASE_URL: "${raw}". 유효한 절대 URL이어야 합니다(예: https://api.example.com).`,
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new EnvValidationError(
      `Invalid NEXT_PUBLIC_API_BASE_URL protocol: "${parsed.protocol}". http(s)만 허용됩니다.`,
    );
  }

  const normalized = parsed.toString();
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

function parseBoolean(name: string, fallback: boolean): boolean {
  const raw = readRaw(name);
  if (raw === undefined) return fallback;
  const lowered = raw.toLowerCase();
  if (lowered === 'true' || lowered === '1') return true;
  if (lowered === 'false' || lowered === '0') return false;
  throw new EnvValidationError(
    `Invalid boolean for ${name}: "${raw}". "true"/"false" 또는 "1"/"0"이어야 합니다.`,
  );
}

function parseEnabledOAuthProviders(): readonly OAuthProvider[] {
  return ALL_OAUTH_PROVIDERS.filter((provider) =>
    parseBoolean(envNameForProvider(provider), true),
  );
}

function envNameForProvider(provider: OAuthProvider): string {
  return `NEXT_PUBLIC_OAUTH_${provider.toUpperCase()}_ENABLED`;
}

function parseObservabilityEndpoint(): string {
  const raw = readRaw('NEXT_PUBLIC_OBSERVABILITY_ENDPOINT');
  if (raw === undefined) return '';
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('protocol');
    }
    return parsed.toString();
  } catch {
    throw new EnvValidationError(
      `Invalid NEXT_PUBLIC_OBSERVABILITY_ENDPOINT: "${raw}". http(s) URL이어야 합니다.`,
    );
  }
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
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[env] ${wrapped.message}`);
    }
    return fallback;
  }
}

function buildEnv(): AppEnv {
  const runtime = parseRuntime();
  const errors: EnvValidationError[] = [];

  const apiBaseUrl = safeParse(parseApiBaseUrl, '', errors);
  const enabledOAuthProviders = safeParse(
    parseEnabledOAuthProviders,
    ALL_OAUTH_PROVIDERS,
    errors,
  );
  const observabilityEndpoint = safeParse(
    parseObservabilityEndpoint,
    '',
    errors,
  );

  return Object.freeze<AppEnv>({
    runtime,
    isProduction: runtime === 'production',
    isDevelopment: runtime === 'development',
    apiBaseUrl,
    enabledOAuthProviders: Object.freeze(enabledOAuthProviders),
    observabilityEndpoint,
    validationErrors: Object.freeze(errors),
  });
}

export const env: AppEnv = buildEnv();

/** OAuth Provider 노출 여부 조회 헬퍼 */
export function isOAuthProviderEnabled(provider: OAuthProvider): boolean {
  return env.enabledOAuthProviders.includes(provider);
}

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
