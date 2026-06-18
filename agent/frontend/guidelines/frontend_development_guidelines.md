# 프론트엔드 개발 지침

에이전트 주도 개발 시 **어떻게** 개발할지 원칙과 방법론을 제시하는 **비정형 문서**이다. **무엇을** 개발할지(페이지·라우팅·파일 단위)는 `../spec/frontend_architecture_spec.md`에 정의되어 있다.

---

## 1. 라우팅 구현 (Next.js App Router)

- **SSG**: `getStaticProps` 대신 기본 정적 생성. `generateStaticParams`로 동적 세그먼트 정적 경로 정의.
- **ISR**: 공개 데이터 fetch에 `next.revalidate`(Next.js Data Cache)로 재검증 주기를 선언한다. 레시피 상세(`/recipe/[id]`)는 `ISR_FETCH_ON_DEMAND`(`revalidate: false`)로 주기 재검증 없이 **`POST /api/revalidate` 웹훅**(`revalidatePath`)으로만 무효화한다. `app/**/page.tsx`에 `export const revalidate`를 두지 않는다.
- **SSR**: 기본이 서버 컴포넌트. `cookies()`, `headers()` 등으로 개인화 데이터 조회.
- **CSR**: `'use client'` + 클라이언트 전용 컴포넌트. 챗봇·재료 관리·폼 등 인터랙티브 UI.

### 1.1 ISR `fetch` 재검증 선언 규칙

- ISR 페이지의 재검증 주기는 **도메인 API 호출 시** `client/src/lib/policy/cache.policy.ts`의 `ISR_FETCH_PERIODIC`·`ISR_FETCH_ON_DEMAND`를 `RequestOptions` 두 번째 인자로 전달한다.
- `HttpClient`는 SSR에서만 `fetch`의 `next`·`cache` 옵션을 전달한다(`client/src/lib/api/http-client.ts`).
- `ISR_FETCH_PERIODIC`: `next: { revalidate: 300 }` — `/recipe`, `/recipe/filter`, `/ingredient/filter`, `generateStaticParams`용 `getRecipeStaticIds`
- `ISR_FETCH_ON_DEMAND`: `next: { revalidate: false }` — `/recipe/[id]`의 `getRecipeById`
- 공개 ISR 페이지에서는 `cookies()` 의존 함수를 호출하지 않고, 쿠키 비의존 서버 API 래퍼만 사용한다.

### 1.2 네비게이션 UI와 `Link`

**다른 앱 경로로의 이동**이 본질인 컨트롤(하단 탭, 서브탭, 메뉴 행, 내부 CTA 등)은 `<button>`에 `router.push`만 얹는 패턴보다 **`next/link`의 `Link`** 를 우선한다. 클라이언트 전환·선택적 prefetch·시맨틱 앵커에 맞고, App Router와 함께 쓰기 쉽다.

- **내부 경로인지** 한 곳에서만 판별한다. 저장소에 둔 헬퍼 이름·역할·경로는 명세 **`../spec/frontend_architecture_spec.md` §5.7(유틸)** 을 본다. 지침에서 잡는 규칙은 개념만: **같은 오리진 앱 라우트로 쓸 단일 슬래시 경로**면 `Link` 후보, **프로토콜 상대 URL(`//…`)·외부 절대 URL·해시 전용 등**은 `Link`로 치환하지 않는다.
- 내부 후보: `Link`로 렌더. 그 밖: 일반 `<a>`(또는 접근성·디자인에 맞는 동등 래퍼).
- **예외 (버튼 유지)**: **뒤로 가기**(히스토리 스택)·**토글/모달/전송/삭제** 등 **URL 변경이 목적이 아닌** 액션은 **`<button type="button">`** 등 네이티브 의미를 유지한다.
- **OAuth·백엔드 진입 URL**: **전체 문서 네비게이션으로 백엔드 `GET`을 타야 하는** 흐름은 `Link`로 클라이언트 라우팅을 대신하지 않는다. 계약·페이지 경로는 명세와 백엔드 OAuth 가이드를 보고, 구현 패턴은 **§10**을 따른다.
- **Storybook**: 라우터 밖에서 실제 `href` 이동이 캔버스를 깨뜨릴 수 있으면, 컴포넌트가 제공하는 **`preventLinkNavigation`**(또는 동등 옵션)으로 기본 이동을 막고 상태만 바꾼다.

### 1.3 `page.tsx`의 Server Component 원칙 (`'use client'` 금지 기본값)

`page.tsx`는 기본적으로 Server Component로 유지한다.  
`page.tsx`에 `'use client'` 직접 선언은 **명시적 승인 없는 한 금지**한다.

#### 1) 역할 분리 규칙

- `page.tsx`에서 수행: 데이터 페칭, 권한/세션 확인, Server/Client 컴포넌트 조합
- 하위 컴포넌트에서 수행: `useState`, `useEffect`, 이벤트 핸들러, 애니메이션, 브라우저 의존 UI
- `'use client'`는 가능한 한 말단(leaf) 컴포넌트에만 선언한다.

#### 2) 페이지 수준 상태 규칙

- 페이지 전역 필터/검색 상태는 `searchParams`를 우선 사용한다.
- `searchParams`를 사용해도 `page.tsx`는 Server Component로 유지한다.
- 입력/인터랙션 UI만 Client Component로 분리한다.

#### 3) 판단 기준

| 상황 | 배치 위치 |
| ------ | ----------- |
| DB 조회, 인증 확인, 서버 API 조합 | `page.tsx` (Server) |
| `useState`, `useEffect` 필요 | 하위 Client Component |
| 이벤트 핸들러, 애니메이션 | 하위 Client Component |
| 차트/에디터 등 브라우저 의존 라이브러리 | 하위 Client Component |
| 단순 데이터 표시 | Server Component 유지 |

- 최종 원칙: `page.tsx`는 데이터 수집/조합 전용 orchestrator로 유지하고, 인터랙티브 로직은 하위 Client Component로 위임한다.

---

## 2. 페이지별 구현 가이드

### 2.1 레시피 상세 (ISR·메타데이터)

레시피 상세(`/recipe/[id]`)는 **온디맨드 ISR** 전략을 사용한다.

1. **빌드 타임**: `generateStaticParams` + `getRecipeStaticIds({ size: 10 })`로 상위 인기 레시피 id만 사전 생성.
2. **최초 요청**: 사전 생성되지 않은 id는 첫 방문 시 on-demand로 HTML 생성·캐시.
3. **캐시 유지**: `getRecipeById(..., ISR_FETCH_ON_DEMAND)` — `next.revalidate: false`, 주기 재검증 없음, 캐시는 명시적 무효화까지 유지.
4. **데이터 변경 시**: 백엔드·관리 도구가 `POST /api/revalidate`(본문 `{ secret, path: '/recipe/{id}' }`, `REVALIDATE_SECRET`)를 호출 → `revalidatePath(path)`. 계약은 `agent/common/openapi_spec_frontend.yaml`.

```typescript
// app/(main)/recipe/[id]/page.tsx
import { ISR_FETCH_ON_DEMAND, ISR_FETCH_PERIODIC } from '@/lib/policy/cache.policy';

export async function generateStaticParams() {
  const result = await fetchForIsr({
    fetcher: () => getRecipeStaticIds({ size: 10 }, ISR_FETCH_PERIODIC),
    fallback: { data: [] },
  });
  return result.data.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const recipe = await getRecipeById(
    Number.parseInt((await params).id, 10),
    ISR_FETCH_ON_DEMAND,
  );
  return { title: recipe.title, description: recipe.description, /* ... */ };
}
```

#### ISR fetch 예외처리

ISR 페이지(`/recipe`, `/recipe/filter`, `/ingredient/filter`, `/recipe/[id]`)의 서버 데이터 fetch는 **`fetchForIsr`**(`client/src/lib/api/server/isr-fetch.server.ts`)로 통일한다. CI 빌드(`process.env.CI === 'true'`)에서 fetch 실패 시에만 `fallback`을 반환한다. 재검증 주기는 `fetchForIsr`가 아니라 fetcher 내부 도메인 API 호출의 `ISR_FETCH_*` 옵션으로 선언한다.

| 단계 | fetch 실패 시 동작 |
| ------ | ------------------- |
| **CI 프리렌더** (`next build`, `CI=true`) | `fallback`(예: `createEmptyPaginated`·`createEmptyDataList`, `client/src/lib/utils/isr-fallback.ts`) 반환 — 빌드 통과 |
| **로컬/비-CI 프리렌더** | `throw` — 빌드 실패(조기 발견) |
| **런타임 재검증** (주기 ISR·온디맨드 재생성) | `throw` — 기존 캐시(stale) 유지, 빈 화면으로 덮어쓰지 않음 |

- **필수 본문 데이터**(`default` export): 위 헬퍼 사용. 재검증 실패 시 stale 유지가 목표이므로 `Promise.allSettled` + `[]` 폴백 금지.
- **`generateMetadata`**: 메타만 완화 가능. API 실패 시 기본 title/description 폴백 허용(본문 캐시와 분리).
- **`generateStaticParams`**: `fetchForIsr` 사용. CI 프리렌더에서만 `{ data: [] }` 폴백.
- **CSR·SSR 비-ISR 페이지**(예: `/recipe/search`, 개인화 추천): 본 절 범위 밖. 기존 React Query·`serverFetchWrapper` 전략 유지.

CI 프리렌더 soft-fallback 한계: 백엔드 미연결 상태로 배포되면 초기 공개 섹션이 비어 있을 수 있다. `ISR_FETCH_PERIODIC`(300초) 주기·첫 방문 on-demand 생성·`POST /api/revalidate` 후 정상 API 연결 시 복구된다.

### 2.2 챗봇 아키텍처

챗봇은 Producer API를 통해 SSE로 스트리밍 응답을 수신한다.

```text
사용자 메시지 → API (POST /api/v1/chatbot/messages) → Kafka (chatbot-requests)
→ Consumer → OpenAI API → Redis → SSE → 클라이언트
```

클라이언트는 `EventSource` 또는 fetch + ReadableStream으로 SSE를 구독하고, `ChatbotStreamEvent` 타입(`intent` | `chunk` | `done` | `error`)에 따라 UI를 갱신한다. Redis 채널·이벤트 타입·6단계 흐름은 `../../backend/spec/backend_architecture_spec.md`(§1.2) 및 `../../backend/guidelines/backend_development_guidelines.md` §5에 정의되어 있다.

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
| -------- | ------ |
| **CloudFlare CDN** | 정적 자산 장기 캐시; ISR 페이지 stale-while-revalidate (예: 24시간) |
| **Vercel Edge** | Next.js ISR 캐시; Edge Functions 지역별 라우팅 |
| **Application (Redis)** | API 응답 5-60분; 세션 7일; 레시피 추천 결과 1시간 |

### 3.2 페이지별 캐싱 요약

- `/recipe`: ISR `ISR_FETCH_PERIODIC`(300초), Redis 쿼리 캐시. 재검증 fetch 실패 시 stale HTML 유지(§2.1 ISR fetch 예외처리).
- `/recipe/[id]`: 온디맨드 ISR(`ISR_FETCH_ON_DEMAND`, `generateStaticParams` size 10). 데이터 변경 시 `POST /api/revalidate`(본문 `{ secret, path }`) → `revalidatePath(path)`. 재생성 실패 시 기존 캐시 유지.
- `/recipe/filter`, `/ingredient/filter`: ISR `ISR_FETCH_PERIODIC`(300초). 재검증 실패 시 stale 유지.
- `/recipe` 개인화 추천 섹션: CSR(`GET /api/v1/recipes/recommended`) + Redis 결과 캐시 TTL 1시간

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

### 5.1 Command API Optimistic Update 전략

Producer-Consumer 아키텍처에서 command API(POST/PUT/DELETE)의 HTTP 200은 **Kafka 이벤트 발행 성공**을 의미하며, **Consumer의 DB 반영 완료를 보장하지 않는다.** 따라서 뮤테이션 성공 후 즉시 재조회(refetch)하면 아직 반영되지 않은 이전 상태가 돌아올 수 있다. 이를 해결하기 위해 다음 전략을 적용한다.

#### 원칙

1. **캐시가 단일 진실 공급원이다.** 화면은 쿼리 캐시를 직접 구독하여 렌더링한다. 쿼리 데이터를 복사한 별도의 로컬 상태(`useState`)를 두지 않는다.
2. **예측 가능한 command는 캐시를 직접 업데이트한다.** 인터랙션 시 `setQueryData`로 쿼리 캐시를 optimistic update하고, 에러 시 롤백한다. 성공 시 재조회하지 않는다.
3. **성공 시에는 stale 마킹만 한다.** `invalidateQueries({ refetchType: 'none' })`으로 캐시를 stale 상태로 표시하되 즉시 refetch를 트리거하지 않는다. 다음 자연스러운 refetch 시점(페이지 이동·마운트 등)에 Consumer 처리가 완료된 실제 데이터를 받아 최종 일관성을 보장한다.
4. 이 전략은 **쿼리의 결과를 예측할 수 있고, 실패 가능성이 낮은 command API**에 한정한다.
5. `onMutate`에서 **`cancelQueries`를 반드시 호출**하여 진행 중인 refetch와의 경합을 방지한다.

#### 로컬 상태와의 관계

- 화면은 `useQuery().data`를 직접 렌더링한다. `useState`로 쿼리 데이터를 복사하여 관리하지 않는다.
- **예외**: 디바운스·큐 등 뮤테이션 발화 전에 즉각적인 시각 피드백이 필요한 컴포넌트(예: 빠른 연속 클릭을 지원하는 토글 버튼)는 컴포넌트 내부에 한정된 `localState`를 둘 수 있다. 이 경우에도 뮤테이션 훅은 캐시를 직접 업데이트하며, 에러 시 prop(캐시 롤백 값)과 동기화한다.

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

## 7. Storybook

- **목적**: UI 컴포넌트를 앱 라우트·데이터 없이 **격리**해 개발·리뷰하고, `../../design/spec/design_tokens.json`·`../../design/spec/design_principle.json`과의 시각적 정합을 맞춘다.
- **배치**: 스토리 파일은 대상 컴포넌트와 가까이 둔다(예: `ComponentName.stories.tsx`). 폴더 트리는 저장소의 컴포넌트 구조 명세·실제 `import` 경로에 맞춘다(세부는 `../spec/frontend_components_structure_spec.md` 등을 본다).
- **스토리 범위**: 기본 상태 1개 + **의미 있는 변형**(비어 있음, 로딩, 에러, 모바일 폭 등)만 유지한다. 페이지 전체 복제보다는 재사용 단위(버튼, 카드, 폼 필드)를 우선한다.
- **타입 규칙(필수)**: 스토리는 `Meta<typeof Component>` / `StoryObj<typeof meta>` + `satisfies` 패턴으로 작성해 **프로퍼티 타입 추론**을 강제한다. `as` 단언으로 우회하지 않고 `args`가 실제 컴포넌트 prop 타입에서 자동 검증되게 유지한다.
- **데이터·API**: React Query·fetch를 쓰는 컴포넌트는 스토리에서 **목(mock) 데이터 또는 MSW**로 고정해, 백엔드 없이 재현 가능하게 한다.
- **Next 연동**: `'use client'` 컴포넌트는 스토리에서 그대로 import; 서버 전용 훅·환경에 묶이면 래퍼나 목으로 분리한다.

---

## 8. 모니터링 및 성능

- **Web Vitals**: LCP, FID, CLS 목표는 `../spec/frontend_architecture_spec.md` §4에 정의되어 있다. Vercel Analytics 또는 `web-vitals` 라이브러리로 수집.

---

## 9. 접근성: `aria-label`과 `buildAriaLabel`

시각적 라벨이 없거나 보조 이름이 필요한 컨트롤(아이콘 버튼, 검색 필드, 랜드마크 등)은 **공용 유틸**로만 `aria-label` 문구를 만든다. WCAG·터치 타겟·톤 등 상위 원칙은 `../../design/spec/design_principle.json`을 따른다.

### 9.1 단일 진입점

- **소스 위치·파일명**은 명세 **`../spec/frontend_architecture_spec.md` §5.7** 에 맡기고, 여기서는 API 사용 규칙만 정한다.
- API: **`buildAriaLabel(type, name)`** — `type`은 아래 표의 엘리먼트 유형, `name`은 맥락을 나타내는 짧은 한국어 문자열(앞뒤 공백은 무시).

| `type` | 생성 규칙 (이름을 `N`이라 할 때) |
| -------- | ----------------------------------- |
| `button` | `N 버튼` |
| `link` | `N로 이동하기` |
| `input` | `N 입력` |
| `section` | `N 영역` |
| `image` | `N 이미지` |
| `generic` | `N` (접미 없음) |

### 9.2 빈 `name` 폴백 (컴포넌트에서 throw 금지)

- **`name`이 공백뿐이면** 호출부에서 예외를 던지지 않고, **유틸 구현 내부에서만** 타입별 기본 이름으로 바꾼 뒤 위 규칙을 적용한다.
- 기본 이름 매핑: `button` → 동작, `link` → 페이지, `input` → 내용, `section` → 콘텐츠, `image` → 표시, `generic` → 항목. 구현 상수(예: 폴백 테이블)와 반드시 동기화한다.

### 9.3 컴포넌트 공개 API 규칙

- **`aria-label` 전용 prop을 두지 않는다.** 대신 이미 있는 의미 있는 prop(`placeholder`, 링크/버튼에 보이는 문구, 칩의 `label`, 재료 `name` 등)으로 문자열을 조합한 뒤 `buildAriaLabel`에 넘긴다.
- 네이티브/래퍼가 `aria-label`을 허용하는 경우, **소비자가 임의로 덮어쓰지 못하게** `Omit<..., 'aria-label'>` 등으로 막고, 내부에서만 `buildAriaLabel`을 적용한다(예: 검색 바).
- **아이콘만 있는 버튼**은 동작이 고정된 컴포넌트라면 `buildAriaLabel('button', '뒤로 가기')`처럼 코드에 고정된 동작명을 쓴다.
- **`aria-labelledby`·`aria-current`·`aria-hidden`** 등 관계·상태 속성은 필요 시 그대로 사용한다. 라벨 “문구 조합”만 `buildAriaLabel`로 통일한다.

### 9.4 스토리·문서

- Storybook에서 데모용 래퍼에 접근 이름이 필요하면 **문자열 리터럴을 직접 넣기보다** `buildAriaLabel`을 사용해 운영 코드와 동일한 규칙을 유지한다.

---

## 10. 인증·세션 (OAuth·토큰 갱신, 원칙만)

본 절은 **방법·주의점**만 적는다. **콜백 URL, 쿼리 이름, Route Handler·헬퍼 경로** 등 **무엇을** 두었는지는 `../spec/frontend_architecture_spec.md` §3.1·§5.2·§5.1과 백엔드 **`../../backend/guidelines/oauth_implementation_guidelines.md`**·OpenAPI를 본다.

### 10.1 OAuth·로그인 리다이렉트

- **성공·실패 목적지**는 백엔드가 나눈다: 성공은 `/oauth/callback?next=`(클라이언트 AuthStatus 마킹 후 `next`로 `replace`), 실패는 오류 전용 프론트 경로로 302. 세부는 백엔드 가이드·OpenAPI를 본다.
- **`next` 안전 검증**(오픈 리다이렉트 방지)은 **백엔드**가 담당한다. 프론트는 계약에 맞는 진입·표시만 한다.
- OAuth 성공 시 백엔드가 `accessToken`(JWT)·`refreshToken`(opaque) HttpOnly 쿠키를 함께 설정한다.
