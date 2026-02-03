# 프론트엔드 개발 지침

에이전트 주도 개발 시 **어떻게** 개발할지 원칙과 방법론을 제시하는 **비정형 문서**이다. **무엇을** 개발할지(페이지·라우팅·파일 단위 명세)는 `../spec/frontend_architecture_spec.md`를 참고한다.

---

## 1. 라우팅 구현 (Next.js App Router)

- **SSG**: `getStaticProps` 대신 기본 정적 생성. `generateStaticParams`로 동적 세그먼트 정적 경로 정의.
- **ISR**: `revalidate` export로 재검증 주기 설정. `/api/revalidate` 웹훅으로 온디맨드 재검증.
- **SSR**: 기본이 서버 컴포넌트. `cookies()`, `headers()` 등으로 개인화 데이터 조회.
- **CSR**: `'use client'` + 클라이언트 전용 컴포넌트. 챗봇·재료 관리·폼 등 인터랙티브 UI.

---

## 2. 페이지별 구현 가이드

### 2.1 레시피 상세 (ISR·메타데이터)

레시피 상세 페이지는 상위 N개 인기 레시피를 빌드 타임에 생성하고, 나머지는 온디맨드·ISR로 처리한다.

```typescript
// app/(main)/recipes/[id]/page.tsx
export async function generateStaticParams() {
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

### 2.2 챗봇 아키텍처

챗봇은 Producer API를 통해 SSE로 스트리밍 응답을 수신한다.

```
사용자 메시지 → API (POST /api/v1/chatbot/messages) → Kafka (chatbot-requests)
→ Consumer → OpenAI API → Redis → SSE → 클라이언트
```

클라이언트는 `EventSource` 또는 fetch + ReadableStream으로 SSE를 구독하고, `ChatbotStreamEvent` 타입(`intent` | `chunk` | `done` | `error`)에 따라 UI를 갱신한다. 상세는 백엔드 `../spec/backend_architecture_spec.md`·`backend_development_guidelines.md` 참고.

### 2.3 레시피 목록 (점진적 로딩)

초기 N개만 SSR로 반환하고, 나머지는 클라이언트에서 Infinite Scroll 또는 페이지네이션으로 로드한다.

```typescript
// 레시피 목록 페이지 - 점진적 로딩
export default async function RecipesPage() {
  const initialRecipes = await getRecipes({ limit: 20 });
  return (
    <>
      <RecipeGrid recipes={initialRecipes} />
      <InfiniteLoader endpoint="/api/recipes" offset={20} />
    </>
  );
}
```

---

## 3. 캐싱 전략

### 3.1 레이어별

| 레이어 | 역할 |
|--------|------|
| **CloudFlare CDN** | 정적 자산 장기 캐시; ISR 페이지 stale-while-revalidate (예: 24시간) |
| **Vercel Edge** | Next.js ISR 캐시; Edge Functions 지역별 라우팅 |
| **Application (Redis)** | API 응답 5–60분; 세션 7일; 레시피 추천 결과 1시간 |

### 3.2 페이지별 캐싱 요약

- `/home`: Redis `user:${id}:dashboard`, TTL 5분
- `/recipes`: ISR revalidate 300초, Redis 쿼리 캐시
- `/recipes/[id]`: ISR revalidate 600초, CDN 24시간
- `/recipes/recommended`: SSR + Redis 결과 캐시 TTL 1시간

---

## 4. 이미지 최적화

Next.js `Image` 컴포넌트 사용. `placeholder="blur"`, `blurDataURL`(S3 업로드 시 생성), `loading="lazy"`, `sizes`로 반응형 로딩.

```typescript
<Image
  src={recipe.image_url}
  alt={recipe.title}
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={recipe.blur_hash}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

## 5. 상태 관리 및 데이터 페칭

**React Query (TanStack Query)** 사용. 쿼리 키 계층화·staleTime·cacheTime으로 캐시 일관성 유지.

```typescript
// lib/queries/recipe.ts
export const recipeQueries = {
  all: ['recipes'] as const,
  lists: () => [...recipeQueries.all, 'list'] as const,
  list: (filters: RecipeFilters) => [...recipeQueries.lists(), filters] as const,
  details: () => [...recipeQueries.all, 'detail'] as const,
  detail: (id: string) => [...recipeQueries.details(), id] as const,
};

// 사용 예
const { data, isLoading } = useQuery({
  queryKey: recipeQueries.detail(recipeId),
  queryFn: () => fetchRecipe(recipeId),
  staleTime: 5 * 60 * 1000,
  cacheTime: 30 * 60 * 1000,
});
```

---

## 6. 코드 스플리팅

무거운 컴포넌트(챗봇 위젯, 레시피 에디터)는 `dynamic`으로 로드. SSR 불필요 시 `ssr: false`, 로딩 UI 지정.

```typescript
// app/(main)/layout.tsx
import dynamic from 'next/dynamic';

const ChatbotWidget = dynamic(
  () => import('@/components/ChatbotWidget'),
  { ssr: false, loading: () => <ChatbotSkeleton /> }
);

const RecipeEditor = dynamic(
  () => import('@/components/RecipeEditor'),
  { ssr: false }
);
```

---

## 7. 모니터링 및 성능

- **Web Vitals**: LCP, FID, CLS 목표는 `../spec/frontend_architecture_spec.md` 4장 참고. Vercel Analytics 또는 `web-vitals` 라이브러리로 수집.
- **성능 예산**: 랜딩·레시피 목록·상세·챗봇별 초기 로드·TTI·번들 사이즈 예산은 명세서에 정의. CI 또는 Lighthouse로 예산 초과 시 실패하도록 설정 권장.
