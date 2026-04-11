# Figma — UI 컴포넌트 모음 파악 TODO

연동 Figma 파일에서 **컴포넌트 스테이징 영역**(예: 이름이 `UI`인 섹션 등)을 연다. 실제 **파일 URL·`fileKey`·`node-id`**는 디자인 산출물에 맞춰 매번 확인한다.

Figma MCP `get_metadata`로 추출한 인벤토리 기준. **한 항목 = 하나의 컴포넌트(또는 컴포넌트 세트)**. variant는 괄호에 요약.

---

## 컴포넌트 체크리스트 (순차 파악용)

사용자 지시에 따라 아래 항목만 골라 `get_design_context` / `get_variable_defs` 등으로 읽고, 하단 **파악 기록**에 요약을 남긴다.

### 액션 · 아이콘 버튼

- [x] `BackButton`
- [x] `AddButton`
- [x] `LikeButton` 세트 (`isFavorite=false` / `isFavorite=true`)
- [x] `ShareButton`

### 내비 · 검색 · 본문 골격

- [x] `Navbar` 세트 (`buttons=empty` … `engageWithBack`)
- [x] `SearchBar` 세트 (`mode` × `value` × `state`)
- [x] `SearchBarHeader` 세트 (`state=default` / `hover`)
- [x] `CustomScrollbar`
- [x] `MainContent` 세트 (`scroll=true` / `false`)
- [x] `Tabbar`

### 레시피 노출 · 캐러셀

- [x] `RecipeGridCard`
- [x] `RecipeGrid`
- [x] `PaginationDot` 세트 (`active` / `inactive`)
- [x] `SliderPagination` 세트 (`activeIndex=1|2|3`)
- [x] `RecipeSlider`
- [x] `RecipeSection`

### 카드 · 토글 · 액션 그룹

- [x] `CardBase`
- [x] `SearchBarCard`
- [x] `Button` 세트 (`variant` × `state`, primary에만 `inactive`)
- [x] `Toggle` 세트 (`selected` × `state`)
- [x] `FlatGroup`
- [⏭] `ToggleCard` — MCP `get_design_context` 미수급·생략(수동 확인)
- [x] `ActionGroup`

### 드롭다운 · 칩 · 태그 · 검색 결과 헤더

- [x] `DropdownButton` 세트 (`open=true` / `false`)
- [x] `DropdownItem` 세트 (`selected` × `state`)
- [x] `DropdownList`
- [x] `FilterDropdown` 세트
- [x] `Chip` 세트 (`state=기본` / `hover`)
- [x] `ChipsRow`
- [x] `SearchResultTop`
- [x] `SearchResultMeta`
- [x] `SearchResultHeader`
- [x] `Tag` 세트 (`accent=true` / `false`)
- [x] `TagsRow`

### 검색 카드 · 리스트 · 빈 상태

- [x] `RecipeSearchCard`
- [x] `RecipeSearchList`
- [x] `EmptyResultScreen`

---

## 파악 기록

*(사용자가 지정한 컴포넌트를 읽은 뒤, 날짜·요약을 여기에 누적한다. 필요 시 노드 ID는 로컬 메모나 PR에만 남긴다.)*

| 날짜 | 컴포넌트 | 요약 |
|------|----------|------|
| 2026-04-11 | BackButton, AddButton, ShareButton, LikeButton | 공통 44×44 셸·`spacing/2` 패딩·가운데 정렬. Back/Add/Share는 단일 심볼, 내부는 `lucide/arrow-left`·`plus`·`share-2`. Like는 `isFavorite` 이진, 채움 시 `Action/Primary/Default` 연계. Lucide 내부 광학 패딩: arrow/plus 5px 균등, heart 2×3, share-2 3×2. |
| 2026-04-11 | Navbar, SearchBar, SearchBarHeader, CustomScrollbar, MainContent, Tabbar | Navbar: chef-hat+H1 중앙, 좌·우 absolute(우 `top 15px`), 세트 폭 404. SearchBar: `gap spacing/3`, focus `border-2` primary, filled 시 `lucide/x` 20px+6px. Header: h72·Elevation/Small·내부 SearchBar 전폭. MainContent: scroll 시 스크롤바 right 4 top 8. Tabbar: tab active/inactive 토큰, 아이콘 cooking-pot·message-circle·package·user. |
| 2026-04-11 | RecipeGridCard, RecipeGrid, PaginationDot, SliderPagination, RecipeSlider, RecipeSection | 카드: `radius/xl`·1:1·H3+Caption·메타 `·` 노드. Grid 2×2, gap 16/24, 폭 350. Dot: inactive 8·회색 / active 24×8·primary. Slider: SlideContainer에 351px 그리드 2개+Pagination. Section: H2+Slider, gap 16. |
| 2026-04-11 | CardBase, SearchBarCard, Button, Toggle, FlatGroup (5종) | CardBase: Header 접힘·Body 119px·Elevation/Medium. SearchBarCard: CardBase+제목+인라인 SearchBar 토큰. Button: primary/secondary×state, inactive는 primary만. Toggle: `py spacing/2`, `color/toggle/*`, Medium. FlatGroup: 85px 고정 Container. |
| 2026-04-11 | ActionGroup, DropdownButton, DropdownItem, DropdownList, FilterDropdown (`ToggleCard` 생략) | ActionGroup: 상단 보더·2×Button `flex-1`·gap 16. Dropdown: `radius/lg` 트리거·chevron 20px(`py` 9). Item: `dropdown/*` 배경·accent 글자. List 120px·Elevation/Medium. Filter: `items-end`·열림 시 list `absolute` top 40 right 0. |
| 2026-04-11 | Chip, ChipsRow, SearchResultTop, SearchResultMeta, SearchResultHeader | Chip: 기본/hover 배경·caption·`lucide/x` 20+6px. ChipsRow: FlatGroup 85px·Chip 다중(MCP는 세로 예시). Top: Back+SearchBar flex-1. Meta: 총N개 accent+FilterDropdown flex-1. Header: p16·gap16·3단 스택. |
| 2026-04-11 | Tag, TagsRow, RecipeSearchCard, RecipeSearchList, EmptyResultScreen | Tag: accent·`tag/*`·caption·아이콘16. TagsRow: 라이브러리는 세로 Tag 3개 예시; 카드 안은 wrap+`spacing/3`. RecipeSearchCard: CardBase·썸네일+Like absolute·Meta. List: `spacing/6` 스택. Empty: `#f5f5f4` 원+search·H3·body·primary pill CTA. |

---

## [파악 중점]

반복 작업 시 아래 관점으로 라이브러리 체계를 정리하고, 필요 시 `agent/design/spec/figma_implementation.md`에 반영한다(이미 문서화된 내용은 중복하지 않는다).

- **Auto layout** 패턴 및 규칙(축, 정렬, gap, 패딩, GRID 여부)
- **Variant** 생성 기준 및 관리 방식(축 설계, 부분 행렬, 시나리오형 분기)
- **컴포넌트 관리 체계** — 구현 depth(원자/분자/유기), 분리 방식, 슬롯(SLOT) 사용
- **기존 컴포넌트를 상위에 활용하는 방식** — 인스턴스 중첩, swap, 합성 헤더 등
- **아이콘** 사이징 및 활용 방식(기본 24×24, 터치 타깃 44 등)
- **변수 및 스타일** 활용 체계(로컬 스타일·변수 바인딩 리듬)
- 그 밖에 드러나는 **원본 디자인 생성자의 작업 취향·관점·철학**(조합 폭발 억제, 한국어 variant 값, 컴포넌트 설명에 코드 힌트 등)

---

## 참고

- 상위 가이드: `agent/design/spec/figma_implementation.md`
- 변수·스타일 표: `agent/design/spec/figma-variables-and-styles.md`
- **아이콘 모음**은 파일마다 별도 섹션으로 둘 수 있다. 본 TODO는 **컴포넌트 스테이징(UI) 섹션** 위주로 쓴다.
- **Figma MCP rate-limit**: 한 번에 여러 노드를 읽을 때는 **`get_design_context`를 약 5개 단위**로 끊어 호출·반영하는 편이 안전하다(429 등 발생 시 간격 두고 재시도).
- 체크리스트 **`[⏭]`**: MCP로 구조를 가져오지 못하거나 사용자가 **의도적으로 생략**한 항목. `figma_implementation.md`에 별도 MCP 절이 없을 수 있다.
