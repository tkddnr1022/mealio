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
| (main) · 레시피 탭 | `/recipe/search` | `(main)/recipe/search/page.tsx` | ISR | RecipeSearchListPage — 레시피 검색 결과 |
| (main) · 레시피 탭 | `/recipe/[id]` | `(main)/recipe/[id]/page.tsx` | ISR | RecipeDetailPage — 레시피 상세 |
| (main) · 챗봇 탭 | `/chatbot/list` | `(main)/chatbot/list/page.tsx` | CSR | ChatbotConversationListPage — 대화 목록 |
| (main) · 챗봇 탭 | `/chatbot/[id]` | `(main)/chatbot/[id]/page.tsx` | CSR | ChatbotConversationPage — 대화 |
| (main) · 보관함 탭 | `/inventory/favorite` | `(main)/inventory/favorite/page.tsx` | CSR | InventoryFavoriteListPage — 관심 재료 목록 |
| (main) · 보관함 탭 | `/inventory/owned` | `(main)/inventory/owned/page.tsx` | CSR | InventoryOwnedListPage — 보유 재료 목록 |
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
| `/recipe/search` | RecipeSearchListPage | ISR | 레시피 목록 페이지 (검색 결과) |
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
