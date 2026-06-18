# 접근성/성능 기준

## 이 문서로 해결할 질문

- Mealio 프론트엔드의 접근성·성능 목표는 무엇인가요?
- `buildAriaLabel`은 어떻게 쓰나요?
- Web Vitals 성능 목표는 무엇인가요?

## 접근성 (WCAG 2.1 AA)

접근성·플랫폼 상위 원칙은 `client/src/.../globals.css`의 `accessibility`, `platform` 섹션에 정의되어 있습니다.

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

`buildAriaLabel`의 단일 진입점은 `client/src/.../a11y.ts`입니다.

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

- `aria-label` 전용 prop은 공개하지 않습니다.
- 의미 있는 prop(`label`, `placeholder`, `name` 등)으로 `buildAriaLabel`을 호출합니다.
- 아이콘 전용 버튼은 `buildAriaLabel('button', '뒤로 가기')`처럼 고정 동작명을 사용합니다.
- `aria-labelledby`, `aria-current`, `aria-hidden`은 필요 시 별도로 사용합니다.

### 챗봇 영역

- 대화 영역에는 `role="region"` 등 랜드마크를 적용합니다.
- 스트리밍·새 메시지에는 `aria-live`를 사용하고, 필요 시 `aria-busy`를 함께 적용합니다.

## 성능 목표 (Web Vitals)

렌더링·캐시 정책은 [클라이언트 아키텍처 — 렌더링 전략](./architecture#렌더링-전략)과 `client/src/.../cache.policy.ts`를 참고하세요.

| 지표 | 목표 |
| --- | --- |
| LCP | &lt; 2.5초 |
| INP | &lt; 200ms (상호작용 응답성의 기준 지표) |
| FID | &lt; 100ms (과거 참고용; 실제 수집·판정은 INP를 사용) |
| CLS | &lt; 0.1 |

## 구현 전략

| 영역 | 방법 |
| --- | --- |
| 이미지 | Next.js `Image`, lazy load, `sizes`·blur placeholder |
| 렌더링 | ISR/SSR로 LCP 개선 ([캐시](./cache)) |
| 코드 분할 | 라우트·무거운 컴포넌트 dynamic import |
| 측정 | `web-vitals`, Vercel Analytics, Storybook Lighthouse |

Web Vitals 수집은 `client/src/.../web-vitals.ts`에서 처리합니다.

## Storybook·검증

- 스토리에서도 `buildAriaLabel`을 사용하며, 리터럴 `aria-label`은 지양합니다.
- Lighthouse·axe 접근성 검사를 권장합니다.

```bash
pnpm run start:storybook
pnpm --filter client test:unit
```

## 관련 문서

- [클라이언트 아키텍처](./architecture)
- [Design System](../other/design-system)
- [컴포넌트 구조/규칙](./components)
