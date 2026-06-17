# Design System / Design-to-Code

## 이 문서로 해결할 질문

- Figma 디자인을 코드로 옮길 때 무엇을 기준으로 봐야 하나요?
- 디자인 토큰 → CSS 워크플로우는 무엇인가요?
- 구현 시 금지·권장 사항은 무엇인가요?

## 토큰·스타일 계층

| 순서 | 근거 | 역할 |
| --- | --- | --- |
| 1 | 내부 디자인 토큰 JSON · `client/src/.../globals.css` | 컬러·타이포·스페이싱·컴포넌트 토큰 |
| 2 | `client/src/.../globals.css` | `:root`, `@theme`, 컴포넌트 recipe |
| 3 | [접근성·성능](../client/accessibility-performance) | UX·a11y·성능·톤 원칙 |

Figma MCP 출력(React+Tailwind)은 **참고용**이며, 프로젝트 스택과 컨벤션에 맞게 변환해야 합니다.

## Design-to-Code 워크플로우

```mermaid
flowchart LR
    F[Figma Variables·Styles·Components]
    F --> S1[수집 내부 변수·스타일 목록]
    S1 --> S2[변환 디자인 토큰 JSON]
    S2 --> S3[연동 globals.css]
    S3 --> C[client/src/components/ui/]
```

| 단계 | 내용 |
| --- | --- |
| 1. 수집 | Figma 변수·로컬 스타일을 내부 목록 문서로 정리 |
| 2. 변환 | 목록을 구조화된 디자인 토큰 JSON으로 반영 |
| 3. 연동 | 토큰을 `globals.css`에 매핑 |
| 4. 구현 | 컴포넌트·페이지에 토큰·variant 적용 |

코드·웹을 Figma에 반영할 때는 내부 Code-to-Design 가이드를 따릅니다.

## 구현 총칙 (요약)

1. **토큰 우선** — hex·px 값을 JSX에 하드코딩하지 않고 디자인 토큰을 사용합니다.
2. **시맨틱 HTML + 전역 타이포** — Figma 텍스트 스타일은 시맨틱 태그와 전역 타이포 유틸 클래스로 매핑합니다.
3. **variant 1:1** — Figma 컴포넌트 프로퍼티와 코드의 `variant` prop을 1:1로 대응시킵니다.
4. **아이콘** — `lucide-react`에서 필요한 아이콘만 개별 import합니다.
5. **날짜/시간** — `client/src/.../date.ts`의 포맷 함수로 표시 형식을 통일합니다.

## 컴포넌트 배치

- UI 프리미티브는 `client/src/.../ui/`에 둡니다.
- 도메인 UI는 `client/src/.../{recipe|chatbot|...}/`처럼 도메인별 폴더에 둡니다.

→ [컴포넌트 구조/규칙](../client/components)

## Storybook

컴포넌트마다 `*.stories.tsx`를 두고, 기본 상태와 로딩·에러·빈 상태 등 의미 있는 변형을 함께 문서화합니다.

```bash
pnpm run start:storybook
pnpm run build:storybook
```

## 분석·품질

토큰 구조·대비·중복은 내부 디자인 시스템 분석 절차로 검토하고, 권장 수정사항은 내부 피드백 문서로 관리합니다.

## 관련 문서

- [접근성/성능 기준](../client/accessibility-performance) 문서에서 구현 기준을 확인합니다.
- [컴포넌트 구조](../client/components) 문서에서 배치 규칙을 확인합니다.
- Figma 디자인 원본은 [Mealio 디자인 파일](https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Mealio)에서 확인합니다.
