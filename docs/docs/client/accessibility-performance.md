---
title: 접근성/성능 기준
---

# 접근성/성능 기준

## 이 문서로 해결할 질문

- Mealio 프론트엔드의 접근성·성능 목표는 무엇인가요?
- `buildAriaLabel`은 어떻게 쓰나요?
- Web Vitals·번들 예산은 무엇인가요?

## 접근성 (WCAG 2.1 AA)

상위 원칙: [접근성·성능](../client/accessibility-performance) · client/src/app/globals.css — `accessibility`, `platform` 섹션

| 항목 | 기준 |
| --- | --- |
| 본문 대비 | 4.5:1 |
| 큰 텍스트·UI | 3:1 |
| 본문 최소 글자 | 16px |
| 터치 타겟 | 최소 44×44px, 인접 간격 8px |
| 포커스 | 키보드 포커스 2px 이상 가시적 윤곽 |
| 모션 | `prefers-reduced-motion` 시 장식 애니메이션 최소화 |

색만으로 정보를 전달하지 않고 아이콘·라벨을 함께 사용합니다.

## `buildAriaLabel`

**단일 진입점**: `client/src/lib/utils/a11y.ts`

```typescript
buildAriaLabel(type, name)
```

| type | 생성 규칙 (name = N) |
| --- | --- |
| `button` | `N 버튼` |
| `link` | `N로 이동하기` |
| `input` | `N 입력` |
| `section` | `N 영역` |
| `image` | `N 이미지` |
| `generic` | `N` |

### 컴포넌트 규칙

- `aria-label` 전용 prop을 **공개하지 않음**
- 의미 있는 prop(`label`, `placeholder`, `name` 등)으로 `buildAriaLabel` 호출
- 아이콘 전용 버튼: `buildAriaLabel('button', '뒤로 가기')` 등 고정 동작명
- `aria-labelledby`, `aria-current`, `aria-hidden`은 필요 시 별도 사용

### 챗봇 영역

- 대화 영역: `role="region"` 등 랜드마크
- 스트리밍·새 메시지: `aria-live`, 필요 시 `aria-busy`

## 성능 목표 (Web Vitals)

[클라이언트 아키텍처](../client/architecture) · client/src/app/ §4

| 지표 | 목표 |
| --- | --- |
| LCP | &lt; 2.5초 |
| FID | &lt; 100ms |
| CLS | &lt; 0.1 |

### 페이지별 번들 예산

| 페이지 | 번들 |
| --- | --- |
| 랜딩 | &lt; 100KB |
| 레시피 목록·검색·필터 | &lt; 150KB |
| 레시피 상세 | &lt; 120KB |
| 챗봇 대화 | &lt; 200KB |

## 구현 전략

| 영역 | 방법 |
| --- | --- |
| 이미지 | Next.js `Image`, lazy load, `sizes`·blur placeholder |
| 렌더링 | ISR/SSR로 LCP 개선 ([캐시](./cache)) |
| 코드 분할 | 라우트·무거운 컴포넌트 dynamic import |
| 측정 | `web-vitals`, Vercel Analytics, Storybook Lighthouse |

`client/src/lib/observability/web-vitals.ts` — Vitals 수집

## Storybook·검증

- 스토리에서도 `buildAriaLabel` 사용 (리터럴 `aria-label` 지양)
- Lighthouse / axe 접근성 검사 권장

```bash
pnpm run start:storybook
pnpm --filter client test:unit
```

## 관련 문서

- [클라이언트 아키텍처](./architecture)
- [Design System](../other/design-system)
- [컴포넌트 구조/규칙](./components)

## 참고 코드·계약

- [클라이언트 아키텍처](../client/architecture) (§8, §9)
- [클라이언트 아키텍처](../client/architecture) · client/src/app/ (§4)
- [접근성·성능](../client/accessibility-performance) · client/src/app/globals.css
