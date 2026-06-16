---
title: 상태 관리
---

# 상태 관리

## 이 문서로 해결할 질문

- React Query와 Auth 상태는 어떻게 나뉘나요?
- 쿼리 키·캐시 정책은 어디서 관리하나요?
- Optimistic Update 원칙은 무엇인가요?

## 상태 경계

| 상태 | 도구 | 범위 |
| --- | --- | --- |
| 서버 데이터 | **React Query** | 레시피, 재료, inventory, 챗봇, 유저 |
| 인증·세션 | **AuthProvider** | 로그인 여부, `SessionUser` |
| UI 일시 | 컴포넌트 `useState` | 디바운스, 토글 피드백 등 최소 |

원칙: **쿼리 캐시가 화면 데이터의 기준**. API 응답을 `useState`로 복사하지 않습니다.

## Provider 트리

```text
AppQueryClientProvider
  └─ ToastProvider
       └─ AuthProvider
            └─ AppRootFrame (children)
```

`client/src/app/layout.tsx`에서 합성. Query 오류 Toast는 ToastProvider 이후에 등록됩니다.

## React Query 구조

`client/src/lib/queries/`

| 파일 | 역할 |
| --- | --- |
| `query-client.provider.tsx` | QueryClient 생성, 전역 onError |
| `recipe.queries.ts` | `recipeQueries` 키, `useRecommendedRecipes` 등 |
| `ingredient.queries.ts` | 재료 검색 infinite |
| `inventory.queries.ts` | 보관함·관심 레시피 |
| `chatbot.queries.ts` | 대화 목록·상세 |
| `user.queries.ts` | `useCurrentUser`, 닉네임 변경 |
| `auth.queries.ts` | `useLogoutMutation` |

### 쿼리 키 계층

```typescript
recipeQueries.all → lists() → list(filters)
                 → details() → detail(id)
```

키 팩토리 패턴으로 invalidate 범위를 제어합니다.

## 캐시 정책

기준: `client/src/lib/policy/cache.policy.ts`

- `QUERY_DEFAULTS` — staleTime 5분, gcTime 30분
- `QUERY_CACHE.*` — 도메인별 override (recommended 20분, inventory 30초 등)

## Optimistic Update (Command API)

Producer-Consumer 구조에서 HTTP 200은 **Kafka 발행 성공**이지 DB 반영 완료가 아닙니다.

1. 뮤테이션 성공 시 `setQueryData`로 캐시 직접 갱신
2. 에러 시 롤백
3. 성공 후 **refetch 하지 않음** (stale 데이터 재유입 방지)

예외: 토글 버튼 등 즉각 피드백용 **한정된 localState** 허용 — 뮤테이션 훅이 캐시를 갱신하고 에러 시 prop과 동기화.

→ [클라이언트 아키텍처](../client/architecture) §5.1

## Auth와의 연동

- `AuthProvider.refresh()` — OAuth 콜백 후 세션 마킹
- `useCurrentUser` — `userQueries.me`, 실패 시 `errorToastTitle` 기본값
- 로그아웃 → `userQueries.me` invalidate

## 관련 문서

- [캐시](./cache)
- [에러 처리/Toast](./error-toast)
- [인증](./auth)

## 참고 코드·계약

- [클라이언트 아키텍처](../client/architecture) · client/src/app/ (§5.3)
- [클라이언트 아키텍처](../client/architecture) (§5)
