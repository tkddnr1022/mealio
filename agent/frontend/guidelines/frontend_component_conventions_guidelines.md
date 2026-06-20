# 프론트엔드 컴포넌트 컨벤션 가이드

컴포넌트 구조 명세(`../spec/frontend_components_structure_spec.md`)를 구현할 때 **어떻게** 폴더를 만들고 import 규칙을 적용할지 정의하는 가이드 문서이다.

아래 경로는 **저장소 루트 기준**이다.

---

## 1. 컴포넌트 폴더 컨벤션

### 1.1 기본 폴더 단위

- 기본 단위는 **컴포넌트명 폴더 1개**이며, 내부에서 구현·타입·스토리를 함께 관리한다.
- 컴포넌트명이 `RecipeGridItem`이라면 경로는 `.../RecipeGridItem/`를 사용한다.
- 폴더명과 대표 컴포넌트 파일명은 동일하게 유지한다.

### 1.2 권장 파일 구성

| 경로 패턴 | 역할 |
|-----------|------|
| `<ComponentName>/<ComponentName>.tsx` | 컴포넌트 구현 |
| `<ComponentName>/<ComponentName>.types.ts` | Props/도메인 타입 (필요 시) |
| `<ComponentName>/<ComponentName>.stories.tsx` | Storybook 스토리 |
| `<ComponentName>/index.ts` | public export 배럴 |

예시:

```text
client/src/components/ui/Button/
├── Button.tsx
├── Button.types.ts
├── Button.stories.tsx
└── index.ts
```

### 1.3 스토리 파일 배치 규칙

- 스토리 파일은 대상 컴포넌트 폴더 내부에 둔다.
- 스토리 범위는 `frontend_development_guidelines.md` §7을 따른다.
  - 기본 상태 1개 + 의미 있는 변형만 유지
  - 데이터 의존 컴포넌트는 mock/MSW 사용

---

## 2. import 방향 및 의존성 규칙

`client/src/components/`의 레이어는 `ui` → `layout` → `domain` 순으로 상위 레이어가 하위 레이어를 참조하는 **단방향 의존성**을 유지한다.

### 2.1 허용/금지 규칙

| 출발 레이어 | 허용 import | 금지 import |
|-------------|-------------|-------------|
| `ui` | `ui` 내부(필요 최소), `client/src/lib/*` 유틸 | `layout`, 모든 도메인(`recipe`/`chatbot`/`inventory`/`mypage`/`auth`) |
| `layout` | `ui`, `layout` 내부, `client/src/lib/*` 유틸 | 모든 도메인 |
| 도메인 (`recipe` 등) | `ui`, `layout`, 같은 도메인 내부, `client/src/lib/*` | 다른 도메인 직접 참조 |

### 2.2 도메인 간 공통 요소 처리

- 두 개 이상 도메인에서 공통으로 쓰는 UI는 도메인 내부에 중복 생성하지 않고 `ui/` 또는 `layout/`으로 승격한다.
- 특정 도메인 맥락이 강한 컴포넌트는 해당 도메인 내부에 유지한다.

### 2.3 도메인 타입/유틸리티 작성 원칙

- 도메인 컴포넌트(`client/src/components/<domain>/**`)는 SSOT 준수를 위해 가능하면 `client/src/lib/types/*`의 도메인 타입(`RecipeSummary`, `RecipeDetail` 등)을 직접 props/내부 타입으로 참조한다.
- 도메인 의미를 변형한 중간 UI 전용 타입은 꼭 필요한 경우에만 만들고, 우선순위는 **도메인 타입 직접 참조**로 둔다.
- 도메인 내부에서 반복되는 포맷/변환 로직(표시 라벨, 링크 생성, fallback 처리 등)은 `client/src/components/<domain>/utils/**`에 도메인 특화 유틸리티로 추출해 재사용한다.
- 도메인 특화 유틸리티는 다른 도메인으로 확산하지 않고 해당 도메인 내부에서 우선 관리하며, 범용화가 확인되면 `client/src/lib/utils/*`로 승격한다.

---

## 3. 네이밍·배럴 export 규칙

### 3.1 네이밍

- 컴포넌트/폴더명은 PascalCase를 사용한다.
- 세트 컴포넌트는 Variant/State를 props로 표현해 단일 컴포넌트 이름 체계를 유지한다.  
  예: `LikeButton` + `isFavorite`, `ChatBubble` + `role`

### 3.2 배럴 export

- 각 컴포넌트 폴더에 `index.ts`를 두고 해당 폴더의 public API만 export한다.
- 상위 그룹 폴더(`cards`, `lists`, `conversation` 등)에도 필요 시 `index.ts`를 두어 페이지/피처에서 import 경로를 단순화한다.

---

## 4. 마이그레이션/운영 원칙

### 4.1 기존 파일 이동 시

- 기존 경로를 사용하는 코드가 많을 경우, 한 번에 전부 옮기기보다 도메인 단위로 점진 이동한다.
- 이동 단계에서 import alias(`@/components/...`)를 유지해 호출부 수정 범위를 최소화한다.

### 4.2 신규 컴포넌트 추가 시

- 먼저 `frontend_components_structure_spec.md`의 레이어/도메인 표에서 대상 경로를 확정한 뒤 생성한다.
- 경로가 애매하면 다음 우선순위로 판단한다.
  1. 도메인 의존이 없으면 `ui/`
  2. 앱 셸/전역 레이아웃이면 `layout/`
  3. 특정 탭/기능 전용이면 해당 도메인 폴더

