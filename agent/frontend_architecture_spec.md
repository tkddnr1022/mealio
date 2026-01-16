# 프론트엔드 페이지 목록 및 라우팅 구조

현재 레시피 추천 서비스의 아키텍처와 데이터 스키마를 분석하여, 대용량 트래픽에 최적화된 프론트엔드 구조를 제안합니다.

## 1. 라우팅 전략 (Next.js App Router 기반)

### 1.1 핵심 라우팅 원칙

- **Static Generation (SSG)** → SEO 중요 페이지, 자주 변하지 않는 콘텐츠
- **Incremental Static Regeneration (ISR)** → 레시피 상세, 인기 레시피 목록
- **Server-Side Rendering (SSR)** → 개인화된 대시보드, 실시간 데이터
- **Client-Side Rendering (CSR)** → 챗봇, 재료 관리 등 인터랙티브한 기능

## 2. 페이지 구조 및 라우팅 맵

```
app/
├── (auth)/                          # Auth Layout Group
│   ├── login/
│   │   └── page.tsx                 # [CSR] 로그인 페이지
│   ├── signup/
│   │   └── page.tsx                 # [CSR] 회원가입 페이지
│   └── oauth/
│       └── callback/
│           └── page.tsx             # [CSR] OAuth 콜백 처리
│
├── (marketing)/                     # Marketing Layout Group (Header + Footer)
│   ├── page.tsx                     # [SSG] 랜딩 페이지 (/)
│   ├── about/
│   │   └── page.tsx                 # [SSG] 서비스 소개
│   └── pricing/
│       └── page.tsx                 # [SSG] 요금제 (필요시)
│
├── (main)/                          # Main App Layout Group
│   ├── layout.tsx                   # 공통 레이아웃 (Navigation)
│   │
│   ├── home/
│   │   └── page.tsx                 # [SSR] 개인화된 홈 대시보드
│   │
│   ├── recipes/
│   │   ├── page.tsx                 # [ISR] 레시피 목록 (필터/검색)
│   │   ├── [id]/
│   │   │   └── page.tsx             # [ISR] 레시피 상세 (동적 OG 이미지)
│   │   ├── new/
│   │   │   └── page.tsx             # [CSR] 새 레시피 등록
│   │   └── recommended/
│   │       └── page.tsx             # [SSR] AI 추천 레시피
│   │
│   ├── ingredients/
│   │   ├── page.tsx                 # [CSR] 내 재료 관리
│   │   └── search/
│   │       └── page.tsx             # [CSR] 재료 검색
│   │
│   ├── chatbot/
│   │   └── page.tsx                 # [CSR] AI 챗봇 인터페이스
│   │
│   ├── favorites/
│   │   └── page.tsx                 # [SSR] 즐겨찾기 목록
│   │
│   ├── history/
│   │   ├── page.tsx                 # [SSR] 조리 히스토리
│   │   └── search/
│   │       └── page.tsx             # [SSR] 검색 히스토리
│   │
│   └── profile/
│       ├── page.tsx                 # [SSR] 프로필 조회
│       ├── edit/
│       │   └── page.tsx             # [CSR] 프로필 수정
│       └── preferences/
│           └── page.tsx             # [CSR] 선호도 설정
│
├── api/                             # API Routes (Next.js Backend)
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts             # NextAuth.js 설정
│   ├── revalidate/
│   │   └── route.ts                 # ISR 재검증 웹훅
│   └── health/
│       └── route.ts                 # 헬스체크
│
└── (error)/
    ├── not-found.tsx                # 404 페이지
    └── error.tsx                    # 에러 페이지
```

## 3. 상세 페이지 명세

### 3.1 인증 관련 (CSR)

| 경로 | 렌더링 | 설명 | 주요 기능 |
|------|--------|------|-----------|
| `/login` | CSR | 로그인 | OAuth(구글, 카카오), 이메일 로그인 |
| `/signup` | CSR | 회원가입 | 약관 동의, 초기 선호도 설정 |
| `/oauth/callback` | CSR | OAuth 콜백 | 토큰 처리 후 리다이렉트 |

### 3.2 마케팅 페이지 (SSG)

| 경로 | 렌더링 | 설명 | 최적화 포인트 |
|------|--------|------|--------------|
| `/` | SSG | 랜딩 페이지 | Hero 섹션, 주요 기능, CTA, 빌드 타임 생성 |
| `/about` | SSG | 서비스 소개 | 팀 소개, 비전, 완전 정적 |

### 3.3 핵심 기능 페이지

#### 레시피 관련

| 경로 | 렌더링 | 설명 | 캐싱 전략 |
|------|--------|------|-----------|
| `/home` | SSR | 개인화 대시보드 | Redis 캐시 (user:${id}:dashboard, TTL: 5분) |
| `/recipes` | ISR | 레시피 목록 | revalidate: 300초, Redis 쿼리 캐시 |
| `/recipes/[id]` | ISR | 레시피 상세 | revalidate: 600초, CDN 캐싱 24시간 |
| `/recipes/new` | CSR | 레시피 등록 | 이미지 업로드 → S3, 메타데이터 → RDS |
| `/recipes/recommended` | SSR | AI 추천 | OpenAI API 호출, Redis 결과 캐싱 (TTL: 1시간) |

**레시피 상세 페이지 최적화:**

```typescript
// app/(main)/recipes/[id]/page.tsx
export async function generateStaticParams() {
  // 상위 1000개 인기 레시피만 빌드 타임에 생성
  const topRecipes = await getTopRecipes(1000);
  return topRecipes.map(recipe => ({ id: recipe.id.toString() }));
}

export const revalidate = 600; // 10분마다 ISR

export async function generateMetadata({ params }): Promise<Metadata> {
  const recipe = await getRecipe(params.id);
  return {
    title: recipe.title,
    description: recipe.description,
    openGraph: {
      images: [recipe.image_url],
    },
  };
}
```

#### 재료 관리

| 경로 | 렌더링 | 설명 | 데이터 소스 |
|------|--------|------|------------|
| `/ingredients` | CSR | 내 재료 관리 | MongoDB (UserIngredient), 실시간 업데이트 |
| `/ingredients/search` | CSR | 재료 검색 | MySQL (Ingredient), ElasticSearch 추천 |

#### AI 챗봇

| 경로 | 렌더링 | 설명 | 특이사항 |
|------|--------|------|----------|
| `/chatbot` | CSR | 챗봇 인터페이스 | WebSocket 또는 SSE, Kafka로 비동기 처리 |

**챗봇 아키텍처:**

```
사용자 메시지 → API → Kafka (chatbot-requests) → Consumer → OpenAI API 
→ Kafka (chatbot-responses) → SSE → 클라이언트
```

#### 개인화 페이지

| 경로 | 렌더링 | 설명 | 접근 제어 |
|------|--------|------|----------|
| `/favorites` | SSR | 즐겨찾기 | Middleware 인증 체크 |
| `/history` | SSR | 조리 히스토리 | MongoDB EventLog 조회 |
| `/profile` | SSR | 프로필 | MySQL User 테이블 |
| `/profile/edit` | CSR | 프로필 수정 | Optimistic UI 업데이트 |

## 4. 대용량 트래픽 대응 전략

### 4.1 레이어별 캐싱 전략

```
┌─────────────────────────────────────────────────┐
│  CloudFlare CDN (Edge Caching)                  │
│  - 정적 자산: 1년                                │
│  - ISR 페이지: 24시간 (stale-while-revalidate)  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Vercel Edge Network                            │
│  - Next.js ISR 캐시                             │
│  - Edge Functions (지역별 라우팅)               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Application Level (Redis)                      │
│  - API 응답 캐싱: 5-60분                        │
│  - 세션 데이터: 7일                              │
│  - 레시피 추천 결과: 1시간                       │
└─────────────────────────────────────────────────┘
```

### 4.2 페이지별 로딩 전략

**크리티컬 렌더링 패스 최적화:**

```typescript
// 레시피 목록 페이지 - 점진적 로딩
export default async function RecipesPage() {
  // 1. 초기 20개만 SSR로 즉시 표시
  const initialRecipes = await getRecipes({ limit: 20 });
  
  return (
    <>
      <RecipeGrid recipes={initialRecipes} />
      {/* 2. 나머지는 클라이언트에서 Infinite Scroll */}
      <InfiniteLoader endpoint="/api/recipes" offset={20} />
    </>
  );
}
```

**이미지 최적화:**

```typescript
// Next.js Image 컴포넌트 활용
<Image
  src={recipe.image_url}
  alt={recipe.title}
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={recipe.blur_hash} // S3 업로드 시 생성
  loading="lazy"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 4.3 상태 관리 및 데이터 페칭

**React Query (TanStack Query) 구조:**

```typescript
// lib/queries/recipe.ts
export const recipeQueries = {
  all: ['recipes'] as const,
  lists: () => [...recipeQueries.all, 'list'] as const,
  list: (filters: RecipeFilters) => 
    [...recipeQueries.lists(), filters] as const,
  details: () => [...recipeQueries.all, 'detail'] as const,
  detail: (id: string) => [...recipeQueries.details(), id] as const,
};

// 컴포넌트에서 사용
const { data, isLoading } = useQuery({
  queryKey: recipeQueries.detail(recipeId),
  queryFn: () => fetchRecipe(recipeId),
  staleTime: 5 * 60 * 1000, // 5분
  cacheTime: 30 * 60 * 1000, // 30분
});
```

### 4.4 코드 스플리팅 전략

```typescript
// app/(main)/layout.tsx
import dynamic from 'next/dynamic';

// 챗봇은 필요할 때만 로드
const ChatbotWidget = dynamic(
  () => import('@/components/ChatbotWidget'),
  { 
    ssr: false,
    loading: () => <ChatbotSkeleton />
  }
);

// 무거운 에디터는 route 기반으로 분리
const RecipeEditor = dynamic(
  () => import('@/components/RecipeEditor'),
  { ssr: false }
);
```

## 5. 모니터링 및 성능 지표

### 5.1 핵심 Web Vitals 목표

- **LCP (Largest Contentful Paint)**: < 2.5초
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### 5.2 페이지별 성능 예산

| 페이지 | 초기 로드 | TTI | 번들 사이즈 |
|--------|----------|-----|------------|
| 랜딩 | < 1.5초 | < 2초 | < 100KB |
| 레시피 목록 | < 2초 | < 3초 | < 150KB |
| 레시피 상세 | < 1.8초 | < 2.5초 | < 120KB |
| 챗봇 | < 2.5초 | < 3.5초 | < 200KB |

이 구조는 Kafka 기반 이벤트 드리븐 아키텍처와 완벽하게 통합되며, Redis 캐싱과 CDN을 활용하여 대용량 트래픽을 효과적으로 처리할 수 있습니다.
