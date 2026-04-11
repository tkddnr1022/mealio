# Cook Figma — UI 컴포넌트 모음 파악 TODO

**파일**: [Cook](https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Cook) · **컴포넌트 모음 섹션** `node-id=36-333` (`36:333`, 이름 `UI`)

Figma MCP `get_metadata`로 추출한 인벤토리 기준. **한 항목 = 하나의 컴포넌트(또는 컴포넌트 세트)**. variant는 괄호에 요약.

---

## 컴포넌트 체크리스트 (순차 파악용)

사용자 지시에 따라 아래 항목만 골라 `get_design_context` / `get_variable_defs` 등으로 읽고, 하단 **파악 기록**에 요약을 남긴다.

### 액션 · 아이콘 버튼

- [x] `BackButton` (`162:711`)
- [x] `AddButton` (`162:770`)
- [x] `LikeButton` 세트 (`256:2371` — `isFavorite=false` / `isFavorite=true`)
- [x] `ShareButton` (`166:1687`)

### 내비 · 검색 · 본문 골격

- [x] `Navbar` 세트 (`180:1770` — `buttons=empty` … `engageWithBack`)
- [x] `SearchBar` 세트 (`185:2495` — `mode` × `value` × `state`)
- [x] `SearchBarHeader` 세트 (`190:2861` — `state=default` / `hover`)
- [x] `CustomScrollbar` (`216:2300`)
- [x] `MainContent` 세트 (`216:2304` — `scroll=true` / `false`)
- [x] `Tabbar` (`167:3234`)

### 레시피 노출 · 캐러셀

- [x] `RecipeGridCard` (`166:2030`)
- [x] `RecipeGrid` (`167:2276`)
- [x] `PaginationDot` 세트 (`198:1397` — `active` / `inactive`)
- [x] `SliderPagination` 세트 (`198:1388` — `activeIndex=1|2|3`)
- [x] `RecipeSlider` (`183:2136`)
- [x] `RecipeSection` (`167:2463`)

### 카드 · 토글 · 액션 그룹

- [x] `CardBase` (`221:1432`)
- [x] `SearchBarCard` (`233:1720`)
- [x] `Button` 세트 (`228:1571` — `variant` × `state`, primary에만 `inactive`)
- [x] `Toggle` 세트 (`231:1601` — `selected` × `state`)
- [x] `FlatGroup` (`224:1552`)
- [⏭] `ToggleCard` (`233:1857`) — MCP `get_design_context` 미수급·생략(수동 확인)
- [x] `ActionGroup` (`231:1656`)

### 드롭다운 · 칩 · 태그 · 검색 결과 헤더

- [x] `DropdownButton` 세트 (`256:2158` — `open=true` / `false`)
- [x] `DropdownItem` 세트 (`253:1733` — `selected` × `state`)
- [x] `DropdownList` (`253:1723`)
- [x] `FilterDropdown` 세트 (`256:2112`)
- [x] `Chip` 세트 (`255:1817` — `state=기본` / `hover`)
- [x] `ChipsRow` (`256:2279`)
- [x] `SearchResultTop` (`256:2088`)
- [x] `SearchResultMeta` (`256:2105`)
- [x] `SearchResultHeader` (`256:2315`)
- [x] `Tag` 세트 (`256:2464` — `accent=true` / `false`)
- [x] `TagsRow` (`256:2496`)

### 검색 카드 · 리스트 · 빈 상태

- [x] `RecipeSearchCard` (`256:2514`)
- [x] `RecipeSearchList` (`256:2945`)
- [x] `EmptyResultScreen` (`258:3926`)

---

## 파악 기록

*(사용자가 지정한 컴포넌트를 읽은 뒤, 날짜·요약·노드 ID를 여기에 누적한다.)*

| 날짜 | 컴포넌트 | 노드 | 요약 |
|------|----------|------|------|
| 2026-04-11 | BackButton, AddButton, ShareButton, LikeButton | `162:711`, `162:770`, `166:1687`, `256:2371` | 공통 44×44 셸·`spacing/2` 패딩·가운데 정렬. Back/Add/Share는 단일 심볼, 내부는 `lucide/arrow-left`·`plus`·`share-2`. Like는 `isFavorite` 이진, 채움 시 `Action/Primary/Default` 연계. Lucide 내부 광학 패딩: arrow/plus 5px 균등, heart 2×3, share-2 3×2. |
| 2026-04-11 | Navbar, SearchBar, SearchBarHeader, CustomScrollbar, MainContent, Tabbar | `180:1770`, `185:2495`, `190:2861`, `216:2300`, `216:2304`, `167:3234` | Navbar: chef-hat+H1 중앙, 좌·우 absolute(우 `top 15px`), 세트 폭 404. SearchBar: `gap spacing/3`, focus `border-2` primary, filled 시 `lucide/x` 20px+6px. Header: h72·Elevation/Small·내부 SearchBar 전폭. MainContent: scroll 시 스크롤바 right 4 top 8. Tabbar: tab active/inactive 토큰, 아이콘 cooking-pot·message-circle·package·user. |
| 2026-04-11 | RecipeGridCard, RecipeGrid, PaginationDot, SliderPagination, RecipeSlider, RecipeSection | `166:2030`, `167:2276`, `198:1397`, `198:1388`, `183:2136`, `167:2463` | 카드: `radius/xl`·1:1·H3+Caption·메타 `·` 노드. Grid 2×2, gap 16/24, 폭 350. Dot: inactive 8·회색 / active 24×8·primary. Slider: SlideContainer에 351px 그리드 2개+Pagination. Section: H2+Slider, gap 16. |
| 2026-04-11 | CardBase, SearchBarCard, Button, Toggle, FlatGroup (5종) | `221:1432`, `233:1720`, `228:1571`, `231:1601`, `224:1552` | CardBase: Header 접힘·Body 119px·Elevation/Medium. SearchBarCard: CardBase+제목+인라인 SearchBar 토큰. Button: primary/secondary×state, inactive는 primary만. Toggle: `py spacing/2`, `color/toggle/*`, Medium. FlatGroup: 85px 고정 Container. |
| 2026-04-11 | ActionGroup, DropdownButton, DropdownItem, DropdownList, FilterDropdown (`ToggleCard` 생략) | `231:1656`, `256:2158`, `253:1733`, `253:1723`, `256:2112` | ActionGroup: 상단 보더·2×Button `flex-1`·gap 16. Dropdown: `radius/lg` 트리거·chevron 20px(`py` 9). Item: `dropdown/*` 배경·accent 글자. List 120px·Elevation/Medium. Filter: `items-end`·열림 시 list `absolute` top 40 right 0. |
| 2026-04-11 | Chip, ChipsRow, SearchResultTop, SearchResultMeta, SearchResultHeader | `255:1817`, `256:2279`, `256:2088`, `256:2105`, `256:2315` | Chip: 기본/hover 배경·caption·`lucide/x` 20+6px. ChipsRow: FlatGroup 85px·Chip 다중(MCP는 세로 예시). Top: Back+SearchBar flex-1. Meta: 총N개 accent+FilterDropdown flex-1. Header: p16·gap16·3단 스택. |
| 2026-04-11 | Tag, TagsRow, RecipeSearchCard, RecipeSearchList, EmptyResultScreen | `256:2464`, `256:2496`, `256:2514`, `256:2945`, `258:3926` | Tag: accent·`tag/*`·caption·아이콘16. TagsRow: 라이브러리는 세로 Tag 3개 예시; 카드 안은 wrap+`spacing/3`. RecipeSearchCard: CardBase·썸네일+Like absolute·Meta. List: `spacing/6` 스택. Empty: `#f5f5f4` 원+search·H3·body·primary pill CTA. |

---

## [파악 중점]

반복 작업 시 아래 관점으로 라이브러리 체계를 정리하고, 필요 시 `agent/design/figma_implementation.md`에 반영한다(이미 문서화된 내용은 중복하지 않는다).

- **Auto layout** 패턴 및 규칙(축, 정렬, gap, 패딩, GRID 여부)
- **Variant** 생성 기준 및 관리 방식(축 설계, 부분 행렬, 시나리오형 분기)
- **컴포넌트 관리 체계** — 구현 depth(원자/분자/유기), 분리 방식, 슬롯(SLOT) 사용
- **기존 컴포넌트를 상위에 활용하는 방식** — 인스턴스 중첩, swap, 합성 헤더 등
- **아이콘** 사이징 및 활용 방식(기본 24×24, 터치 타깃 44 등)
- **변수 및 스타일** 활용 체계(로컬 스타일·변수 바인딩 리듬)
- 그 밖에 드러나는 **원본 디자인 생성자의 작업 취향·관점·철학**(조합 폭발 억제, 한국어 variant 값, 컴포넌트 설명에 코드 힌트 등)

---

## 참고

- 상위 가이드: `agent/design/figma_implementation.md`
- 변수·스타일 표: `agent/design/figma-variables-and-styles.md`
- 아이콘 모음은 별도 노드 `174:1467` — 본 TODO는 **`UI`(`36:333`)만** 대상으로 한다.
- **Figma MCP rate-limit**: 한 번에 여러 노드를 읽을 때는 **`get_design_context`를 약 5개 단위**로 끊어 호출·반영하는 편이 안전하다(429 등 발생 시 간격 두고 재시도).
- 체크리스트 **`[⏭]`**: MCP로 구조를 가져오지 못하거나 사용자가 **의도적으로 생략**한 항목. `figma_implementation.md`에 별도 MCP 절이 없을 수 있다.
