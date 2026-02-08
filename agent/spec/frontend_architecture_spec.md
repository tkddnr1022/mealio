# 프론트엔드 아키텍처 명세서

에이전트가 **무엇을** 개발할지 **페이지·라우팅·파일 단위**로 정의하는 정형 명세이다. **어떻게** 개발할지(원칙, 방법론, 구현 가이드)는 `../guidelines/frontend_development_guidelines.md`를 참고하고, 스펙 주도 개발 원칙은 `../guidelines/spec_driven_development_guidelines.md`를 참고한다.

아래 경로는 **저장소 루트 기준**이며, Next.js App Router 기준으로 `app/` 루트를 전제로 한다.

---

## 1. 라우팅 전략 (Next.js App Router 기반)

| 전략 | 적용 대상 |
|------|------------|
| **SSG** | SEO 중요 페이지, 자주 변하지 않는 콘텐츠 (랜딩, about, pricing) |
| **ISR** | 레시피 목록·상세, 인기 레시피 |
| **SSR** | 개인화 대시보드, 실시간성 필요 페이지 (홈, 즐겨찾기, 히스토리, 프로필) |
| **CSR** | 챗봇, 재료 관리, 로그인/회원가입, 프로필 수정 등 인터랙티브 기능 |

---

## 2. 페이지 구조 및 라우팅 맵

```
app/
├── (auth)/                          # Auth Layout Group
│   ├── login/
│   │   └── page.tsx                 # [CSR] 로그인
│   ├── signup/
│   │   └── page.tsx                 # [CSR] 회원가입
│   └── oauth/
│       └── callback/
│           └── page.tsx             # [CSR] OAuth 로그인 성공 후 백엔드 리다이렉트 도착지 (쿠키 이미 설정됨, /home 등으로 이동 또는 성공 표시)
│
├── (marketing)/                     # Marketing Layout Group
│   ├── page.tsx                     # [SSG] 랜딩 (/)
│   ├── about/
│   │   └── page.tsx                 # [SSG] 서비스 소개
│   └── pricing/
│       └── page.tsx                 # [SSG] 요금제 (필요시)
│
├── (main)/                          # Main App Layout Group
│   ├── layout.tsx                   # 공통 레이아웃 (Navigation)
│   ├── home/
│   │   └── page.tsx                 # [SSR] 개인화 홈 대시보드
│   ├── recipes/
│   │   ├── page.tsx                 # [ISR] 레시피 목록
│   │   ├── [id]/
│   │   │   └── page.tsx             # [ISR] 레시피 상세
│   │   ├── new/
│   │   │   └── page.tsx             # [CSR] 새 레시피 등록
│   │   └── recommended/
│   │       └── page.tsx             # [SSR] AI 추천 레시피
│   ├── ingredients/
│   │   ├── page.tsx                 # [CSR] 내 재료 관리
│   │   └── search/
│   │       └── page.tsx             # [CSR] 재료 검색
│   ├── chatbot/
│   │   └── page.tsx                 # [CSR] AI 챗봇
│   ├── favorites/
│   │   └── page.tsx                 # [SSR] 즐겨찾기 목록
│   ├── history/
│   │   ├── page.tsx                 # [SSR] 조리 히스토리
│   │   └── search/
│   │       └── page.tsx             # [SSR] 검색 히스토리
│   └── profile/
│       ├── page.tsx                 # [SSR] 프로필 조회
│       ├── edit/
│       │   └── page.tsx             # [CSR] 프로필 수정
│       └── preferences/
│           └── page.tsx             # [CSR] 선호도 설정
│
├── api/                             # API Routes
│   ├── revalidate/
│   │   └── route.ts                 # ISR 재검증 웹훅
│   └── health/
│       └── route.ts                 # 헬스체크
│
└── (error)/
    ├── not-found.tsx                # 404
    └── error.tsx                    # 에러 페이지
```

---

## 3. 상세 페이지 명세

### 3.1 인증 (CSR)

OAuth는 **백엔드 주도** 흐름을 사용한다. 상세는 `../guidelines/oauth_implementation_guidelines.md` 및 `backend_architecture_spec_producer.md` 1.3 참고. 프론트엔드는 로그인 진입 URL로 이동만 하며, Authorization Code·토큰·Redirect URI는 백엔드에서만 처리한다.

| 경로 | 렌더링 | 설명 | 주요 기능 |
|------|--------|------|-----------|
| `/login` | CSR | 로그인 | OAuth: 소셜 로그인 버튼 클릭 시 백엔드 `GET /auth/{provider}`(또는 `/api/v1/auth/{provider}`)로 이동(링크 또는 `location` 할당). Provider별 설정(Client ID, Redirect URI 등)은 백엔드에만 둠. 이메일 로그인(해당 시) |
| `/signup` | CSR | 회원가입 | 약관 동의, 초기 선호도 설정 |
| `/oauth/callback` | CSR | OAuth 로그인 성공 도착 페이지 | 백엔드가 Code 처리·JWT 쿠키 설정 후 302로 리다이렉트하는 URL. 프론트에서는 토큰 처리 없음(쿠키 이미 설정됨). /home 등으로 리다이렉트 또는 로그인 성공 표시 |

### 3.2 마케팅 (SSG)

| 경로 | 렌더링 | 설명 |
|------|--------|------|
| `/` | SSG | 랜딩 페이지 |
| `/about` | SSG | 서비스 소개 |
| `/pricing` | SSG | 요금제 (필요시) |

### 3.3 핵심 기능

#### 레시피

| 경로 | 렌더링 | 설명 |
|------|--------|------|
| `/home` | SSR | 개인화 대시보드 |
| `/recipes` | ISR | 레시피 목록 (필터/검색) |
| `/recipes/[id]` | ISR | 레시피 상세 (동적 OG 이미지) |
| `/recipes/new` | CSR | 레시피 등록 |
| `/recipes/recommended` | SSR | AI 추천 레시피 |

#### 재료

| 경로 | 렌더링 | 설명 |
|------|--------|------|
| `/ingredients` | CSR | 내 재료 관리 |
| `/ingredients/search` | CSR | 재료 검색 |

#### 챗봇

| 경로 | 렌더링 | 설명 |
|------|--------|------|
| `/chatbot` | CSR | AI 챗봇 인터페이스 (SSE/WebSocket) |

#### 개인화

| 경로 | 렌더링 | 설명 |
|------|--------|------|
| `/favorites` | SSR | 즐겨찾기 목록 |
| `/history` | SSR | 조리 히스토리 |
| `/history/search` | SSR | 검색 히스토리 |
| `/profile` | SSR | 프로필 조회 |
| `/profile/edit` | CSR | 프로필 수정 |
| `/profile/preferences` | CSR | 선호도 설정 |

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
| 레시피 목록 | < 2초 | < 3초 | < 150KB |
| 레시피 상세 | < 1.8초 | < 2.5초 | < 120KB |
| 챗봇 | < 2.5초 | < 3.5초 | < 200KB |

측정 방법·캐싱·로딩 전략 등 구현 가이드는 `../guidelines/frontend_development_guidelines.md` 참고.
