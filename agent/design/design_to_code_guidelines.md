# Design to Code 가이드

Figma 디자인을 Cook 클라이언트 코드로 옮길 때의 **공통 원칙**과 **변수·스타일·컴포넌트** 활용 방법을 정리한다.  
**무엇을** 구현할지는 `../spec/frontend_architecture_spec.md` 등 명세를 따르고, 본 문서는 **디자인 시스템과의 연결 방식**에 초점을 둔다.

## 관련 자료

| 자료 | 용도 |
|------|------|
| `design_tokens.json` | 컬러·타이포·스페이싱·radius 등 **단일 소스**로 값 정의 |
| `design_principle.json` | 터치 타깃, 접근성, 톤 등 **원칙·수치** |
| `client/app/globals.css` | 토큰을 **CSS 변수**로 두고, `@theme inline`으로 Tailwind와 연동 |
| `frontend_development_guidelines.md` | Next.js·스타일링·성능 등 **프론트 구현 지침** |
| `.cursor/rules/agent-docs-figma.mdc` | Figma **MCP 선택·캡처·재시도** |

---

## 1. 총칙

1. **토큰 우선**  
   픽셀·hex·font-size를 컴포넌트 JSX에 직접 박지 않는다. `design_tokens.json`에 값이 있으면 **먼저 토큰을 확장·참조**하고, `globals.css`의 `:root` / `@theme`과 맞춘다.

2. **시맨틱 HTML + 전역 타이포**  
   Figma **텍스트 스타일**(H1, H2, Caption 등)은 **태그 또는 약속된 클래스**로 반영한다.  
   예: `h1`~`h3`는 `globals.css`에서 `--typography-h*-` 변수로 정의; 본문은 `body`, 보조는 `figcaption` / `.typography-caption`, `small`, `.typography-card-caption` 등(실제 정의는 `globals.css` 주석 참고).

3. **컴포넌트 variant는 Figma와 맞출 것**  
   Figma **컴포넌트 프로퍼티**(예: `AdditionalButtons`)와 **배리언트 값**을 코드의 `variant`(또는 동등한 prop) 이름·의미와 가능한 한 **1:1 대응**시키고, 배리언트 **전체 목록**은 단일 변형 노드가 아니라 **컴포넌트 세트(부모 프레임)** 기준으로 파악한다.

4. **MCP 출력은 참고용**  
   Figma MCP가 주는 React+Tailwind 스니펫은 **그대로 복사하지 않는다.** 프로젝트 스택(Next.js, 기존 토큰·유틸)에 맞게 변환한다.

---

## 2. Figma 변수 (Variables)

### 디자인 측

- **컬러·간격·radius·타이포 숫자** 등은 Figma **Variables**(또는 라이브러리 변수)로 두고, 컴포넌트/텍스트에 **바인딩**하는 것을 권장한다.
- 이름은 코드 토큰과 혼동이 없도록 **역할 기준**(예: `text/primary`, `spacing/2`)으로 맞추면 `design_tokens.json`과 동기화가 쉽다.

### 코드 측

- `design_tokens.json`의 값이 **진실 소스**에 가깝게 유지되도록 하고, 변경 시 **Figma 변수와 양쪽**을 갱신하는 습관을 둔다.
- `globals.css`의 `:root`에 `--text-primary`, `--spacing-4`, `--typography-h1-font-size` 등을 두고, Tailwind `@theme inline`의 `--color-*`, `--text-h1` 등이 이를 **참조**하도록 한다(이미 프로젝트에 적용된 패턴).

---

## 3. Figma 스타일 (Text / Color styles)

### 텍스트 스타일

- Figma에서 **Text style**(예: H1, H2, Body, Caption)을 적용하면, 코드에서는 아래처럼 **대응**한다.

| Figma 텍스트 스타일(예시) | 토큰 (`design_tokens.json`) | 코드 적용 |
|---------------------------|-----------------------------|-----------|
| H1 | `typography.h1` | 전역 `h1 { … }` + `--typography-h1-*` |
| H2 | `typography.h2` | 전역 `h2 { … }` |
| H3 | `typography.h3` | 전역 `h3 { … }` |
| Body | `typography.body` | 전역 `body { … }` 기본 본문 |
| Caption | `typography.caption` | `figcaption`, `.typography-caption` |
| Small | `typography.small` | `small` |
| Card caption 등 | `typography.card-caption` | `.typography-card-caption` |

- **하지 말 것**: 제목에 `text-[28px] font-bold leading-[42px]`처럼 **컴포넌트 파일에 타이포 하드코딩**. 레이아웃용 클래스(`truncate`, `text-center` 등)만 컴포넌트에 둔다.

### 컬러 스타일

- Figma **Color style**은 `design_tokens.json`의 팔레트·시맨틱 컬러와 매핑하고, UI에서는 `text-foreground`, `bg-surface`, `border-outline-subtle` 등 **토큰 기반 유틸** 또는 CSS 변수를 사용한다.

---

## 4. Figma 컴포넌트 (Components & Variants)

### 컴포넌트 세트와 프로퍼티

- **컴포넌트 세트(Component set)** 안의 각 배리언트는 레이어 이름이 `PropertyName=Value` 형태로 표시되는 경우가 많다.
- 코드의 `variant` 타입(유니온)은 이 **프로퍼티 값 조합**을 반영한다.  
  예: `AdditionalButtons=None | AddAction | UserAction` → 우측 슬롯이 비어 있음 / 추가 / 좋아요·공유.

### 링크·노드 ID (에이전트·리뷰용)

- **배리언트 하나만** 가리키는 `node-id`로는 **다른 배리언트 목록**이 보이지 않는다.
- **전체 배리언트**를 파악하려면 **컴포넌트 세트를 감싼 프레임** 등 **부모 노드**의 URL을 사용하거나, Figma에서 컴포넌트 세트를 직접 선택해 Variants 패널을 본다.

### Figma MCP 활용 (읽기)

- **`get_metadata`**: 구조·자식 심볼 이름(`AdditionalButtons=…`)을 빠르게 볼 때 유리. 배리언트 **전체**는 부모 프레임 id로 호출하는 것이 좋다.
- **`get_design_context`**: 구현 참고용 코드·스크린샷. **반드시** 프로젝트 컨벤션에 맞게 재작성한다.

### Code Connect

- Figma 컴포넌트와 저장소 컴포넌트를 매핑할 때는 **Code Connect**를 사용할 수 있다. 도구·워크플로는 Figma MCP의 Code Connect 관련 도구 및 프로젝트 스킬을 따른다.

---

## 5. 구현 체크리스트 (새 UI 조각)

- [ ] `design_tokens.json`에 필요한 값이 있는가? 없으면 **추가 후** `globals.css` 반영.
- [ ] 타이포는 **전역 규칙(`h1`~`h3`, `body`, caption/small/card-caption)** 을 쓰는가?
- [ ] Figma **변수/스타일**과 토큰 이름·값이 어긋나 있지 않은가?
- [ ] 컴포넌트 **배리언트 전부**가 타입·스토리(또는 문서)에 반영되었는가?
- [ ] 터치 타깃·대비 등 `design_principle.json`을 만족하는가?

---

## 6. 예시: Navbar (요약)

- Figma **AdditionalButtons** 세 가지(None / AddAction / UserAction)에 맞춰 우측 영역을 구성하고, 뒤로가기·우측-only 조합은 **코드 쪽 `variant` 설계**로 표현했다(`Empty`, `AddOnly`, `BackOnly` 등).
- 제목 H1은 **Figma 텍스트 스타일 H1**과 동일 스펙을 `--typography-h1-*` 및 전역 `h1`로 두고, Navbar에서는 **말줄임·정렬만** 클래스로 지정한다.

이 패턴을 다른 레이아웃·카드·폼 컴포넌트에도 동일하게 적용한다.
