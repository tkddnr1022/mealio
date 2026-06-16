# 환경 변수

## 이 문서로 해결할 질문

- Next.js client에 필요한 환경 변수는 무엇인가요?
- `NEXT_PUBLIC_*`와 서버 전용 변수는 어떻게 구분되나요?
- API URL·OAuth·ISR·관측성 설정은 어디서 읽나요?

## 개요

Next.js App Router 프론트엔드. env 파일: `client/.env.local` (호스트) · `client/.env.docker.local` (Docker).

```bash
cp client/.env.example client/.env.local
```

기본 포트 **4000**. 검증·파싱: `client/src/lib/config/env.ts` — 실패 시 `env.validationErrors`에 수집, `assertEnv()`로 엄격 검증 가능.

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
| 설명 | 실행 환경 식별 (`package.json`/Compose에서 런타임 주입) |
| 허용 값 | `local` (기본) · `development` · `production` · `test` |
| 예시 | `local` |
| 사용처 | `client/src/lib/config/env.ts` → `env.runtime`, Sentry 샘플링 분기 |
| 패턴 | 미설정·알 수 없는 값은 `development`로 처리 |

### `PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Next.js dev·production 서버 포트 |
| 예시 | `4000` |
| 사용처 | `pnpm run start:client`, Docker healthcheck (`docker/compose-client.yml`) |

## API 연결

### `NEXT_PUBLIC_API_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | 브라우저(CSR)·빌드 타임에 인라이닝되는 백엔드 base URL |
| 예시 (로컬) | (비움 — same-origin) |
| 예시 (분리 배포) | `https://api.example.com` |
| 예시 (Docker) | `http://127.0.0.1:3000` |
| 사용처 | `resolveApiBaseUrl()` (브라우저), `client/src/lib/api/http-client.ts`, OAuth 진입 URL (`client/src/lib/auth/providers.ts`) |
| 패턴 | **비우면** `''`(same-origin). trailing slash는 자동 제거. `http`/`https`만 허용 |

### `INTERNAL_API_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | SSR·Route Handler 전용 내부 API URL (브라우저에 노출하지 않음) |
| 예시 (Docker client) | `http://host.docker.internal:3000` |
| 예시 (호스트 개발) | (비움 — `NEXT_PUBLIC_API_BASE_URL` fallback) |
| 사용처 | `resolveApiBaseUrl()` (서버), `client/src/app/api/auth/refresh-bridge/route.ts` |
| 패턴 | 서버에서 `INTERNAL_API_BASE_URL` → `NEXT_PUBLIC_API_BASE_URL` 순으로 사용 |

```text
[브라우저 CSR]  NEXT_PUBLIC_API_BASE_URL
[SSR / BFF]     INTERNAL_API_BASE_URL ?? NEXT_PUBLIC_API_BASE_URL
```

### `NEXT_PUBLIC_API_PREFIX`

| 항목 | 내용 |
| --- | --- |
| 설명 | REST API 경로 prefix |
| 예시 | `/api/v1` |
| 기본값 | `/api/v1` |
| 사용처 | `client/src/lib/api/endpoints.ts` → `API_PREFIX` |
| 패턴 | `/`로 시작, 끝 `/` 제거. 영숫자·`/_-`만 허용 |

## OAuth·ISR (연동)

OAuth **콜백 URL**은 producer의 `OAUTH_CALLBACK_BASE_URL`에서 설정합니다. client는 로그인 후 리다이렉트만 producer가 `FRONTEND_APP_BASE_URL`로 처리합니다.

→ [client 인증](./auth) · [producer 인증](../producer/auth) · [producer 환경 변수](../producer/environment-variables)

### `REVALIDATE_SECRET`

| 항목 | 내용 |
| --- | --- |
| 설명 | `POST /api/revalidate` ISR on-demand 재검증 시크릿 |
| 예시 | `openssl rand -hex 32`로 생성한 임의 문자열 |
| 사용처 | `client/src/app/api/revalidate/route.ts` — `timingSafeEqual` 비교 |
| 패턴 | 비어 있으면 엔드포인트가 500 반환(미설정). producer·배치가 캐시 무효화 시 `secret`+`path` POST |

## 관측성

### `NEXT_PUBLIC_GA_MEASUREMENT_ID`

| 항목 | 내용 |
| --- | --- |
| 설명 | GA4 Measurement ID |
| 예시 | `G-XXXXXXXXXX` |
| 사용처 | `client/src/app/layout.tsx`, `ObservabilityBootstrap.tsx` |
| 패턴 | 비우면 GA 미로드. 형식 `G-` + 영숫자 |

### `NEXT_PUBLIC_SENTRY_ENABLED` / `NEXT_PUBLIC_SENTRY_DSN`

| 항목 | 내용 |
| --- | --- |
| 설명 | 브라우저·서버 Sentry 활성화 플래그·DSN |
| 허용 값 (enabled) | `true` / `false` / `1` / `0` (미설정 시 `false`) |
| 예시 DSN | `https://xxx@o0.ingest.sentry.io/1` |
| 사용처 | `client/src/lib/config/sentry.config.ts` |
| 패턴 | **enabled=true 이고 DSN이 있을 때만** SDK 활성화 |

### `NEXT_PUBLIC_SITE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/lib/config/app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순 fallback |

## 빌드·배포 전용 (`.env.example`에 없음)

| 변수 | 설명 | 사용처 |
| --- | --- | --- |
| `VERCEL_URL` | Vercel이 주입하는 호스트(프로토콜 없음) | `env.vercelHost` |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Sentry 소스맵 업로드 (CI·Vercel) | `client/next.config.ts` |
| `CI` | CI 환경 플래그 | Sentry plugin silent 모드, ISR fetch 스킵 |

## 관련 문서

- [환경 변수 허브](../project/environment-variables)
- [client 인증](./auth)
- [API·BFF](./api-bff)
- [Observability](../other/observability)

## 참고 코드·계약

- `client/.env.example`, `client/.env.docker.example`, `client/README.md`
- `client/src/lib/config/env.ts`
- `client/src/lib/config/sentry.config.ts`
- `client/src/app/api/revalidate/route.ts`
