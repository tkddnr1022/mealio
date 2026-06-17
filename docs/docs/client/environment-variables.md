# 환경 변수

## 이 문서로 해결할 질문

- Next.js client에 필요한 환경 변수는 무엇인가요?
- `NEXT_PUBLIC_*`와 서버 전용 변수는 어떻게 구분되나요?
- API URL·OAuth·ISR·관측성 설정은 어디서 읽나요?

## 개요

Mealio 프론트엔드는 Next.js App Router를 사용합니다. 환경 변수 파일은 호스트용 `client/.env.local`과 Docker용 `client/.env.docker.local`입니다.

```bash
cp client/.env.example client/.env.local
```

기본 포트는 **4000**이며, 검증·파싱은 `client/src/.../env.ts`에서 수행합니다. 파싱 실패는 앱을 즉시 종료하지 않고 `env.validationErrors`에 수집되며, 빌드·부팅 단계에서 `assertEnv()`로 엄격 검증할 수 있습니다.

### 접두어 규칙

| 접두어 | 노출 범위 | 용도 |
| --- | --- | --- |
| `NEXT_PUBLIC_*` | 브라우저 번들에 인라이닝 | API URL, GA, Sentry DSN 등 공개 설정 |
| (접두어 없음) | 서버 런타임만 | `INTERNAL_API_BASE_URL`, `REVALIDATE_SECRET`, `PORT` |
| `VERCEL_*` | Vercel 배포 시 자동 주입 | `VERCEL_URL` → 메타 URL fallback |

## 공통

### `APP_ENV`

| 항목 | 내용 |
| --- | --- |
| 설명 | 실행 환경 판별 (`local`, `development`, `production`, `test`) |
| 기본값 | `local` (미설정·잘못된 값) |
| 사용처 | `client/src/.../env.ts` → `env.runtime`, Sentry `environment` |
| 비고 | `.env.example`에는 없고 Docker 예시(`.env.docker.example`)에 포함됩니다. |

### `PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Next.js 개발·프로덕션 서버 포트 |
| 예시 | `4000` |
| 사용처 | `package.json` 스크립트, Docker Compose |
| 비고 | `env.ts`에서 읽지 않으며 런타임 포트 설정 전용입니다. |

## API 연결

### `NEXT_PUBLIC_API_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | 브라우저·CSR용 백엔드 API base URL |
| 예시 | `https://api.mealio.example.com` |
| 사용처 | `client/src/.../env.ts` → `env.apiBaseUrl`, `resolveApiBaseUrl()`(브라우저) |
| 패턴 | 비우면 same-origin(`''`)으로 동작합니다. |

### `INTERNAL_API_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | SSR·Route Handler 전용 내부 API base URL |
| 예시 | `http://producer:3000` (Docker 서비스 DNS) |
| 사용처 | `client/src/.../env.ts` → `env.internalApiBaseUrl`, `resolveApiBaseUrl()`(서버) |
| 패턴 | 비우면 `NEXT_PUBLIC_API_BASE_URL`로 대체됩니다. |

```text
[브라우저 CSR]  NEXT_PUBLIC_API_BASE_URL
[SSR / BFF]     INTERNAL_API_BASE_URL ?? NEXT_PUBLIC_API_BASE_URL
```

### `NEXT_PUBLIC_API_PREFIX`

| 항목 | 내용 |
| --- | --- |
| 설명 | REST API 경로 prefix |
| 예시 | `/api/v1` |
| 사용처 | `client/src/.../env.ts` → `env.apiPrefix`, `client/src/.../endpoints.ts` |
| 패턴 | 기본값 `/api/v1`. 선행 `/` 필수, 후행 `/`는 제거됩니다. |

## OAuth·ISR (연동)

OAuth **콜백 URL**은 producer의 `OAUTH_CALLBACK_BASE_URL`에서 설정합니다. client는 로그인 후 리다이렉트만 producer가 `FRONTEND_APP_BASE_URL`로 처리합니다.

관련 문서는 [client 인증](./auth), [producer 인증](../producer/auth), [producer 환경 변수](../producer/environment-variables)를 참고하세요.

### `REVALIDATE_SECRET`

| 항목 | 내용 |
| --- | --- |
| 설명 | `POST /api/revalidate` 온디맨드 ISR 시크릿 |
| 예시 | 임의의 긴 랜덤 문자열 |
| 사용처 | `client/src/.../revalidate/route.ts` |
| 패턴 | 요청 본문 `secret`과 timing-safe 비교 후 `revalidatePath`를 호출합니다. |

## 관측성

### `NEXT_PUBLIC_GA_MEASUREMENT_ID`

| 항목 | 내용 |
| --- | --- |
| 설명 | GA4 Measurement ID |
| 예시 | `G-XXXXXXXXXX` |
| 사용처 | `client/src/.../env.ts` → `env.gaMeasurementId` |
| 패턴 | `G-` 접두어 형식을 검증합니다. 비우면 GA를 비활성화합니다. |

### `NEXT_PUBLIC_SENTRY_ENABLED` / `NEXT_PUBLIC_SENTRY_DSN`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 브라우저·서버 SDK 활성화 플래그와 DSN |
| 예시 | `true` / `false`, `https://...@sentry.io/...` |
| 사용처 | `client/src/.../sentry.config.ts` → `resolveClientSentryEnabled()` |
| 패턴 | `ENABLED`가 `true` 또는 `1`이고 DSN이 있을 때만 SDK가 활성화됩니다. |

### `NEXT_PUBLIC_SITE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/.../env.ts` → `env.siteUrl`, `client/src/.../app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순으로 fallback합니다. |

## 빌드·배포 전용 (`.env.example`에 없음)

| 변수 | 설명 | 사용처 |
| --- | --- | --- |
| `VERCEL_URL` | Vercel이 주입하는 호스트(프로토콜 없음) | `env.vercelHost` |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Sentry 소스맵 업로드 (CI·Vercel) | `client/next.config.ts` |
| `CI` | CI 환경 플래그 | Sentry plugin silent 모드, ISR fetch 스킵 |

## 관련 문서

- [환경 변수](../project/getting-started#2-환경-변수-준비)
- [client 인증](./auth)
- [API·BFF](./api-bff)
- [Observability](../other/observability)
