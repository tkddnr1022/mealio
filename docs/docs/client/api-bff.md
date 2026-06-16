# API 클라이언트/BFF

## 이 문서로 해결할 질문

- 프론트에서 백엔드 API를 어떻게 호출하나요?
- SSR·CSR에서 쿠키·헤더는 어떻게 전달하나요?
- BFF Route Handler는 언제 사용하나요?

## 레이어 구조

```text
client/src/lib/api/
├── http-client.ts          # 저수준 fetch 래퍼
├── error.ts / error.parser.ts
├── domains/                # 도메인별 API 함수
│   ├── recipes.api.ts
│   ├── ingredients.api.ts
│   ├── inventory.api.ts
│   ├── chatbot.api.ts
│   └── users.api.ts
└── server/
    ├── server-fetch-wrapper.ts
    └── isr-fetch.server.ts
```

## http-client (CSR·공통)

| 기능 | 설명 |
| --- | --- |
| `credentials: 'include'` | HttpOnly 쿠키 자동 전송 |
| `X-Correlation-Id` | 요청 추적 헤더 주입 |
| 401 처리 | refresh 1회(인스턴스 락) → 원 요청 재시도 |
| SSR `next`/`cache` | `RequestOptions`로 Data Cache 전달 |

```typescript
// 사용 예
import { httpClient } from '@/lib/api/http-client';
import { getRecipeDetail } from '@/lib/api/domains/recipes.api';

const recipe = await getRecipeDetail(recipeId, { signal });
```

모든 도메인 API는 마지막 인자로 `fetchOptions?: RequestOptions`를 받습니다.

## SSR 헤더 전파

서버 컴포넌트·Route Handler에서는 브라우저가 쿠키를 자동 전송하지 않습니다.

- `withForwardedHeaders()` — 들어온 `Cookie`, `Accept-Language`, Correlation-Id 전달
- `serverFetchWrapper({ fetch, currentUrl })` — 401 시 refresh-bridge redirect

## BFF Route Handler

Next.js `client/src/app/api/` — 인프라·인증 브리지 전용.

| Path | Method | 역할 |
| --- | --- | --- |
| `/api/auth/refresh-bridge` | GET | SSR refresh: Cookie → Producer refresh → Set-Cookie → `next` 복귀 |
| `/api/revalidate` | POST | 온디맨드 ISR: `{ secret, path }` → `revalidatePath` |

프론트엔드 BFF Route Handler: [BFF Route Handler](../client/api-bff) · client/src/app/api/

### refresh-bridge 흐름

```text
SSR API 401
  → redirect /api/auth/refresh-bridge?next=...
  → Route Handler: POST /api/v1/auth/refresh (Cookie 전달)
  → Set-Cookie 브라우저 전달
  → next(상대 경로)로 redirect
```

## 에러 처리

- `ApiError` — HTTP 상태·바디 정규화
- `getUserMessage()` — 사용자 노출 메시지
- Toast 연동: [에러 처리/Toast](./error-toast)

## 관련 문서

- [인증](./auth)
- [캐시](./cache) (ISR fetch)
- [도메인 API 가이드](../producer/domain-api)

## 참고 코드·계약

- [클라이언트 아키텍처](../client/architecture) · client/src/app/ (§5.1)
- [BFF Route Handler](../client/api-bff) · client/src/app/api/
