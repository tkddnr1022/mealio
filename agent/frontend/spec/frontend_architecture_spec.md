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
| (auth) | `/oauth/callback` | `(auth)/oauth/callback/page.tsx` | CSR | OAuth 로그인 성공 후 백엔드 리다이렉트 도착지 (쿠키 설정됨, /recipe 등으로 이동 또는 성공 표시) |
| **(marketing)** | `/` | `(marketing)/page.tsx` | SSG | 랜딩 |
| (marketing) | `/about` | `(marketing)/about/page.tsx` | SSG | 서비스 소개 |
| (marketing) | `/pricing` | `(marketing)/pricing/page.tsx` | SSG | 요금제 (필요시) |
| **(main)** | — | `(main)/layout.tsx` | — | 공통 레이아웃 (하단 탭: 레시피 / 챗봇 / 보관함 / 마이페이지) |
| (main) · 레시피 탭 | `/recipe` | `(main)/recipe/page.tsx` | ISR | RecipeMainPage — 레시피 메인 |
| (main) · 레시피 탭 | `/recipe/filter` | `(main)/recipe/filter/page.tsx` | ISR | RecipeFilterPage — 레시피 검색 필터 |
| (main) · 레시피 탭 | `/recipe/search` | `(main)/recipe/search/page.tsx` | ISR | RecipeListPage — 레시피 검색 결과 |
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
| (auth) | 인증 (로그인·회원가입·OAuth 콜백) | `/login`, `/signup`, `/oauth/callback` |
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
| `/login` | CSR | 로그인 | OAuth: 소셜 로그인 버튼 클릭 시 백엔드 `GET /auth/{provider}`(또는 `/api/v1/auth/{provider}`)로 이동(링크 또는 `location` 할당). Provider별 설정(Client ID, Redirect URI 등)은 백엔드에만 둠. 이메일 로그인(해당 시) |
| `/signup` | CSR | 회원가입 | 약관 동의, 초기 선호도 설정 |
| `/oauth/callback` | CSR | OAuth 로그인 성공 도착 페이지 | 백엔드가 Code 처리·JWT 쿠키 설정 후 302로 리다이렉트하는 URL. 프론트에서는 토큰 처리 없음(쿠키 이미 설정됨). /recipe 등으로 리다이렉트 또는 로그인 성공 표시 |

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

백엔드 REST API 호출용 클라이언트. fetch 래퍼 위에 도메인별 API 함수를 둔다. JWT는 HttpOnly 쿠키로 전달되므로 `credentials: 'include'`를 기본으로 사용한다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/api/** | 백엔드 REST API 호출 클라이언트 묶음 |
| client/src/lib/api/http-client.ts | fetch 래퍼. baseURL, `credentials: 'include'`(JWT 쿠키 자동 포함), Content-Type, 공통 에러 변환·Correlation-Id 헤더 주입 |
| client/src/lib/api/endpoints.ts | 엔드포인트 상수·경로 빌더 (예: `/api/v1/recipes`, `/api/v1/recipes/:id`, `/api/v1/chatbot/messages`) |
| client/src/lib/api/error.ts | `ApiError` 클래스, HTTP 상태 → 에러 타입 매핑, 사용자 노출 메시지 변환 |
| client/src/lib/api/users.api.ts | 유저 프로필 조회·닉네임 수정 (`GET /api/v1/users/me`, `PATCH /api/v1/users/me/nickname`) |
| client/src/lib/api/recipes.api.ts | 레시피 목록·상세·검색·요약 (`GET /api/v1/recipes`, `GET /api/v1/recipes/:recipeId`, `GET /api/v1/recipes/search`, `POST /api/v1/recipes/summaries`) |
| client/src/lib/api/ingredients.api.ts | 재료 목록·검색 (`GET /api/v1/ingredients`, `GET /api/v1/ingredients/search`) |
| client/src/lib/api/inventory.api.ts | 유저 보관함 조회(보유/관심 재료 + 관심 레시피) + 보유/관심 재료 변경 + 관심 레시피 추가/삭제 (`GET /api/v1/users/me/inventory`, `PUT/POST/DELETE /api/v1/users/me/inventory/ingredients/{owned\|favorites}`, `POST/DELETE /api/v1/users/me/inventory/recipes/favorites`) |
| client/src/lib/api/chatbot.api.ts | 챗봇 대화 목록·상세 조회 (`GET /api/v1/chatbot/conversations`, `GET /api/v1/chatbot/conversations/:id`). SSE 전송은 §5.4 sse-client 사용 |

### 5.2 인증 (`client/src/lib/auth/`, `client/src/proxy.ts`)

OAuth는 **백엔드 주도** 흐름을 따른다(§3.1, `../../backend/guidelines/oauth_implementation_guidelines.md`). 프론트엔드는 JWT 쿠키 존재 여부 확인·세션 상태 관리·보호 라우트 리다이렉트만 담당하며, Authorization Code·토큰 교환은 처리하지 않는다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/auth/** | 인증 상태·세션·보호 라우트 |
| client/src/lib/auth/providers.ts | OAuth Provider 식별자 상수(`google` \| `kakao` \| `naver`), 진입 URL 빌드 유틸 |
| client/src/lib/auth/session.ts | 세션 조회 유틸. 서버 컴포넌트에서는 `cookies()`로 JWT 존재 확인, 클라이언트에서는 `GET /api/v1/users/me`로 검증 |
| client/src/lib/auth/auth-context.tsx | `AuthProvider`(Client Component), `useAuth()` 훅 — 현재 유저·로그인 상태 제공 |
| client/src/lib/auth/protected-route.tsx | 보호 라우트 래퍼 컴포넌트(비로그인 시 `/login` 리다이렉트) |
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
| client/src/lib/queries/inventory.queries.ts | `inventoryQueries` 키, 보유·관심 재료 조회/변경 + 관심 레시피 추가/삭제 훅 |
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
| client/src/lib/config/cache.config.ts | React Query 기본 `staleTime` / `cacheTime`, ISR `revalidate` 주기 상수(§4 성능 예산과 연계) |

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
| client/src/lib/utils/cn.ts | Tailwind 클래스 머지(`clsx` + `tailwind-merge`) |
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
