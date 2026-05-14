# 전역 Toast · 예외 처리 가이드

## 역할 분담

| 수단 | 사용 시점 |
|------|-----------|
| **`error.tsx` / `global-error.tsx`** | 라우트 세그먼트에서 복구 불가한 렌더 예외 |
| **`not-found.tsx`** | 404 등 “이 URL에는 리소스가 없음” |
| **인라인 `Alert`** | 해당 화면에 고정되어 있어야 하는 안내(예: 크레딧 소진 배너) |
| **전역 Toast** | 복구 가능한 일시 오류, 액션 실패, 백그라운드 요청 실패 등 **컨텍스트를 유지**해야 할 때 |

## React Query 전역 오류

`QueryClient` 생성 시 `QueryCache` / `MutationCache`의 `onError`에서 `notifyApiError`를 호출한다. (`client/src/lib/queries/query-client.provider.tsx`, `client/src/lib/queries/global-query-error-toast.ts`)

개별 `useQuery` / `useMutation`에서 전역 토스트를 끄거나 제목만 바꿀 때는 **meta**를 사용한다. 타입은 `client/src/lib/queries/react-query-meta.d.ts`의 `Register` 확장을 따른다.

| meta 필드 | 의미 |
|-----------|------|
| `suppressGlobalErrorToast` | `true`면 전역 토스트를 띄우지 않음(화면에서 직접 처리할 때) |
| `errorToastTitle` | `notifyApiError`의 `title` 오버라이드 |

예: `useCurrentUser`는 기본으로 `errorToastTitle: '세션을 불러오지 못했어요'`를 설정한다.

## API

- **`notifyApiError(error, options?)`** — `unknown` / `ApiError` → 사용자 메시지(`getUserMessage`)와 variant 추론 후 Toast enqueue. `Provider` 미마운트 시 `null`.
- **`useErrorToast()`** — 위와 동일 동작을 훅으로 감싼 편의 API(의존성 배열에 넣기 쉬움).
- **`useToast()`** — `enqueue` / `dismiss` / `clear` 직접 제어(비 API 알림).

## 옵션 패턴

- **`dedupeKey`**: 동일 키는 Toast 리스트에서 **갱신(upsert)**, `notifyApiError`는 추가로 **2.5초 이내 동일 키 재호출을 무시**한다.
- **`skipDedupe: true`**: 연속 실패 로깅·재시도 UX 등에 한해 시간 기반 중복 억제를 끈다.
- **`durationMs: 0`**: 자동 닫힘 없음(닫기 버튼만).
- **`action`**: `{ label, onAction }` — 예: 챗봇 “다시 시도”.

## 접근성

- `error` variant Toast는 `role="alert"` / `aria-live="assertive"`.
- 그 외는 `role="status"` / `aria-live="polite"`.

## 구현 위치

- Provider 트리: `client/src/app/layout.tsx`에서 `AppQueryClientProvider` → `ToastProvider` → `AuthProvider` 순으로 합성한다.
- 모듈: `client/src/lib/toast/`, UI: `client/src/components/ui/Toast/`.

## 단위 테스트

```bash
pnpm --filter client test:unit
```
