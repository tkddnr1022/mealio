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

기본 포트는 **4000**이며, 검증·파싱은 `client/src/.../env.ts`에서 수행합니다. 실패 시 `env.validationErrors`에 수집되고, `assertEnv()`로 엄격 검증할 수 있습니다.

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
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/.../app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순 fallback |

### `PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/.../app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순 fallback |

## API 연결

### `NEXT_PUBLIC_API_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/.../app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순 fallback |

### `INTERNAL_API_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/.../app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순 fallback |

```text
[브라우저 CSR]  NEXT_PUBLIC_API_BASE_URL
[SSR / BFF]     INTERNAL_API_BASE_URL ?? NEXT_PUBLIC_API_BASE_URL
```

### `NEXT_PUBLIC_API_PREFIX`

| 항목 | 내용 |
| --- | --- |
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/.../app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순 fallback |

## OAuth·ISR (연동)

OAuth **콜백 URL**은 producer의 `OAUTH_CALLBACK_BASE_URL`에서 설정합니다. client는 로그인 후 리다이렉트만 producer가 `FRONTEND_APP_BASE_URL`로 처리합니다.

관련 문서는 [client 인증](./auth), [producer 인증](../producer/auth), [producer 환경 변수](../producer/environment-variables)를 참고하세요.

### `REVALIDATE_SECRET`

| 항목 | 내용 |
| --- | --- |
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/.../app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순 fallback |

## 관측성

### `NEXT_PUBLIC_GA_MEASUREMENT_ID`

| 항목 | 내용 |
| --- | --- |
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/.../app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순 fallback |

### `NEXT_PUBLIC_SENTRY_ENABLED` / `NEXT_PUBLIC_SENTRY_DSN`

| 항목 | 내용 |
| --- | --- |
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/.../app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순 fallback |

### `NEXT_PUBLIC_SITE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | `metadataBase`·Open Graph 절대 URL |
| 예시 | `https://mealio.example.com` |
| 사용처 | `client/src/.../app.config.ts` → `getMetadataBase()` |
| 패턴 | 비우면 `VERCEL_URL` → `http://localhost:3000` 순 fallback |

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
