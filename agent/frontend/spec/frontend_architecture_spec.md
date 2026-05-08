# 프론트엔드 아키텍처 명세서

에이전트가 **무엇을** 개발할지 **페이지·라우팅·파일 단위**로 정의하는 정형 명세이다. 원칙·방법론·구현 가이드는 `../guidelines/frontend_development_guidelines.md`, 스펙 주도 개발 원칙은 `../../common/spec_driven_development_guidelines.md`에 정의되어 있다.

아래 경로는 **저장소 루트 기준**이며, Next.js App Router 기준으로 `app/` 루트를 전제로 한다.

---

## 1. 라우팅 전략 (Next.js App Router 기반)

| 전략 | 적용 대상 |
|------|------------|
| **SSG** | SEO 중요 페이지, 자주 변하지 않는 콘텐츠 (랜딩, about, pricing) |
| **ISR** | 레시피 메인·카테고리·검색/필터 목록·상세 |
| **SSR** | 마이페이지 메인 등 개인화·실시간성 필요 페이지 |
| **CSR** | 챗봇(대화 목록·대화), 보관함(관심/보유 재료), 로그인/회원가입 등 인터랙티브 기능 |

---

## 2. 페이지 구조 및 라우팅 맵

아래 표는 **레이아웃 그룹 → URL 경로 → 파일·렌더링·역할** 순으로 정리한 라우팅 맵이다. `app/` 루트 기준이며, 레이아웃 그룹은 Next.js Route Groups `(폴더명)` 규칙을 따른다.

### 2.1 페이지·라우트 일람

| 레이아웃 그룹 | URL 경로 | 파일 (`app/` 기준) | 렌더링 | 설명 |
| ------------- | -------- | ------------------- | ------ | ---- |
| **(auth)** | `/login` | `(auth)/login/page.tsx` | CSR | 로그인 |
| (auth) | `/signup` | `(auth)/signup/page.tsx` | CSR | 회원가입 |
| (auth) | `/oauth/error` | `(auth)/oauth/error/page.tsx` | CSR | OAuth **실패** 시 백엔드가 `FRONTEND_OAUTH_ERROR_PATH`로 302. 쿼리: `errorCode`/`errorMessage` 또는 OAuth 표준 `error`/`error_description`, 선택 `next`. `InfoScreen`·로그인 복귀 링크. **성공** 시 백엔드가 `next` 또는 기본 성공 경로로 직접 302하며 이 페이지를 거치지 않음 |
| **(marketing)** | `/` | `(marketing)/page.tsx` | SSG | 랜딩 |
| (marketing) | `/about` | `(marketing)/about/page.tsx` | SSG | 서비스 소개 |
| (marketing) | `/pricing` | `(marketing)/pricing/page.tsx` | SSG | 요금제 (필요시) |
| **(main)** | — | `(main)/layout.tsx` | — | 공통 레이아웃 (하단 탭: 레시피 / 챗봇 / 보관함 / 마이페이지) |
| (main) · 레시피 탭 | `/recipe` | `(main)/recipe/page.tsx` | ISR | RecipeMainPage — 레시피 메인 |
| (main) · 레시피 탭 | `/recipe/filter` | `(main)/recipe/filter/page.tsx` | ISR | RecipeFilterPage — 레시피 검색 필터 |
| (main) · 레시피 탭 | `/recipe/search` | `(main)/recipe/search/page.tsx` | SSR | RecipeListPage — 레시피 검색 결과 |
| (main) · 레시피 탭 | `/recipe/[id]` | `(main)/recipe/[id]/page.tsx` | ISR | RecipeDetailPage — 레시피 상세 |
| (main) · 챗봇 탭 | `/chatbot/list` | `(main)/chatbot/list/page.tsx` | CSR | ChatbotConversationListPage — 대화 목록 |
| (main) · 챗봇 탭 | `/chatbot/[id]` | `(main)/chatbot/[id]/page.tsx` | CSR | ChatbotConversationPage — 대화 |
| (main) · 보관함 탭 | `/inventory/ingredients/favorite` | `(main)/inventory/ingredients/favorite/page.tsx` | CSR | InventoryFavoriteListPage — 관심 재료 목록 |
| (main) · 보관함 탭 | `/inventory/ingredients/owned` | `(main)/inventory/ingredients/owned/page.tsx` | CSR | InventoryOwnedListPage — 보유 재료 목록 |
| (main) · 보관함 탭 | `/inventory/recipes/favorite` | `(main)/inventory/recipes/favorite/page.tsx` | CSR | InventoryFavoriteListPage — 관심 레시피 목록 |
| (main) · 마이페이지 탭 | `/mypage` | `(main)/mypage/page.tsx` | SSR | MypageMainPage — 마이페이지 메인 |
| **api** | `/api/revalidate` | `api/revalidate/route.ts` | — | ISR 재검증 웹훅 |
| api | `/api/health` | `api/health/route.ts` | — | 헬스체크 |
| **(error)** | — | `(error)/not-found.tsx` | — | 404 페이지 |
| (error) | — | `(error)/error.tsx` | — | 에러 페이지 |

### 2.2 그룹·탭별 요약

| 그룹 | 역할 | 하위 URL/경로 |
| ---- | ---- | -------------- |
| (auth) | 인증 (로그인·회원가입·OAuth 실패 안내) | `/login`, `/signup`, `/oauth/error` |
| (marketing) | 마케팅 (랜딩·소개·요금제) | `/`, `/about`, `/pricing` |
| (main) | 앱 본체 (하단 탭 네비게이션) | `/recipe`·하위, `/chatbot`·하위, `/inventory`·하위, `/mypage` |
| api | API 라우트 | `/api/revalidate`, `/api/health` |
| (error) | 전역 에러·404 | `not-found.tsx`, `error.tsx` |

---

## 3. 상세 페이지 명세

### 3.1 인증 (CSR)

OAuth는 **백엔드 주도** 흐름을 사용한다. 진입·콜백·보안 요건은 `../../backend/guidelines/oauth_implementation_guidelines.md` 및 `backend_architecture_spec_producer.md` §1.3에 정의되어 있다. 프론트엔드는 로그인 진입 URL로 이동만 하며, Authorization Code·토큰·Redirect URI는 백엔드에서만 처리한다.

| 경로 | 렌더링 | 설명 | 주요 기능 |
|------|--------|------|-----------|
| `/login` | CSR | 로그인 | OAuth: 소셜 로그인 버튼이 백엔드 `GET /api/v1/auth/{provider}`(또는 동일 계약)로 이동. URL에 `?next=`가 있으면 진입 링크에 전달; **안전 여부는 백엔드**가 `resolveSafeNextPath`로 검증. Provider 설정은 백엔드에만 둠. 이메일 로그인(해당 시) |
| `/signup` | CSR | 회원가입 | 약관 동의, 초기 선호도 설정 |
| `/oauth/error` | CSR | OAuth 실패 안내 | 백엔드가 `FRONTEND_OAUTH_ERROR_PATH`로 302. `errorCode`/`errorMessage` 또는 `error`/`error_description`, 선택 `next` → `InfoScreen`, `로그인으로 돌아가기`에 `next` 유지. **성공** 플로우는 백엔드가 JWT `Set-Cookie` 후 최종 앱 경로로 직접 302 |

### 3.2 마케팅 (SSG)

| 경로 | 렌더링 | 설명 |
|------|--------|------|
| `/` | SSG | 랜딩 페이지 |
| `/about` | SSG | 서비스 소개 |
| `/pricing` | SSG | 요금제 (필요시) |

### 3.3 핵심 기능

#### 레시피 탭 (`/recipe`)

| 경로 | 컴포넌트 | 렌더링 | 설명 |
|------|----------|--------|------|
| `/recipe` | RecipeMainPage | ISR | 레시피 메인 페이지 |
| `/recipe/category` | RecipeCategoryPage | ISR | 레시피 카테고리 목록 페이지 |
| `/recipe/search` | RecipeListPage | ISR | 레시피 목록 페이지 (검색 결과) |
| `/recipe/filter` | RecipeFilterListPage | ISR | 레시피 목록 페이지 (필터 결과) |
| `/recipe/[id]` | RecipeDetailPage | ISR | 레시피 상세 페이지 (동적 OG 이미지) |

#### 챗봇 탭 (`/chatbot`)

| 경로 | 컴포넌트 | 렌더링 | 설명 |
|------|----------|--------|------|
| `/chatbot/list` | ChatbotConversationListPage | CSR | 대화 목록 페이지 |
| `/chatbot/[id]` | ChatbotConversationPage | CSR | 대화 페이지 (SSE/WebSocket) |

#### 보관함 탭 (`/inventory`)

| 경로 | 컴포넌트 | 렌더링 | 설명 |
|------|----------|--------|------|
| `/inventory/favorite` | InventoryFavoriteListPage | CSR | 관심 재료 목록 페이지 |
| `/inventory/owned` | InventoryOwnedListPage | CSR | 보유 재료 목록 페이지 |

#### 마이페이지 탭 (`/mypage`)

| 경로 | 컴포넌트 | 렌더링 | 설명 |
|------|----------|--------|------|
| `/mypage` | MypageMainPage | SSR | 마이페이지 메인 페이지 |

---

## 4. 성능 목표

### 4.1 Web Vitals

| 지표 | 목표 |
|------|------|
| LCP (Largest Contentful Paint) | < 2.5초 |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

### 4.2 페이지별 성능 예산

| 페이지 | 초기 로드 | TTI | 번들 사이즈 |
|--------|----------|-----|------------|
| 랜딩 | < 1.5초 | < 2초 | < 100KB |
| 레시피 메인/검색/필터 목록 | < 2초 | < 3초 | < 150KB |
| 레시피 상세 (`/recipe/[id]`) | < 1.8초 | < 2.5초 | < 120KB |
| 챗봇 대화 (`/chatbot/[id]`) | < 2.5초 | < 3.5초 | < 200KB |

측정 방법·캐싱·로딩 전략 등 구현 가이드는 `../guidelines/frontend_development_guidelines.md`에 정의되어 있다.

---

## 5. 핵심 라이브러리 명세

프론트엔드 패키지 루트는 `client/`이며, App Router(`client/src/app/`) · 공용 컴포넌트(`client/src/components/`) 외에 아래의 **핵심 라이브러리**를 `client/src/lib/` 이하에 둔다.

**경로 표기 규칙**: 아래 표의 경로는 모두 **저장소 루트 기준**이다. `*`는 해당 디렉터리 내의 임의의 파일·하위 경로를 의미하고, **굵게 표시된 경로**는 디렉터리(그룹)를 의미하며 그 아래 행들이 해당 디렉터리 내부 파일·세부 경로와 역할을 정의한다. 백엔드 엔드포인트 경로는 `../../backend/spec/backend_architecture_spec_producer.md` §1.1과 일치한다.

### 5.1 API 클라이언트 (`client/src/lib/api/`)

백엔드 REST API 호출용 클라이언트. 저수준 fetch 래퍼·공통 인프라는 `client/src/lib/api/` 직속에, 도메인별 API 래퍼는 `client/src/lib/api/domains/`에, SSR 시 들어오는 요청 헤더(쿠키·Correlation-Id·Accept-Language 등) 전파 유틸은 `client/src/lib/api/server/`에 둔다. JWT는 HttpOnly 쿠키로 전달되므로 `credentials: 'include'`를 기본으로 사용한다. 도메인 API 함수는 모두 마지막 인자로 `fetchOptions?: RequestOptions`를 받아 헤더·`signal`·`timeoutMs`·`retry`·`correlationId`를 호출 단위로 제어할 수 있다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/api/** | 백엔드 REST API 호출 클라이언트 묶음 (저수준 인프라) |
| client/src/lib/api/http-client.ts | fetch 래퍼. baseURL, `credentials: 'include'`(JWT 쿠키 자동 포함), Content-Type, 공통 에러 변환·Correlation-Id 헤더 주입, 인터셉터·타임아웃·재시도. `RequestOptions`·`HttpClient`·`createHttpClient`·기본 `httpClient` export |
| client/src/lib/api/endpoints.ts | 엔드포인트 상수·경로 빌더 (예: `/api/v1/recipes`, `/api/v1/recipes/:id`, `/api/v1/chatbot/messages`) |
| client/src/lib/api/error.ts | `ApiError` 클래스, HTTP 상태 → 에러 타입 매핑, 사용자 노출 메시지 변환 |
| **client/src/lib/api/domains/** | 도메인별 API 래퍼 묶음. 모든 함수는 `fetchOptions?: RequestOptions`를 옵셔널로 받음 |
| client/src/lib/api/domains/index.ts | 도메인 API 배럴 export(`@/lib/api/domains` 단축 import 제공) |
| client/src/lib/api/domains/users.api.ts | 유저 프로필 조회·닉네임 수정 (`GET /api/v1/users/me`, `PATCH /api/v1/users/me/nickname`) |
| client/src/lib/api/domains/recipes.api.ts | 레시피 목록·상세·검색·요약·카테고리 (`GET /api/v1/recipes`, `GET /api/v1/recipes/categories`, `GET /api/v1/recipes/search`, `GET /api/v1/recipes/:recipeId`, `POST /api/v1/recipes/summaries`) |
| client/src/lib/api/domains/ingredients.api.ts | 재료 목록·검색 (`GET /api/v1/ingredients`, `GET /api/v1/ingredients/search`) |
| client/src/lib/api/domains/inventory.api.ts | 유저 보관함 조회(보유/관심 재료 + 관심 레시피) + 관심 레시피 ID 전용 조회 + 보유/관심 재료 변경 + 관심 레시피 추가/삭제 (`GET /api/v1/users/me/inventory`, `GET /api/v1/users/me/favorite-recipes/ids`, `PUT/POST/DELETE /api/v1/users/me/inventory/ingredients/{owned\|favorites}`, `POST/DELETE /api/v1/users/me/inventory/recipes/favorites`) |
| client/src/lib/api/domains/chatbot.api.ts | 챗봇 대화 목록·상세 조회 (`GET /api/v1/chatbot/conversations`, `GET /api/v1/chatbot/conversations/:id`). SSE 전송은 §5.4 sse-client 사용 |
| **client/src/lib/api/server/** | SSR 전용. `'server-only'`로 잠긴 헤더 전달 유틸. 도메인 API 함수에 합쳐 들어오는 요청의 쿠키·Correlation-Id·Accept-Language를 백엔드로 그대로 전파 |
| client/src/lib/api/server/index.ts | 서버 전용 유틸 배럴 export(`@/lib/api/server`) |
| client/src/lib/api/server/forward-headers.ts | 저수준 빌더: `buildForwardCookieHeader()`(들어오는 쿠키 → `Cookie` 헤더 직렬화), `getInboundCorrelationId()`(`X-Correlation-Id` 패스스루), `getInboundAcceptLanguage()`(로케일 패스스루) |
| client/src/lib/api/server/with-forwarded-headers.ts | `withForwardedHeaders<T extends RequestOptions>(options?, forward?)` — `RequestOptions`에 SSR 헤더를 병합한 옵션을 반환. 호출자 헤더 우선, 기본 forward는 `['cookie', 'correlationId']`, 옵트인으로 `'acceptLanguage'`. 사용 예: `await searchRecipes(query, await withForwardedHeaders())` |

### 5.2 인증 (`client/src/lib/auth/`, `client/src/proxy.ts`)

OAuth는 **백엔드 주도** 흐름을 따른다(§3.1, `../../backend/guidelines/oauth_implementation_guidelines.md`). 프론트엔드는 JWT 쿠키 존재 여부 확인·세션 상태 관리·보호 라우트 리다이렉트만 담당하며, Authorization Code·토큰 교환은 처리하지 않는다. 페이지 단위 보호는 `protected-route`, 사용자 액션 단위 보호(예: 즐겨찾기 클릭)는 `protected-action`으로 분리한다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/auth/** | 인증 상태·세션·보호 라우트 |
| client/src/lib/auth/providers.ts | OAuth Provider 식별자 상수(`google` \| `kakao` \| `naver`), 진입 URL 빌드(`buildOAuthEntryUrl`, 비어 있지 않은 `next`면 `?next=` — 검증은 백엔드) |
| client/src/lib/auth/routes.ts | 보호 경로·`LOGIN_PATH`, `NEXT_QUERY_PARAM`, `buildLoginUrl` |
| client/src/lib/auth/session.ts | 세션 조회 유틸. 서버 컴포넌트에서는 `cookies()`로 JWT 존재 확인, 클라이언트에서는 `GET /api/v1/users/me`로 검증 |
| client/src/lib/auth/auth-context.tsx | `AuthProvider`(Client Component), `useAuth()` 훅 — 현재 유저·로그인 상태 제공 |
| client/src/lib/auth/protected-route.tsx | 보호 라우트 래퍼 컴포넌트(비로그인 시 `/login` 리다이렉트) |
| client/src/lib/auth/protected-action.ts | 액션 단위 인증 가드 훅(`useProtectedAction`). 비로그인 시 `buildLoginUrl(pathname+search)`로 로그인 이동, 인증 시 전달한 액션 실행 |
| **client/src/proxy.ts** | Next.js 미들웨어. `(main)` 그룹(`/recipe`·`/chatbot`·`/inventory`·`/mypage`) 접근 시 JWT 쿠키 검사, 미인증 시 `/login` 리다이렉트. `matcher`로 `(auth)`·`(marketing)`·정적 자산 제외 |

### 5.3 데이터 페칭 / React Query (`client/src/lib/providers/`, `client/src/lib/queries/`)

React Query(TanStack Query) 기반. 쿼리 키 계층화·`staleTime`·`cacheTime` 규칙은 `../guidelines/frontend_development_guidelines.md` §5에 정의되어 있다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/providers/** | 클라이언트 전역 Provider 묶음 |
| client/src/lib/providers/query-client.provider.tsx | `QueryClientProvider` + devtools, SSR-safe `QueryClient` 생성 |
| client/src/lib/providers/root-providers.tsx | React Query·Auth 등 Provider 합성. `app/layout.tsx`에서 사용 |
| **client/src/lib/queries/** | React Query 쿼리 키·훅 |
| client/src/lib/queries/recipe.queries.ts | `recipeQueries` 키, `useRecipeList` / `useRecipeDetail` / `useRecipeSearch` / `useRecipeSummaries` |
| client/src/lib/queries/ingredient.queries.ts | `ingredientQueries` 키, `useIngredientList` / `useIngredientSearch` |
| client/src/lib/queries/user.queries.ts | `userQueries` 키, `useCurrentUser` / `useUpdateNickname` |
| client/src/lib/queries/inventory.queries.ts | `inventoryQueries`·`favoriteRecipeQueries` 키, `useMyInventory` / `useMyFavoriteRecipeIds` + 보유·관심 재료·관심 레시피 변경 훅 |
| client/src/lib/queries/chatbot.queries.ts | `chatbotQueries` 키, `useConversationList` / `useConversationDetail` |

### 5.4 챗봇 SSE 클라이언트 (`client/src/lib/chatbot/`)

SSE 구독·이벤트 파싱 담당. `ChatbotStreamEvent` 타입·Redis 채널·Kafka 토픽 계약은 `../../backend/spec/backend_architecture_spec_producer.md` §1.2에 정의되어 있다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/chatbot/** | 챗봇 SSE 구독·스트림 상태 관리 |
| client/src/lib/chatbot/sse-client.ts | `POST /api/v1/chatbot/messages` fetch + `ReadableStream` 파서. SSE `data:` 라인 → JSON 디코딩, 재연결·취소 지원 |
| client/src/lib/chatbot/stream-events.ts | `ChatbotStreamEvent` 타입(`intent` \| `chunk` \| `done` \| `error`)·타입 가드·이벤트 파서 |
| client/src/lib/chatbot/use-chatbot-stream.ts | `useChatbotStream` 훅 — 메시지 전송·스트림 구독·부분 응답 상태 관리, 컴포넌트 언마운트 시 abort |

### 5.5 설정·환경 변수 (`client/src/lib/config/`)

| 경로 | 역할 |
|------|------|
| **client/src/lib/config/** | 런타임·빌드 타임 설정 |
| client/src/lib/config/env.ts | `NEXT_PUBLIC_*` 환경 변수 로드·검증(Zod 또는 수동). API base URL, 환경(dev/prod), OAuth Provider 노출 플래그 |
| client/src/lib/config/api.config.ts | API base URL, SSE timeout, 재시도 정책 상수 |
| client/src/lib/config/cache.config.ts | React Query 기본 `staleTime` / `cacheTime` 상수(§4 성능 예산과 연계) |
| client/src/lib/config/oauth-error.config.ts | `/oauth/error` 페이지 쿼리 키(OAuth 표준·백엔드 실패 파라미터) |

### 5.6 타입·DTO (`client/src/lib/types/`)

백엔드 DTO와 1:1 대응되는 프론트엔드 타입. 백엔드 DTO 정의는 `../../backend/spec/backend_architecture_spec_producer.md` §1.1 참조.

| 경로 | 역할 |
|------|------|
| **client/src/lib/types/** | 프론트엔드 타입 정의 |
| client/src/lib/types/api.ts | `ApiResponse<T>`, `Paginated<T>`, 에러 응답 등 공통 래퍼 타입 |
| client/src/lib/types/auth.ts | `OAuthProvider`, `SessionUser` |
| client/src/lib/types/user.ts | `UserProfile`, 닉네임 변경 DTO |
| client/src/lib/types/recipe.ts | `Recipe`, `RecipeDetail`, `RecipeSummary`, `RecipeListQuery`, `RecipeSearchQuery` |
| client/src/lib/types/ingredient.ts | `Ingredient`, `IngredientCategory`, 목록·검색 쿼리 타입 |
| client/src/lib/types/inventory.ts | `Inventory`(보유/관심 재료 구분 포함), `FavoriteRecipeIdsPayload` |
| client/src/lib/types/chatbot.ts | `Conversation`, `ConversationMessage`, `SuggestedRecipe`, `ChatbotStreamEvent` |

### 5.7 유틸 (`client/src/lib/utils/`)

| 경로 | 역할 |
|------|------|
| **client/src/lib/utils/** | 공통 유틸 |
| client/src/lib/utils/a11y.ts | 접근 이름 생성. `buildAriaLabel(type, name)` — 엘리먼트 유형별 `aria-label` 문구 규칙·빈 `name` 시 타입별 폴백. 컴포넌트는 `aria-label` 전용 prop 없이 필수/의미 prop으로 문자열을 만든 뒤 이 유틸만 사용 (`../guidelines/frontend_development_guidelines.md` §9) |
| client/src/lib/utils/search-params.ts | 페이지 `searchParams` 파싱 공용화. `resolveSearchParams`, `getSingleSearchParam`, `getMultiSearchParam`, `getTrimmedSearchParam`, `getFirstTrimmedSearchParam`으로 query 값 정규화·빈 문자열 제거·다중 키 fallback 처리 |
| client/src/lib/utils/cn.ts | Tailwind 클래스 머지(`clsx` + `tailwind-merge`) |
| client/src/lib/utils/isInternalNavHref.ts | 앱 내 경로 문자열 판별. `isInternalNavHref(href)` — `"/"`로 시작하고 `"//"`로 시작하지 않으면 true(Next.js `Link`·클라이언트 전환 대상). 프로토콜 상대 URL·외부 절대 URL·해시 전용 등은 false. 네비게이션 UI에서 `Link` vs `<a>` 분기의 단일 근거 (`../guidelines/frontend_development_guidelines.md` §1.1) |
| client/src/lib/utils/date.ts | 날짜·시간 포맷팅(요리 시간 표시 등) |
| client/src/lib/utils/image.ts | `blurDataURL`·반응형 `sizes` 헬퍼 (`next/image`용) |
| client/src/lib/utils/logger.ts | 클라이언트 로그 래퍼, dev/prod 분기 |

### 5.8 관측·모니터링 (`client/src/lib/observability/`)

Web Vitals 수집·성능 예산 초과 감지. 목표·예산은 §4에 정의되어 있다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/observability/** | 프론트엔드 모니터링 |
| client/src/lib/observability/web-vitals.ts | `web-vitals` 라이브러리로 LCP/FID/CLS 수집·리포팅 엔드포인트 전송 |
| client/src/lib/observability/analytics.ts | 페이지 이동·사용자 이벤트 트래킹 래퍼 |
