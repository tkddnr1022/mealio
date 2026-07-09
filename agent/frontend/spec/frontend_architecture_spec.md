# 프론트엔드 아키텍처 명세서

에이전트가 **무엇을** 개발할지 **페이지·라우팅·파일 단위**로 정의하는 정형 명세이다. 원칙·방법론·구현 가이드는 `../guidelines/frontend_development_guidelines.md`, 스펙 주도 개발 원칙은 `../../common/spec_driven_development_guidelines.md`에 정의되어 있다.

아래 경로는 **저장소 루트 기준**이며, Next.js App Router의 앱 디렉터리는 **`client/src/app/`** 이다.

---

## 1. 라우팅 전략 (Next.js App Router 기반)

| 전략 | 적용 대상 |
|------|------------|
| **SSG** | (도입 시) SEO 중요·정적 마케팅 페이지 등 — 현재 `client/src/app`에는 독립 랜딩·about·pricing 라우트 없음 |
| **ISR** | fetch `next.revalidate`(Data Cache)로 캐시하는 레시피 메인·필터·재료 필터 (`/recipe`, `/recipe/filter`, `/ingredient/filter`). 레시피 상세(`/recipe/[id]`)는 `ISR_FETCH_ON_DEMAND` 온디맨드 ISR |
| **SSR** | `searchParams` 등 요청마다 달라지는 데이터를 서버에서 가져오는 페이지(예: `/recipe/search`), 루트 `/`의 `redirect` 처리 |
| **CSR** | 챗봇(대화 목록·대화), 보관함(관심 재료·보유 재료·관심 레시피), 로그인, 마이페이지 등 `'use client'` 페이지 |

---

## 2. 페이지 구조 및 라우팅 맵

아래 표는 **레이아웃 그룹 → URL 경로 → 파일·렌더링·역할** 순으로 정리한 라우팅 맵이다. 파일 열은 **저장소 기준** `client/src/app/` 이하 경로이며, 레이아웃 그룹은 Next.js Route Groups `(폴더명)` 규칙을 따른다(그룹명은 URL에 포함되지 않음). 앱 루트 **`client/src/app/layout.tsx`**에서는 `<html>`/`metadata`와 함께, `AppQueryClientProvider` → `ToastProvider` → `AuthProvider` → `AppRootFrame` 순의 전역 클라이언트 트리를 합성한다(§5.3).

### 2.1 페이지·라우트 일람

| 레이아웃 그룹 | URL 경로 | 파일 (`client/src/app/` 기준) | 렌더링 | 설명 |
| ------------- | -------- | ------------------------------ | ------ | ---- |
| **(루트)** | `/` | `page.tsx` | SSR | `redirect('/recipe')`만 수행. 별도 랜딩 UI 없음 |
| **(auth)** | `/login` | `(auth)/login/page.tsx` | CSR | 로그인 |
| (auth) | `/oauth/callback` | `(auth)/oauth/callback/page.tsx` | CSR | OAuth **성공** 시 백엔드가 `FRONTEND_OAUTH_SUCCESS_CALLBACK_PATH`로 302(`Set-Cookie` + `?next=`). `AuthContext.refresh()`로 Authenticated 마킹·`/me` 재조회 후 `next`(없으면 `/recipe`)로 `replace` |
| (auth) | `/oauth/error` | `(auth)/oauth/error/page.tsx` | CSR | OAuth **실패** 시 백엔드가 `FRONTEND_OAUTH_ERROR_PATH`로 302. 쿼리: `errorCode`/`errorMessage` 또는 OAuth 표준 `error`/`error_description`, 선택 `next`. `InfoScreen`·로그인 복귀 링크 |
| **(main)** | — | — | — | 라우트 그룹. **전용 `layout.tsx`는 없음** — 하단 탭·`Navbar` 등은 각 `page.tsx`에서 `Tabbar`·레이아웃 컴포넌트로 조합 (`layout.tsx`는 루트 `layout.tsx`만 존재) |
| (main) · 레시피 탭 | `/recipe` | `(main)/recipe/page.tsx` | ISR + CSR 조합 | `ISR_FETCH_PERIODIC`(300초). 레시피 메인(공개 섹션 ISR + 개인화 추천 섹션 CSR) |
| (main) · 레시피 탭 | `/recipe/filter` | `(main)/recipe/filter/page.tsx` | ISR | `ISR_FETCH_PERIODIC`(300초). 레시피 카테고리·필터 UI |
| (main) · 레시피 탭 | `/recipe/search` | `(main)/recipe/search/page.tsx` | SSR | `searchParams` 기반 서버에서 `searchRecipes` 등 호출 후 클라이언트 위젯에 전달(동적 렌더링, ISR fetch 옵션 없음) |
| (main) · 레시피 탭 | `/recipe/[id]` | `(main)/recipe/[id]/page.tsx` | 온디맨드 ISR | `ISR_FETCH_ON_DEMAND`, `generateStaticParams`(size 10). 데이터 변경 시 `POST /api/revalidate`(본문 `{ secret, path: '/recipe/{id}' }`) → `revalidatePath(path)` |
| (main) · 챗봇 탭 | `/chatbot/list` | `(main)/chatbot/list/page.tsx` | CSR | 대화 목록 |
| (main) · 챗봇 탭 | `/chatbot/[id]` | `(main)/chatbot/[id]/page.tsx` | CSR | 대화 |
| (main) · 재료 | `/ingredient/filter` | `(main)/ingredient/filter/page.tsx` | ISR | `ISR_FETCH_PERIODIC`(300초). 재료 필터/선택(보관함 재료 추가 시 `?type=owned\|favorites` 등) |
| (main) · 보관함 탭 | `/inventory/ingredients/favorite` | `(main)/inventory/ingredients/favorite/page.tsx` | CSR | 관심 재료 목록 |
| (main) · 보관함 탭 | `/inventory/ingredients/owned` | `(main)/inventory/ingredients/owned/page.tsx` | CSR | 보유 재료 목록 |
| (main) · 보관함 탭 | `/inventory/recipes/favorite` | `(main)/inventory/recipes/favorite/page.tsx` | CSR | 관심 레시피 목록 |
| (main) · 마이페이지 탭 | `/mypage` | `(main)/mypage/page.tsx` | CSR | `'use client'`, `useAuth`로 로딩·비로그인·로그인 상태 분기 |
| (main) · 마이페이지 탭 | `/mypage/profile` | `(main)/mypage/profile/page.tsx` | CSR | 프로필(닉네임) 수정 |
| (main) · 마이페이지 탭 | `/mypage/activity` | `(main)/mypage/activity/page.tsx` | CSR | 내 활동 내역 조회 |
| **(루트)** | — | `not-found.tsx` | — | 앱 전역 404 UI (`notFound()` 호출·존재하지 않는 경로). 별도 URL 없음 |
| **(루트)** | — | `error.tsx` | CSR | 루트 레이아웃 **자식** 트리의 런타임 에러 UI(Error Boundary). 별도 URL 없음 |
| **(루트)** | — | `global-error.tsx` | CSR | 루트 `layout.tsx`까지 포함한 치명적 에러 시 대체 UI. `<html>`·`<body>`·`globals.css` 포함, `AppRootFrame`·Provider 비적용 |

**참고(현재 `client/src/app`에 없는 경로·파일)**: `/signup`, `(marketing)` 그룹 및 `/about`, `/pricing`, `api/health/route.ts` — OpenAPI·기획과 별도로 도입 시 본 표를 갱신한다.

**CSR 클라이언트 페이지 컴포넌트 컨벤션**: CSR 렌더링 페이지는 `page.tsx`(서버 진입점)와 `*ClientPage.tsx`(클라이언트 본체)로 분리한다. `page.tsx`는 메타데이터·Suspense·서버 데이터 전달만 담당하고, `'use client'` 로직은 동일 디렉터리의 `*ClientPage.tsx`에 둔다. 아래는 현재 존재하는 클라이언트 페이지 컴포넌트 목록이다.

| 라우트 디렉터리 | 클라이언트 페이지 파일 |
|----------------|----------------------|
| `(auth)/login/` | `LoginClientPage.tsx` |
| `(auth)/oauth/callback/` | `OAuthCallbackClientPage.tsx` |
| `(auth)/oauth/error/` | `OAuthErrorClientPage.tsx` |
| `(main)/recipe/` | `RecipeMainClientPage.tsx` |
| `(main)/recipe/search/` | `RecipeSearchClientPage.tsx` |
| `(main)/recipe/filter/` | `RecipeFilterClientPage.tsx` |
| `(main)/recipe/[id]/` | `RecipeDetailClientPage.tsx` |
| `(main)/chatbot/list/` | `ChatbotConversationListClientPage.tsx` |
| `(main)/chatbot/[id]/` | `ChatbotConversationClientPage.tsx` |
| `(main)/ingredient/filter/` | `IngredientFilterClientPage.tsx` |
| `(main)/inventory/ingredients/favorite/` | `InventoryFavoriteIngredientsClientPage.tsx` |
| `(main)/inventory/ingredients/owned/` | `InventoryOwnedIngredientsClientPage.tsx` |
| `(main)/inventory/recipes/favorite/` | `InventoryFavoriteRecipesClientPage.tsx` |
| `(main)/mypage/` | `MypageClientPage.tsx` |
| `(main)/mypage/profile/` | `ProfileClientPage.tsx` |
| `(main)/mypage/activity/` | `ActivityClientPage.tsx` |

**보조 파일**:

| 경로 (`client/src/app/` 기준) | 역할 |
|------|------|
| `(main)/inventory/InventoryPageShell.tsx` | 보관함 탭 공통 셸(서브탭 + 콘텐츠 영역) |
| `globals.css` | 전역 CSS (디자인 토큰·타이포·커스텀 프로퍼티, `design_tokens.json` → 코드 반영 대상) |

### 2.2 그룹·탭별 요약

| 그룹 | 역할 | 하위 URL/경로 |
| ---- | ---- | -------------- |
| (루트) | 진입 리다이렉트 | `/` → `/recipe` |
| (auth) | 인증 (로그인·OAuth 성공/실패 안내) | `/login`, `/oauth/callback`, `/oauth/error` |
| (main) | 앱 본체 (하단 탭 네비게이션) | `/recipe`·하위, `/ingredient`·하위, `/chatbot`·하위, `/inventory`·하위, `/mypage` |
| (루트) | 앱 전역 에러·404 | `not-found.tsx`, `error.tsx`, `global-error.tsx` (`client/src/app/` 직속, URL 없음) |

---

## 3. 상세 페이지 명세

### 3.1 인증 (CSR)

OAuth는 **백엔드 주도** 흐름을 사용한다. 진입·콜백·보안 요건은 `../../backend/guidelines/oauth_implementation_guidelines.md` 및 `backend_architecture_spec_producer.md` §1.3에 정의되어 있다. 프론트엔드는 로그인 진입 URL로 이동만 하며, Authorization Code·토큰·Redirect URI는 백엔드에서만 처리한다.

| 경로 | 렌더링 | 설명 | 주요 기능 |
|------|--------|------|-----------|
| `/login` | CSR | 로그인 | OAuth: 소셜 로그인 버튼이 백엔드 `GET /api/v1/auth/{provider}`(또는 동일 계약)로 이동. URL에 `?next=`가 있으면 진입 링크에 전달; **안전 여부는 백엔드**가 `resolveSafeNextPath`로 검증. Provider 설정은 백엔드에만 둠. 이메일 로그인(해당 시) |
| `/oauth/callback` | CSR | OAuth 성공 콜백 | 백엔드가 `FRONTEND_OAUTH_SUCCESS_CALLBACK_PATH`로 302(`Set-Cookie` + `?next=`). `useAuth().refresh()`로 Authenticated 마킹·`/me` 재조회 후 `next`(없으면 `/recipe`)로 `replace` |
| `/oauth/error` | CSR | OAuth 실패 안내 | 백엔드가 `FRONTEND_OAUTH_ERROR_PATH`로 302. `errorCode`/`errorMessage` 또는 `error`/`error_description`, 선택 `next` → `InfoScreen`, `로그인으로 돌아가기`에 `next` 유지 |

회원가입 `/signup`은 명세·OpenAPI에 따라 추가될 수 있으나, 현재 `client/src/app`에는 해당 `page.tsx`가 없다.

### 3.2 루트·마케팅

| 경로 | 렌더링 | 설명 |
|------|--------|------|
| `/` | SSR | `client/src/app/page.tsx`에서 `redirect('/recipe')`만 수행한다. 별도 랜딩·마케팅 페이지는 없다. |

독립 마케팅 경로(`/about`, `/pricing` 등)는 도입 시 SSG 등으로 정의할 수 있으며, 현재 라우트 파일은 없다.

### 3.3 핵심 기능

#### 레시피 탭 (`/recipe`)

| 경로 | 컴포넌트 | 렌더링 | 설명 |
|------|----------|--------|------|
| `/recipe` | RecipeMainPage | ISR | `ISR_FETCH_PERIODIC`(300초). 레시피 메인 |
| `/recipe/search` | RecipeListPage | SSR | `searchParams`에 따라 서버에서 목록·카테고리 조회 후 하이드레이션 |
| `/recipe/filter` | RecipeFilterPage | ISR | `ISR_FETCH_PERIODIC`(300초). 카테고리 필터 UI(별도 `/recipe/category` 라우트는 없음) |
| `/recipe/[id]` | RecipeDetailPage | 온디맨드 ISR | `ISR_FETCH_ON_DEMAND`, `generateStaticParams`(size 10). `POST /api/revalidate`(본문 `{ secret, path }`) 웹훅으로 `revalidatePath` |

#### 챗봇 탭 (`/chatbot`)

| 경로 | 컴포넌트 | 렌더링 | 설명 |
|------|----------|--------|------|
| `/chatbot/list` | ChatbotConversationListPage | CSR | 대화 목록 페이지 |
| `/chatbot/[id]` | ChatbotConversationPage | CSR | 대화 페이지 (메시지 전송·응답 스트림은 SSE, §5.5) |

#### 재료 (`/ingredient`)

| 경로 | 컴포넌트 | 렌더링 | 설명 |
|------|----------|--------|------|
| `/ingredient/filter` | IngredientFilterPage | ISR | 재료 필터/선택 페이지 (보관함 재료 추가 시 진입, `?type=owned\|favorites`) |

#### 보관함 탭 (`/inventory`)

| 경로 | 컴포넌트 | 렌더링 | 설명 |
|------|----------|--------|------|
| `/inventory/ingredients/favorite` | InventoryFavoriteIngredientsPage | CSR | 관심 재료 목록 |
| `/inventory/ingredients/owned` | InventoryOwnedIngredientsPage | CSR | 보유 재료 목록 |
| `/inventory/recipes/favorite` | InventoryFavoriteRecipesPage | CSR | 관심 레시피 목록 |

#### 마이페이지 탭 (`/mypage`)

| 경로 | 컴포넌트 | 렌더링 | 설명 |
|------|----------|--------|------|
| `/mypage` | MypageMainPage | CSR | `'use client'`, `useAuth` 기반 마이페이지 |
| `/mypage/profile` | ProfilePage | CSR | 닉네임 수정 |
| `/mypage/activity` | ActivityPage | CSR | 활동 내역 |

---

## 4. 성능 목표

### 4.1 Web Vitals

| 지표 | 목표 |
|------|------|
| LCP (Largest Contentful Paint) | < 2.5초 |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

---

## 5. 핵심 라이브러리 명세

프론트엔드 패키지 루트는 `client/`이며, App Router(`client/src/app/`) · 공용 컴포넌트(`client/src/components/`) 외에 아래의 **핵심 라이브러리**를 `client/src/lib/` 이하에 둔다.

**경로 표기 규칙**: 아래 표의 경로는 모두 **저장소 루트 기준**이다. `*`는 해당 디렉터리 내의 임의의 파일·하위 경로를 의미하고, **굵게 표시된 경로**는 디렉터리(그룹)를 의미하며 그 아래 행들이 해당 디렉터리 내부 파일·세부 경로와 역할을 정의한다. 백엔드 엔드포인트 경로는 `../../backend/spec/backend_architecture_spec_producer.md` §1.1과 일치한다.

### 5.1 API 클라이언트 (`client/src/lib/api/`)

백엔드 REST API 호출용 클라이언트. 저수준 fetch 래퍼·공통 인프라는 `client/src/lib/api/` 직속에, 도메인별 API 래퍼는 `client/src/lib/api/domains/`에, SSR 시 들어오는 요청 헤더(쿠키·Correlation-Id·Accept-Language 등) 전파·401 처리 유틸은 `client/src/lib/api/server/`에 둔다. `accessToken`/`refreshToken` HttpOnly 쿠키는 브라우저에서 `credentials: 'include'`로, SSR에서는 `Cookie` 헤더 수동 전달(`withForwardedHeaders`)로 백엔드에 전달한다. 도메인 API 함수는 모두 마지막 인자로 `fetchOptions?: RequestOptions`를 받아 헤더·`signal`·`timeoutMs`·`retry`·`correlationId`를 호출 단위로 제어할 수 있다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/api/** | 백엔드 REST API 호출 클라이언트 묶음 (저수준 인프라) |
| client/src/lib/api/http-client.ts | fetch 래퍼. baseURL, `credentials: 'include'`(access/refresh 쿠키 자동 포함), Content-Type, 공통 에러 변환·Correlation-Id 헤더 주입, 인터셉터·타임아웃·재시도. SSR에서 `RequestOptions`의 `next`·`cache`를 Data Cache에 전달. SSR·빌드 시 `INTERNAL_API_SECRET`이 설정되면 `X-Internal-Api-Secret` 헤더 주입(`server/server-fetch.interceptor.ts`). **CSR**에서 API **401** 시 `POST /api/v1/auth/refresh` 1회(인스턴스 락)·원 요청 재시도. `RequestOptions`·`HttpClient`·`createHttpClient`·기본 `httpClient` export |
| client/src/lib/api/server/server-fetch.interceptor.ts | SSR·빌드 `HttpClient` 요청 인터셉터. `INTERNAL_API_SECRET` → `X-Internal-Api-Secret` (producer 내부 API 레이트 리밋 버킷) |
| client/src/lib/api/endpoints.ts | 엔드포인트 상수·경로 빌더 (예: `/api/v1/recipes`, `/api/v1/recipes/:id`, `/api/v1/chatbot/messages`) |
| client/src/lib/api/error.ts | `ApiError` 클래스, HTTP 상태 → 에러 타입 매핑, 사용자 노출 메시지 변환 |
| client/src/lib/api/error.parser.ts | API 응답 에러 바디 파싱·정규화 유틸 |
| client/src/lib/api/correlation-id.ts | 클라이언트 Correlation-ID 생성·전파 유틸 |
| client/src/lib/api/query.ts | URL 쿼리 파라미터 직렬화·정규화 유틸 |
| **client/src/lib/api/domains/** | 도메인별 API 래퍼 묶음. 모든 함수는 `fetchOptions?: RequestOptions`를 옵셔널로 받음 |
| client/src/lib/api/domains/index.ts | 도메인 API 배럴 export(`@/lib/api/domains` 단축 import 제공) |
| client/src/lib/api/domains/auth.api.ts | 로그아웃 (`POST /api/v1/auth/logout`, 204) |
| client/src/lib/api/domains/users.api.ts | 유저 프로필 조회·닉네임 수정 (`GET /api/v1/users/me`, `PATCH /api/v1/users/me/nickname`) |
| client/src/lib/api/domains/recipes.api.ts | 레시피 목록·상세·검색·카테고리·개인화 추천 (`GET /api/v1/recipes`, `GET /api/v1/recipes/recommended`, `GET /api/v1/recipes/categories`, `GET /api/v1/recipes/search`, `POST /api/v1/recipes/search-queries`, `GET /api/v1/recipes/:recipeId`) |
| client/src/lib/api/domains/ingredients.api.ts | 재료 목록·검색 (`GET /api/v1/ingredients`, `GET /api/v1/ingredients/search`) |
| client/src/lib/api/domains/inventory.api.ts | 유저 보관함 조회(보유/관심 재료 + 관심 레시피) + 관심 레시피 ID 전용 조회 + 보유/관심 재료 변경 + 관심 레시피 추가/삭제 (`GET /api/v1/users/me/inventory`, `GET /api/v1/users/me/favorite-recipes/ids`, `PUT/POST/DELETE /api/v1/users/me/inventory/ingredients/{owned\|favorites}`, `POST/DELETE /api/v1/users/me/inventory/recipes/favorites`) |
| client/src/lib/api/domains/chatbot.api.ts | 챗봇 대화 목록·상세 조회 (`GET /api/v1/chatbot/conversations`, `GET /api/v1/chatbot/conversations/:id`). SSE 전송은 §5.5 sse-client 사용 |
| **client/src/lib/api/server/** | SSR 전용. `'server-only'`로 잠긴 헤더 전달 유틸. 도메인 API 함수에 합쳐 들어오는 요청의 쿠키·Correlation-Id·Accept-Language를 백엔드로 그대로 전파 |
| client/src/lib/api/server/index.ts | 서버 전용 유틸 배럴 export(`@/lib/api/server`) |
| client/src/lib/api/server/forward-headers.ts | 저수준 빌더: `buildForwardCookieHeader()`(들어오는 쿠키 → `Cookie` 헤더 직렬화), `getInboundCorrelationId()`(`X-Correlation-Id` 패스스루), `getInboundAcceptLanguage()`(로케일 패스스루) |
| client/src/lib/api/server/with-forwarded-headers.ts | `withForwardedHeaders<T extends RequestOptions>(options?, forward?)` — `RequestOptions`에 SSR 헤더를 병합한 옵션을 반환. 호출자 헤더 우선, 기본 forward는 `['cookie', 'correlationId']`, 옵트인으로 `'acceptLanguage'`. 사용 예: `await searchRecipes(query, await withForwardedHeaders())` |
| client/src/lib/api/server/server-fetch-wrapper.ts | `serverFetchWrapper({ fetch, currentUrl })` — SSR API 호출 공통 래퍼. `ApiError` **401** 시 `buildSsrRefreshBridgeUrl(currentUrl)`로 `redirect`. 그 외 에러는 호출자에게 전달 |
| client/src/lib/api/server/isr-fetch.server.ts | `fetchForIsr({ fetcher, fallback })` — ISR 페이지·`generateStaticParams`용 fetch 예외 래퍼. 재검증 주기는 fetcher 내부 `ISR_FETCH_*` 옵션으로 선언. `CI=true`일 때 fetch 실패 시 fallback, 그 외 throw(stale 유지·로컬 빌드 실패) |
| client/src/app/api/auth/refresh-bridge/route.ts | SSR refresh 브리지(`GET`). 들어온 `Cookie`로 `POST /api/v1/auth/refresh`를 호출하고, 응답 `Set-Cookie`를 브라우저로 전달. 성공 시 `next`(상대 경로만)로 복귀, 실패 시 `buildLoginUrl(next, sessionExpired=true)` |
| client/src/app/api/revalidate/route.ts | 온디맨드 ISR 웹훅(`POST`). 본문 `{ secret, path }` 검증 후 `revalidatePath(path)` 호출. `path`는 `/`로 시작하는 앱 상대 경로(`..`·`//` 거부). `secret`은 서버 환경 변수 `REVALIDATE_SECRET`과 일치해야 함. `401`(secret 불일치), `400`(path 유효성 실패), `500`(secret 미설정) |

### 5.2 인증 (`client/src/lib/auth/`, `client/src/proxy.ts`)

OAuth는 **백엔드 주도** 흐름을 따른다(§3.1, `../../backend/guidelines/oauth_implementation_guidelines.md`). 프론트엔드는 Proxy-SSR-CSR 책임 분리로 인증을 처리한다: **Proxy는 refreshToken 존재 여부만 검사**, **SSR/CSR은 401 시 refresh를 수행**, **refresh 실패 시 로그인 리다이렉트로 수렴**. Authorization Code·토큰 교환은 백엔드가 담당한다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/auth/** | 인증 상태·세션·보호 라우트 |
| client/src/lib/auth/providers.ts | OAuth Provider 식별자 상수(`google` \| `kakao` \| `naver`), 진입 URL 빌드(`buildOAuthEntryUrl`, 비어 있지 않은 `next`면 `?next=` — 검증은 백엔드) |
| client/src/lib/auth/routes.ts | 보호 경로·`LOGIN_PATH`, `OAUTH_CALLBACK_PATH`, `NEXT_QUERY_PARAM`, `SESSION_EXPIRED_QUERY_PARAM`, `SSR_REFRESH_BRIDGE_PATH`, `SSR_REFRESH_GUARD_QUERY_PARAM`, `buildLoginUrl`, `buildSsrRefreshBridgeUrl`, `resolveSafeNextPath` |
| client/src/lib/auth/session.ts | access/refresh 쿠키 이름 re-export(`@/lib/constants/auth.constants`) 및 `fetchCurrentUser` re-export |
| client/src/lib/auth/session.server.ts | `'server-only'`. `hasAuthCookie()`(refresh 쿠키 존재), `getServerSession()`(`GET /api/v1/users/me`, 401→`null`) |
| client/src/lib/auth/session.client.ts | CSR 전용 세션 유틸. 클라이언트에서 현재 유저 조회·캐시 연동 |
| client/src/lib/auth/auth-context.tsx | `AuthProvider`(Client Component), `useAuth()` 훅 — 현재 유저·로그인 상태 제공 |
| client/src/lib/auth/protected-route.tsx | 보호 라우트 래퍼 컴포넌트(비로그인 시 `/login` 리다이렉트) |
| client/src/lib/auth/protected-action.ts | 액션 단위 인증 가드 훅(`useProtectedAction`). 비로그인 시 `buildLoginUrl(pathname+search)`로 로그인 이동, 인증 시 전달한 액션 실행 |
| **client/src/proxy.ts** | Next.js 16 **Proxy** 핸들러(`middleware.ts` 대체). `isProtectedPath` 기준으로 **`/chatbot`·`/inventory`·`/mypage/...`(루트 `/mypage` 제외)** 만 검사 대상이며 **`refreshToken` 쿠키 존재 여부**를 확인한다(`config.matcher`는 해당 경로와 동기화) |

### 5.3 데이터 페칭 / React Query (`client/src/lib/queries/`, `client/src/app/layout.tsx`)

React Query(TanStack Query) 기반. 쿼리 키 계층화·`staleTime`·`cacheTime` 규칙은 `../guidelines/frontend_development_guidelines.md` §5에 정의되어 있다. **쿼리·뮤테이션 실패 시 전역 Toast**는 `QueryCache`/`MutationCache`의 `onError`에서 처리한다(§5.4, `global-query-error-toast.ts`).

| 경로 | 역할 |
|------|------|
| **client/src/lib/queries/** | React Query `QueryClient` 공급·쿼리 키·훅·전역 오류 토스트 어댑터 |
| client/src/lib/queries/query-client.provider.tsx | `AppQueryClientProvider`(Client). `QueryClientProvider` + devtools, SSR-safe `QueryClient` 생성. `QueryCache`/`MutationCache`에 `onError` 등록 → §5.4 `notifyApiError` 연동 |
| client/src/lib/queries/global-query-error-toast.ts | `showGlobalQueryErrorToast` / `showGlobalMutationErrorToast` — 전역 `onError`에서 `notifyApiError` 호출, `meta`로 스킵·제목 오버라이드(§5.4) |
| client/src/lib/queries/react-query-meta.d.ts | TanStack `Register` 확장 — `queryMeta`·`mutationMeta`에 `suppressGlobalErrorToast`, `errorToastTitle` |
| client/src/lib/queries/recipe.queries.ts | `recipeQueries` 키, `useRecipeSearchInfinite` / `useRecommendedRecipes` |
| client/src/lib/queries/ingredient.queries.ts | `ingredientQueries` 키, `useIngredientSearchInfinite` |
| client/src/lib/queries/auth.queries.ts | `authQueries` 키, `useLogoutMutation` — `POST /api/v1/auth/logout` 래핑, `meta.errorToastTitle` 기본값 포함, 완료 시 `userQueries.me` 무효화 |
| client/src/lib/queries/user.queries.ts | `userQueries` 키, `useCurrentUser` / `useUpdateNickname` — `useCurrentUser`는 `meta.errorToastTitle`(세션 조회 실패 문구) 기본값 포함 |
| client/src/lib/queries/inventory.queries.ts | `inventoryQueries`·`favoriteRecipeQueries` 키, `useMyInventory` / `useMyFavoriteRecipeIds` + 보유·관심 재료·관심 레시피 변경 훅 |
| client/src/lib/queries/chatbot.queries.ts | `chatbotQueries` 키, `useConversationListInfinite` / `useConversationDetail`, `invalidateChatbotAfterStreamDone` |
| client/src/app/layout.tsx | 루트 레이아웃(서버 컴포넌트). `<html>`/`metadata`/폰트. `<body>` 안에서 **`AppQueryClientProvider` → `ToastProvider` → `AuthProvider` → `AppRootFrame`** 순으로 전역 클라이언트 트리를 합성한다(구 `client/src/lib/providers/root-providers.tsx`는 사용하지 않음). |

### 5.4 전역 Toast (`client/src/lib/toast/`, `client/src/components/ui/Toast/`)

라우트 단 치명 오류·404는 `error.tsx`·`global-error.tsx`·`not-found.tsx`의 `InfoScreen` 흐름을 유지하고, 복구 가능한 API·백그라운드 페칭·액션 실패는 Toast·`notifyApiError`로 처리한다. 역할 분담·`meta` 옵션·접근성은 `../guidelines/error_toast_guidelines.md`를 본다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/toast/** | Toast 상태·브리지·API 오류 → Toast 변환 |
| client/src/lib/toast/toast.provider.tsx | `ToastProvider`, `useToast` — reducer·`ToastViewport` 렌더, 마운트 시 `toast-bridge`에 enqueue 등록 |
| client/src/lib/toast/toast-bridge.ts | `registerToastEnqueue` / `enqueueToast` — Provider 미마운트 시 enqueue는 `null` 반환 |
| client/src/lib/toast/toast.types.ts | `ToastVariant`(`error` \| `warning` \| `info` \| `success`), `ToastItem`, `ToastEnqueueInput`, `ToastActionSpec` |
| client/src/lib/toast/toast-reducer.ts | `MAX_VISIBLE_TOASTS`, `toastReducer` — upsert(`dedupeKey` 동일 시 교체)·dismiss·clear |
| client/src/lib/toast/notify-api-error.ts | `notifyApiError` — `ApiError`/`unknown`→`getUserMessage`(`@/lib/api/error`), variant·title 추론, **2.5초 시간 기반 dedupe** + Toast 리스트 upsert용 `dedupeKey` |
| client/src/lib/toast/use-error-toast.ts | `useErrorToast()` — `notifyApiError` 편의 래퍼 |
| client/src/lib/toast/index.ts | `@/lib/toast` 배럴 export |
| **client/src/components/ui/Toast/** | Toast 카드·뷰포트(UI) |
| client/src/components/ui/Toast/ToastCard.tsx | 플로팅 카드. `error`는 `role="alert"`/`aria-live="assertive"`, 그 외 `status`/`polite`. `durationMs`(0이면 수동 닫기만)·닫기·선택 `action` |
| client/src/components/ui/Toast/ToastViewport.tsx | 고정 뷰포트(모바일 하단·데스크톱 우하단), 카드 스택·`z-index` |
| client/src/components/ui/Toast/index.ts | UI 배럴 export |

**Provider 순서**: `client/src/app/layout.tsx`에서 **`AppQueryClientProvider` → `ToastProvider` → `AuthProvider` → `AppRootFrame`(children)** — 쿼리 캐시 오류 콜백 시점에 Toast 브리지가 등록되도록 한다.

**React Query와의 관계**: §5.3 `client/src/lib/queries/query-client.provider.tsx`가 `QueryCache`/`MutationCache`의 `onError`에 `global-query-error-toast.ts` 핸들러를 연결한다. 개별 훅에서 전역 Toast를 끄거나 제목만 바꿀 때는 `meta.suppressGlobalErrorToast` / `meta.errorToastTitle`(`react-query-meta.d.ts`).

**단위 테스트**: `pnpm --filter client test:unit` — `client/src/**/*.unit.test.ts`(예: `toast-reducer`, `notify-api-error`).

### 5.5 챗봇 SSE 클라이언트 (`client/src/lib/chatbot/`)

SSE 구독·이벤트 파싱·스트림 UI용 진행 문구 파생까지 담당한다. `ChatbotStreamEvent` 등 DTO·이벤트 `type` 문자열의 계약은 `client/src/lib/types/chatbot.ts`에 두고, 백엔드·Redis 발행 형식은 `../../backend/spec/backend_architecture_spec_producer.md` §1.2 및 저장소 `server/shared/src/types/events/chatbot-stream-event.event.ts`와 맞춘다. OpenAI Function `function.name`과 동기화되는 도구 식별자는 서버 `server/consumer/.../chatbot-tools.definition.ts`와 클라이언트 `chatbot-tool-progress.ts`가 동일한 문자열을 쓴다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/chatbot/** | 챗봇 SSE 구독·스트림 상태·진행 문구(placeholder) 파생 |
| client/src/lib/chatbot/sse-client.ts | `POST /api/v1/chatbot/messages` fetch + `ReadableStream` 파서. SSE `data:` 라인 → JSON 디코딩, 재연결·취소 지원 |
| client/src/lib/chatbot/stream-events.ts | `ChatbotStreamEvent`의 타입 가드(`isChunkEvent` 등)·`parseStreamEvent`·SSE 프레임 파서. **타입 정의 본문은 `@/lib/types/chatbot`**, 이벤트 `type`은 `chunk` \| `done` \| `error` \| `tool_call` |
| client/src/lib/chatbot/use-chatbot-stream.ts | `useChatbotStream` 훅 — `sendMessage` 시 SSE 구독, `chunk` 누적 텍스트, `done`에서 `conversationId`·`suggestedRecipes`·`isCreditDepleted`, `tool_call`을 `activeToolCalls`에 병합, `hasReceivedFirstStreamEvent`(첫 유효 이벤트 수신 여부·요청 직후 placeholder 구간 판별), 언마운트·`cancel` 시 abort |
| client/src/lib/chatbot/chatbot-tool-progress.ts | 도구 `function.name` 상수(`CHATBOT_TOOL_FUNCTION_NAME`)·`getChatbotToolProgressLabel` — 스트림 `tool_call` 수신 시 사용자용 한국어 진행 문구(예: 레시피 검색 중). 서버 tools 정의와 **문자열 동기화 필수** |
| client/src/lib/chatbot/stream-progress-label.ts | `getStreamProgressLabel`·`GENERATING_REPLY_LABEL` — 스트리밍 중·본문 비어 있을 때: 첫 이벤트 전「답변 생성 중」, 이후 `activeToolCalls`의 `start`/`complete` 우선순위로 도구 라벨 또는 동일 생성 중 문구. 대화 페이지(`app/(main)/chatbot/[id]/page.tsx`)의 assistant placeholder와 동일 규칙 |

### 5.6 설정·환경 변수 (`client/src/lib/config/`)

| 경로 | 역할 |
|------|------|
| **client/src/lib/config/** | env 파생·런타임 조합 설정 |
| client/src/lib/config/env.ts | `NEXT_PUBLIC_*` 환경 변수 로드·검증(수동 파서). `apiBaseUrl`, `apiPrefix`, `sentryDsn`, `gaMeasurementId`, `siteUrl`, `runtime`/`isProduction`/`isDevelopment`, `validationErrors`·`assertEnv` |
| client/src/lib/config/app.config.ts | `getMetadataBase()` — `env.siteUrl`·Vercel URL 파생 |
| client/src/lib/config/sentry.config.ts | Sentry init 옵션(`getSentryInitOptions`, `createClientTracesSampler`, `isSentryEnabled`) |

### 5.6.1 고정 상수 (`client/src/lib/constants/`)

환경과 무관한 제품·계약 상수. `*.constants.ts` 네이밍.

| 경로 | 역할 |
|------|------|
| client/src/lib/constants/auth.constants.ts | Access·Refresh HttpOnly 쿠키 이름 — OpenAPI·Producer `auth-cookie.constants`와 동기화 |
| client/src/lib/constants/routes.constants.ts | 내부 라우트 경로(`RECIPE_SEARCH_PATH` 등) |
| client/src/lib/constants/app.constants.ts | 브랜드명·`SITE_DESCRIPTION`·`THEME_COLOR`·키워드 |
| client/src/lib/constants/oauth-error.constants.ts | `/oauth/error` 쿼리 키 |
| client/src/lib/constants/session-dedupe.constants.ts | 레시피 검색·조회 이벤트 `sessionStorage` dedupe 키 prefix·`SEARCH_QUERY_NO_KEYWORD` sentinel |

### 5.6.2 운영·UX 정책 (`client/src/lib/policy/`)

튜닝 가능한 값. `*.policy.ts` 네이밍. 분류 기준은 `agent/common/config_centralization_audit.md`.

| 경로 | 역할 |
|------|------|
| client/src/lib/policy/api.policy.ts | REST/SSE 타임아웃·재시도 정책 |
| client/src/lib/policy/cache.policy.ts | React Query `QUERY_DEFAULTS`·`QUERY_CACHE`(§4 성능 예산). Next.js ISR Data Cache용 `ISR_FETCH_PERIODIC`·`ISR_FETCH_ON_DEMAND`·`ISR_FETCH_REVALIDATE_SEC` |
| client/src/lib/policy/pagination.policy.ts | OpenAPI 기본 page size·limit |
| client/src/lib/policy/interaction.policy.ts | UI 디바운스(ms) |
| client/src/lib/policy/toast.policy.ts | 토스트 중복 억제(ms) |

### 5.7 타입·DTO (`client/src/lib/types/`)

백엔드 DTO와 1:1 대응되는 프론트엔드 타입. 백엔드 DTO 정의는 `../../backend/spec/backend_architecture_spec_producer.md` §1.1 참조.

| 경로 | 역할 |
|------|------|
| **client/src/lib/types/** | 프론트엔드 타입 정의 |
| client/src/lib/types/index.ts | 타입 배럴 export (`@/lib/types` 단축 import 제공) |
| client/src/lib/types/api.ts | `ApiResponse<T>`, `Paginated<T>`, 에러 응답 등 공통 래퍼 타입 |
| client/src/lib/types/auth.ts | `OAuthProvider`, `SessionUser` |
| client/src/lib/types/user.ts | `UserProfile`, 닉네임 변경 DTO |
| client/src/lib/types/recipe.ts | `Recipe`, `RecipeDetail`, `RecipeSummary`, `RecipeRecommendationItem`, `RecipeListQuery`, `RecipeSearchQuery`, `RecommendedRecipesQuery` |
| client/src/lib/types/ingredient.ts | `Ingredient`, `IngredientCategory`, 목록·검색 쿼리 타입 |
| client/src/lib/types/inventory.ts | `Inventory`(보유/관심 재료 구분 포함), `FavoriteRecipeIdsPayload` |
| client/src/lib/types/chatbot.ts | `Conversation`, `ConversationMessage`, `SuggestedRecipe`, `ChatbotStreamEvent` |

### 5.8 유틸 (`client/src/lib/utils/`)

| 경로 | 역할 |
|------|------|
| **client/src/lib/utils/** | 공통 유틸 |
| client/src/lib/utils/a11y.ts | 접근 이름 생성. `buildAriaLabel(type, name)` — 엘리먼트 유형별 `aria-label` 문구 규칙·빈 `name` 시 타입별 폴백. 컴포넌트는 `aria-label` 전용 prop 없이 필수/의미 prop으로 문자열을 만든 뒤 이 유틸만 사용 (`../guidelines/frontend_development_guidelines.md` §9) |
| client/src/lib/utils/search-params.ts | 페이지 `searchParams` 파싱 공용화. `resolveSearchParams`, `getSingleSearchParam`, `getMultiSearchParam`, `getTrimmedSearchParam`, `getFirstTrimmedSearchParam`으로 query 값 정규화·빈 문자열 제거·다중 키 fallback 처리 |
| client/src/lib/utils/cn.ts | Tailwind 클래스 머지(`clsx` + `tailwind-merge`) |
| client/src/lib/utils/isInternalNavHref.ts | 앱 내 경로 문자열 판별. `isInternalNavHref(href)` — `"/"`로 시작하고 `"//"`로 시작하지 않으면 true(Next.js `Link`·클라이언트 전환 대상). 프로토콜 상대 URL·외부 절대 URL·해시 전용 등은 false. 네비게이션 UI에서 `Link` vs `<a>` 분기의 단일 근거 (`../guidelines/frontend_development_guidelines.md` §1.1) |
| client/src/lib/utils/date.ts | 날짜·시간 포맷팅(요리 시간 표시 등) |
| client/src/lib/utils/image.ts | `blurDataURL`·반응형 `sizes` 헬퍼 (`next/image`용) |
| client/src/lib/utils/isNativeImageSrc.ts | `isNativeImageSrc(src)` — `data:`/`blob:`/`http(s):`·프로토콜 상대 URL은 네이티브 `<img>`, 앱 내 정적 경로는 `next/image` 분기 |
| client/src/lib/utils/logger.ts | 클라이언트 로그 래퍼, dev/prod 분기 |
| client/src/lib/utils/isr-fallback.ts | ISR CI 빌드 폴백용 빈 API 응답. `createEmptyPaginated<T>()`, `createEmptyDataList<T>()` |
| client/src/lib/utils/resolveErrorBoundaryMessage.ts | App Router `error.tsx`·`global-error.tsx`용 사용자 노출 메시지. `resolveErrorBoundaryMessage(error)` — `error.name`·`message`·`digest`를 합친 문자열에서 404·401/403·네트워크·fetch·timeout 등 키워드 휴리스틱으로 짧은 한글 문구를 고르고, 해당 없으면 일반 폴백 문구 반환 |

### 5.9 관측·모니터링 (`client/src/lib/observability/`)

Web Vitals 수집·성능 예산 초과 감지. 목표·예산은 §4에 정의되어 있다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/observability/** | 프론트엔드 모니터링 |
| client/src/lib/observability/web-vitals.ts | `web-vitals` 예산 초과 시 `logger.warn` |
| client/src/lib/observability/analytics.ts | 페이지 이동·사용자 이벤트 트래킹 래퍼 |
| client/src/lib/observability/analytics-events.ts | GA4 이벤트 이름·파라미터 상수 정의 |
| client/src/lib/observability/ga-dispatcher.ts | GA4 `gtag()` 호출 디스패처 (큐잉·배치) |
| client/src/lib/observability/sentry.client.ts | Sentry log sink(L4)·correlation 태그 헬퍼 — `Sentry.init`은 `instrumentation-client.ts` |
| client/src/lib/observability/api-error-sentry.ts | API 에러 발생 시 Sentry에 구조화된 이벤트 리포팅 |
| client/src/lib/observability/session-dedupe.ts | `runOncePerSession` — `sessionStorage` 기반 세션당 1회 콜백 실행(레시피 검색 쿼리·클릭·상세 조회 등 페이지에서 키·API 호출 직접 구성) |

### 5.10 메타데이터·SEO (`client/src/lib/metadata/`, `client/src/lib/policy/seo.policy.ts`)

App Router `metadata` / `generateMetadata`에서 공유하는 문자열 처리(길이 제한·공백 정규화). 루트·세그먼트별 메타 정의는 `client/src/app/layout.tsx` 및 각 `page.tsx`를 본다. 크롤링 정책·사이트맵은 App Router 내장 `robots.ts`·`sitemap.ts`로 제공한다.

| 경로 | 역할 |
|------|------|
| **client/src/lib/metadata/** | SEO·소셜 미리보기용 메타 문자열 유틸 |
| client/src/lib/metadata/meta-text.ts | `truncateForMeta(text, max)` — 연속 공백을 단일 공백으로 줄이고 `max`를 넘으면 말줄임(`…`) 처리. `description`·동적 `title` 조각(예: 검색 키워드)·Open Graph/Twitter 설명 길이 맞춤에 사용 |
| client/src/lib/policy/seo.policy.ts | 공개 sitemap 정적 경로·우선순위·`robots` disallow 접두·레시피 ID 상한(500). 경로는 `routes.constants`·`auth/routes` 재사용 |
| client/src/app/sitemap.ts | App Router `sitemap` — `seo.policy` 정적 경로 + `getRecipeStaticIds` 기반 레시피 상세 URL. `revalidate` 3600초 |
| client/src/app/robots.ts | App Router `robots` — production: `seo.policy` disallow + `sitemap.xml` 참조. 비-production: 전체 disallow |
