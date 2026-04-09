# Figma Cook — 통합 변수·스타일 목록

- **소스**: [Cook — Figma](https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Cook) (`fileKey`: `r9bdZPeswvPR1ncezzt4ri`). MCP로 수집한 여러 화면 노드의 변수·스타일을 **페이지 구분 없이** 한 표로 합침.
- **수집 방법**: Figma MCP `get_design_context`, `get_variable_defs` (2026-04-09 기준 응답)
- **표기**: **구분**은 `변수` 또는 `스타일`. **이름**은 Figma 변수 경로 또는 스타일 이름. **값**은 변수면 수치·색, 스타일이면 연결 변수(타이포는 폰트·굵기·행간 등 고정 속성 병기). **사용처**는 동일 토큰이 쓰인 컴포넌트·역할을 통합 기술.

---

## 변수·스타일 목록

### 변수

| 구분 | 이름 | 값 | 사용처 |
|------|------|-----|--------|
| 변수 | `border/default` | `1` (px) | Navbar, Tabbar, ActionGroup 등 구분선 두께 |
| 변수 | `color/background` | `#fafaf9` | 페이지·MainContent·SearchBar 필드 배경, Toggle 비선택 배경과 동일 값인 구간 |
| 변수 | `color/border-subtle` | `#e5e5e5` | Navbar, Tabbar, ActionGroup 보더 |
| 변수 | `color/elevation-md` | `#0f172a` @ 약 8% 불투명 (`#0f172a14`) | 카드·표면 드롭 섀도 색(Elevation/Medium) |
| 변수 | `color/placeholder` | `#f5f5f4` | RecipeGridCard 이미지 자리 배경 |
| 변수 | `color/primary` | `#c2410c` | Tabbar 활성 라벨, SliderPagination·PaginationDot 활성, Toggle 선택, Primary 버튼·주요 액션 배경 |
| 변수 | `color/primary-inactive` | `#d4d4d4` | PaginationDot 비활성 |
| 변수 | `color/scrollbar-thumb` | `#d4d4d4` @ 80% 불투명 (≈ `#d4d4d4cc`) | CustomScrollbar |
| 변수 | `color/secondary` | `#fafaf9` | Secondary 버튼(예: 초기화) 배경 |
| 변수 | `color/surface` | `#ffffff` | Navbar, SearchBarButton, Tabbar, CardBase·ToggleCard, FlatGroup 내 흰 표면 |
| 변수 | `color/text-caption` | `#9ca3af` | RecipeGridCard 메타 텍스트 |
| 변수 | `color/text-on-primary` | `#ffffff` | Toggle 선택 라벨, Primary 버튼 라벨 |
| 변수 | `color/text-on-secondary` | `#575352` | Secondary 버튼(예: 초기화) 라벨 |
| 변수 | `color/text-placeholder` | `#737373` | SearchBar 플레이스홀더, Tabbar 비활성 라벨 |
| 변수 | `color/text-primary` | `#1c1a17` | Navbar 제목, 그리드·섹션·카드 제목, SearchBarCard·ToggleCard 섹션 헤딩 등 |
| 변수 | `color/text-secondary` | `#575352` | Toggle 비선택 칩 라벨 |
| 변수 | `color/toggle/selected/default` | `#c2410c` | Toggle 선택 칩 배경 |
| 변수 | `color/toggle/unselected/default` | `#fafaf9` | Toggle 비선택 칩 배경 |
| 변수 | `elevation/md-blur` | `8` (px) | Elevation/Medium 블러 |
| 변수 | `elevation/md-x` | `0` (px) | Elevation/Medium 오프셋 X |
| 변수 | `elevation/md-y` | `4` (px) | Elevation/Medium 오프셋 Y |
| 변수 | `radius/full` | `9999` (px) | SearchBar, PaginationDot, Toggle 칩, 버튼 캡슐형 |
| 변수 | `radius/lg` | `8` (px) | CustomScrollbar 모서리 |
| 변수 | `radius/xl` | `12` (px) | RecipeGridCard 이미지 컨테이너, CardBase·ToggleCard |
| 변수 | `spacing/1` | `4` (px) | TabButton 내부 간격 |
| 변수 | `spacing/2` | `8` (px) | Navbar·Tabbar·그리드·칩 그룹·스크롤바 주변 등 |
| 변수 | `spacing/3` | `12` (px) | SearchBar, Tabbar, SearchBarButton, Card Body, ActionGroup 등 패딩·간격 |
| 변수 | `spacing/4` | `16` (px) | Navbar, SearchBar·카드·토글·액션 바 패딩·간격, 섹션 Heading, RecipeSlider 등 |
| 변수 | `spacing/6` | `24` (px) | Tabbar·MainContent 세로 패딩 등. MCP 생성 코드 일부에 직접 클래스가 안 보일 수 있음 |
| 변수 | `spacing/8` | `32` (px) | MainContent 내 섹션 간 간격 등. MCP 스니펫에 직접 대응이 없을 수 있음 |
| 변수 | `typography/font-size-body` | `16` (px) | SearchBar 본문·플레이스홀더, Toggle·버튼 라벨 |
| 변수 | `typography/font-size-h1` | `28` (px) | Navbar 페이지 제목 |
| 변수 | `typography/font-size-h2` | `20` (px) | 섹션 제목(예: 추천 레시피) |
| 변수 | `typography/font-size-h3` | `18` (px) | 카드 제목, 카드 내 섹션 제목 타이포(스타일은 H3·Card/Heading 등과 조합) |
| 변수 | `typography/font-size-small` | `12` (px) | 카드 캡션 한 줄, 탭 라벨 |

### 스타일

| 구분 | 이름 | 값 | 사용처 |
|------|------|-----|--------|
| 스타일 | `Action/Primary/Default` | `color/primary` | 활성 탭·인디케이터·Primary 버튼·선택 칩 등 액션 색 |
| 스타일 | `Action/Secondary/Default` | `color/secondary` | Secondary 버튼 배경 |
| 스타일 | `Background/Placeholder` | `color/placeholder` | 레시피 카드 이미지 자리 배경 |
| 스타일 | `Background/Primary/Default` | `color/background` | 페이지·콘텐츠 기본 배경 |
| 스타일 | `Background/Surface` | `color/surface` | Navbar, 바·카드 표면 |
| 스타일 | `Body` | `typography/font-size-body` · Noto Sans KR Regular · lineHeight `24` | SearchBar 플레이스홀더 타이포 |
| 스타일 | `Border/Subtle` | `color/border-subtle`, `border/default` | Navbar·Tabbar·하단 액션 바 구분선 |
| 스타일 | `Card/Caption` | `typography/font-size-small` · Noto Sans KR Medium · lineHeight `16` | 카드 메타 한 줄 |
| 스타일 | `Card/Heading` | `typography/font-size-h3` · Noto Sans KR Medium · lineHeight `27` | 검색·필터 카드 내 섹션 제목(검색어, 난이도 등) |
| 스타일 | `Elevation/Medium` | `color/elevation-md`, `elevation/md-x`, `elevation/md-y`, `elevation/md-blur` | CardBase·ToggleCard 등 카드 그림자 |
| 스타일 | `H1` | `typography/font-size-h1` · Noto Sans KR Bold · lineHeight `42` | Navbar 제목 |
| 스타일 | `H2` | `typography/font-size-h2` · Noto Sans KR Bold · lineHeight `30` | 추천 레시피 등 섹션 제목 |
| 스타일 | `H3` | `typography/font-size-h3` · Noto Sans KR Bold · lineHeight `27` | 그리드 카드 제목 |
| 스타일 | `Indicator/Dot/Active` | `color/primary` | PaginationDot 활성 |
| 스타일 | `Indicator/Dot/Inactive` | `color/primary-inactive` | PaginationDot 비활성 |
| 스타일 | `Scrollbar/Thumb` | `color/scrollbar-thumb` | CustomScrollbar |
| 스타일 | `Tab` | `typography/font-size-small` · Noto Sans KR Medium · lineHeight `16` | 탭 라벨 타이포 |
| 스타일 | `Text/Button/Primary` | `color/text-on-primary` | Primary 버튼 텍스트 |
| 스타일 | `Text/Button/Secondary` | `color/text-on-secondary` | Secondary 버튼 텍스트 |
| 스타일 | `Text/Caption` | `color/text-caption` | 카드 부가 메타 색 |
| 스타일 | `Text/Placeholder` | `color/text-placeholder` | 검색 필드 힌트 |
| 스타일 | `Text/Primary` | `color/text-primary` | 제목·강조 본문 색 |
| 스타일 | `Text/Tab/Active` | `color/primary` | Tabbar 활성 라벨 |
| 스타일 | `Text/Tab/Inactive` | `color/text-placeholder` | Tabbar 비활성 라벨 |
| 스타일 | `Text/Toggle/Active` | `color/text-on-primary` | 선택 칩 라벨 색 |
| 스타일 | `Text/Toggle/Inactive` | `color/text-secondary` | 비선택 칩 라벨 색 |
| 스타일 | `Toggle/Label` | `typography/font-size-body` · Noto Sans KR Medium · lineHeight `24` | 칩 라벨 타이포 |
| 스타일 | `Toggle/Selected/Default` | `color/toggle/selected/default` | 선택 칩 배경 |
| 스타일 | `Toggle/Unselected/Default` | `color/toggle/unselected/default` | 비선택 칩 배경 |
| 스타일 | `—` | *(연결 변수 없음)* MCP 기준 `0 1px 2px 0 rgba(15,23,42,0.06)` | SearchBarButton 래퍼 등 — 레이어 그림자(토큰 미바인딩). 다른 화면은 `Elevation/Medium`으로 토큰화됨 |

---

## 권장 수정사항 (선택)

1. **그림자·elevation 정렬**: 메인 흐름의 `SearchBarButton`은 raw 섀도만 있고, 필터·카드는 `Elevation/Medium`·`elevation/*`·`color/elevation-md`로 맞춰져 있습니다. 동일 토큰(또는 `elevation/sm` 등)으로 통일하면 화면 간 일관성이 좋아집니다.
2. **간격 토큰**: 그리드·스택 `gap`이나 `spacing/6`·`spacing/8`이 MCP 코드에 숫자 리터럴로만 보이는 구간이 있습니다. 프레임에서 실제 값이 토큰과 같다면 클래스·CSS 변수도 `spacing/*`에 맞추는 것을 권장합니다.
3. **타이포 토큰**: 필터 하단 `ActionGroup` 버튼 라벨 등이 `text-[16px]`처럼 리터럴로만 나온 경우, `typography/font-size-body` 등과 바인딩해 스타일·코드를 맞추면 좋습니다.
4. **Navbar 수직 리듬**: 상·하 패딩이 1px 단위로 어긋날 수 있으니, 단일 spacing 토큰으로 정리할지 검토합니다.
5. **변수 경로 vs 시맨틱 스타일**: `color/primary`와 `Action/Primary/Default`처럼 동일 의미가 이중으로 잡힐 수 있어, 구현(변수)·디자인 패널(스타일) 역할을 팀 규칙으로 정하면 혼선이 줄어듭니다.
6. **MCP보내기 점검**: `SearchBarCard` 등에서 아이콘 상수명이 스니펫과 어긋날 수 있으니, 실제 노드·에셋 URL 기준으로 import를 확인합니다.

---

## 토큰·스타일 검토 (이슈 및 해결 방향)

아래는 통합 표·`design_tokens.json`을 기준으로 한 검토이다. **색 대비** 수치는 경향 수준이며, 최종 판단은 [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) 등으로 측정하는 것을 권장한다.

### 1. 디자인 시스템 구조상 이름이 부적절한 경우

| 케이스 | 이유 | 해결 방향 |
|--------|------|-----------|
| `color/primary-inactive` | 값 `#d4d4d4`는 브랜드 primary 변형이라기보다 **중립 비활성 트랙**에 가깝다. | `color/indicator-inactive`, `color/dot-inactive` 등 **역할 기반** 이름으로 바꾸거나 `neutral/track` 계열로 묶는다. |
| `color/elevation-md` | **그림자 색**인데 `color/`만으로는 면 색과 구분이 애매하다. | `effect/shadow-md`, `shadow/md/color` 등 **이펙트 전용 접두사**를 두거나, `Elevation/Medium` 스타일에만 묶고 변수는 내부용으로 제한한다. |
| 스타일 `Body` | 실사용이 **검색 플레이스홀더**에 가깝고, 일반 “본문(body)”과 겹친다. | `Body/InputPlaceholder`, `Text/Field/Placeholder` 등으로 분리하거나, 진짜 본문용 `Body`와 플레이스홀더 스타일을 나눈다. |
| `typography/font-size-h3` | **H3(볼드 카드 제목)**과 **Card/Heading(미디엄)**이 같은 숫자 토큰을 공유한다. | 크기만 `font-size/lg` 같은 **스케일 토큰**으로 두고, `H3` / `Card/Heading`은 **복합 텍스트 스타일**로만 노출하거나 `font-size/card-section-title` 등으로 위계와 분리한다. |
| 스타일 `Category/Name` vs 변수 `slash/path` | PascalCase 스타일과 slash 변수가 혼재한다. | 스타일 → 변수 **매핑 테이블**을 문서·코드에 두고, 신규는 **한 축(변수 또는 스타일)을 SSOT**로 정한다. |

### 2. 의미와 실제 사용처가 맞지 않는 경우

| 케이스 | 불일치 | 해결 방향 |
|--------|--------|-----------|
| `color/secondary` = `#fafaf9` | 흔한 **세컨더리 브랜드 색**이 아니라 **채워진 표면**(페이지 배경과 동일 값)에 가깝다. `design_tokens.json`의 `secondary`는 라이트에서 `#6B7250`으로 **의미가 다르다**. | Figma에서 `color/surface-muted`, `color/button-secondary-fill` 등으로 바꾸고, 코드 토큰 `secondary`와 **무조건 1:1 매핑하지 않는다**. JSON과 Figma 중 SSOT를 정한 뒤 이름·값을 정렬한다. |
| `Text/Button/Secondary` → `color/text-on-secondary` | “on-secondary”는 보통 **세컨더리 배경 위 전경**인데, 실제는 **연한 표면 위 짙은 글자**에 가깝다. | `color/text-action-secondary` 등 **의미를 재정의**하거나, `on-*`는 **짝이 되는 배경 토큰**이 있을 때만 쓴다. |
| `Text/Tab/Inactive` → `color/text-placeholder` | 탭 비활성과 **입력 플레이스홀더**는 역할이 다르다. | `color/text-tab-inactive`로 분리해(값은 동일해도 됨) 테마 시 독립 조정이 가능하게 한다. |
| `Background/Placeholder` / `color/placeholder` | **이미지 자리 표면**인데 “placeholder”는 입력 힌트와 혼동된다. | `surface/thumbnail-empty`, `image/placeholder-bg` 등 **콘텐츠 역할**이 드러나는 이름을 검토한다. |
| `color/text-secondary` | 문서상 **토글 비선택 라벨** 중심이나 이름은 **전역 2차 본문**처럼 넓다. | 토큰명은 유지하되 규칙으로 범위를 명시하거나, 칩 전용이면 `color/text-chip-inactive`로 쪼갠다. |

### 3. 중복·SSOT 문제가 예상되는 경우

| 케이스 | 내용 | 해결 방향 |
|--------|------|-----------|
| `color/primary` ≡ `color/toggle/selected/default` | 동일 색 **이중 변수**면 수정 시 누락 위험. | 하나만 SSOT로 두고 다른 쪽은 **alias**만 허용하거나, 토글 선택은 `primary`만 참조한다. |
| `color/background` ≡ `color/toggle/unselected/default` ≡ Figma `color/secondary` | 같은 hex가 **세 경로**로 존재한다. | 페이지 배경·칩·버튼 채움을 **`surface-subtle` 등 단일 시맨틱**으로 통합할지 정하고, 브랜드 `secondary`와 분리한다. |
| `color/text-secondary` ≡ `color/text-on-secondary` | 같은 `#575352`가 두 경로면 테마 변경 시 **한쪽만 갱신**될 수 있다. | **한 토큰**만 두고 스타일은 동일 변수만 참조하거나 Figma alias로 연결한다. |
| `Text/Tab/Active` → `color/primary` vs `Text/Toggle/Active` → `color/text-on-primary` | 둘 다 강조 상태인데 **글자색 토큰 경로가 다르다**. | `text-accent` 등 **시맨틱 토큰**으로 통일하거나, “배경 없는 강조” vs “채움 위 흰 글자”를 규칙으로 문서화한다. |
| `design_tokens.json` vs Figma | JSON의 `secondary` / `on-secondary`와 Figma 필터 버튼용 `color/secondary`·텍스트 조합이 **서로 다른 결정**을 가리킬 수 있다. | 우선순위(SSOT)를 정하고 한쪽에 맞춰 이름·값을 동기화한다. |

### 4. 색상 대비가 불안한 경우

| 조합 | 우려 | 해결 방향 |
|------|------|-----------|
| `text-placeholder` `#737373` on `background` `#fafaf9` | 작은 플레이스홀더·탭 라벨에서 **AA 본문(4.5:1)**에 걸릴 수 있다. | 실측 후 필요 시 색을 약간 진하게 하거나, 탭·플레이스홀더 **토큰 분리** 후 탭은 더 진한 색 적용. |
| `text-caption` `#9ca3af` on `placeholder` `#f5f5f4` 등 연한 배경 | **낮은 대비** 가능성(특히 12px 메타). | 필수 정보는 caption만 쓰지 않기(`design_tokens.json`의 caption 용도 설명과 정합). 대비 개선 시 캡션 색 또는 배경 톤 조정. |
| `primary` `#c2410c` **글자만** on `#ffffff` | 오렌지 텍스트는 크기·굵기에 따라 AA가 빠듯할 수 있다. | 대비 검사 후 필요 시 **진한 primary 텍스트** 전용 토큰 분리. |
| `scrollbar-thumb` 반투명 on 가변 배경 | 배경에 따라 대비가 들쭉날쭉할 수 있다. | 정책에 맞게 **불투명도·기준색** 고정 검토. |
| `text-on-primary` on `primary` | 일반적으로 양호한 편. | 포커스·호버 상태까지 포함해 상태별로 한 번씩 검증. |

### 5. 오버 엔지니어링 가능성

| 케이스 | 내용 | 해결 방향 |
|--------|------|-----------|
| `elevation/md-x`, `md-y`, `md-blur`, `color/elevation-md` 네 변수 | 하나의 그림자를 쪼갠 형태. 코드가 `box-shadow` 한 줄이면 **추상화가 과할 수 있다**. | `Elevation/Medium` 또는 `shadow.card` **단일 토큰**을 제품 SSOT로 두고, 세부 변수는 Figma 내부용으로만 둔다. |
| `Text/Tab/*`, `Text/Toggle/*`, `Text/Button/*`, `Toggle/Label` 등 | 16px/12px 계열이 **겹치면 스타일 수만 늘어난다**. | `text/label-md`, `text/chip` 등 **공통 타이포 토큰**으로 묶고 컴포넌트에서 재사용한다고 명시한다. |
| 유사한 색 스타일 다수 | 팔레트 변경 시 스타일 N개를 동시에 수정해야 할 수 있다. | 색 스타일은 **시맨틱 소수**만 두고 나머지는 **변수 alias**로만 연결한다. |
| Raw 섀도 vs Elevation 토큰 | 같은 “살짝 떠 보임”인데 구현만 다르다. | `elevation/sm` 등 **한 계열로 통일**(권장 수정사항 1번과 연계). |

### 요약

- **가장 시급한 SSOT 이슈**: Figma `color/secondary`·필터 버튼 조합과 `design_tokens.json`의 `secondary`·`on-secondary` **의미 불일치**를 이름과 값으로 정리할 것.
- **이름·의미**: `primary-inactive`, `placeholder`, `on-secondary`, `Body` 등은 **역할에 맞게 리네이밍**하거나 토큰을 분리하는 것이 좋다.
- **중복 색 변수**는 **alias 한 축**으로 줄이고, **대비**는 placeholder·caption·오렌지 텍스트·연한 배경 조합을 우선 검사하면 된다.
- **그림자·타이포**는 필요한 최소 토큰으로 줄여 **코드와 Figma가 같은 이름**을 쓰게 맞추면 유지보수 부담이 줄어든다.

---

## 참고

- 아이콘·이미지는 MCP 자산 URL로만 제공되며 위 토큰 표와 별개입니다.
- 스타일 **이름**에 Figma 텍스트·색·이펙트 스타일명을 두고, **값**에 연결 변수를 적었습니다. 효과만 있고 Figma 스타일명이 없는 레이어는 **이름**을 `—`로 두었습니다.
