# Figma 구현 가이드 (MCP + Plugin API)

Cook 프로젝트에서 **Figma MCP**와 **`use_figma`(Plugin API)** 로 raw 노드를 디자인 시스템(변수·스타일·컴포넌트)에 맞춰 옮기거나, 재사용 가능한 컴포넌트를 파일에 직접 생성할 때의 **일반 절차**를 정리한다. 특정 화면 한 건에 묶이지 않고, 이후 유사 작업에 그대로 재사용할 수 있게 서술한다.

---

## 1. 목적과 전제

- **목적**: Figma 파일 안에 변수·로컬 스타일이 반영된 **컴포넌트(또는 구조화된 노드)** 를 만들고, raw 레이어와의 갭을 줄인다.
- **전제**: 대상 노드가 변수/스타일/컴포넌트 체계 없이 그려진 **raw 그룹**일 수 있다. 이 경우 MCP로 구조를 읽고, 파일에 이미 있는 토큰·스타일을 조회한 뒤 **`use_figma`로 생성·바인딩**한다.
- **범위 밖(명시적 생략)**: 아이콘·이미지 에셋 임포트, 픽셀 퍼펙트한 일러스트 복제 등은 별도 지시가 없으면 **슬롯 프레임 또는 생략**으로 둔다. (Cook 라이브러리에는 이미 **아이콘 컴포넌트**가 있으므로, 동일 파일 작업 시에는 **인스턴스 swap**으로 맞추는 것이 원칙이다.)

---

## 2. Cook Figma 라이브러리 체계 (파일 관찰)

아래는 Cook 파일(`fileKey`: `r9bdZPeswvPR1ncezzt4ri`)에서 **컴포넌트 모음·아이콘 모음·조립 화면** 노드를 MCP 메타데이터·Plugin API 트리 탐색으로 정리한 **관찰 기준**이다. 토큰 값의 SSOT는 여전히 `figma-variables-and-styles.md`·파일 변수와 대조한다.

**이 절 안에서의 역할(중복 방지)**  
- **§2.2** — 컴포넌트별 MCP 관찰의 **정본**(치수·토큰·배치).  
- **§2.3** — 상위 **합성 관계**만; 수치·간격은 **§2.2**로 위임.  
- **§2.4** — **variant 축** 정본.  
- **§2.5** — 오토레이아웃 **색인 표**; 세부는 **§2.2·§2.4**.  
- **§2.6** — **아이콘 격자·터치 셸·광학 패딩** 정본. §2.2 액션 블록은 **이름 매핑** 위주.

**인벤토리·반복 파악**: `UI`(`36:333`)에 포함된 컴포넌트를 **체크리스트·노드 ID 단위**로 쌓아 두고, 사용자 지시에 따라 일부만 깊게 읽는 작업 흐름은 `agent/design/figma-ui-components-audit-todo.md`를 쓴다.

**`get_metadata`(XML) 읽는 법**: 같은 `UI` 섹션 안에서 **직계 자식이 `<frame name="…">`이고 그 안에 여러 `<symbol>`**이 있으면 Figma상 **컴포넌트 세트(변형 묶음)** 로 보면 된다. **직계 자식이 단일 `<symbol>`**이면 보통 **단일 컴포넌트**(또는 한 베리언트만 노출된 심볼)다. 구현·역할 파악은 이후 **`get_design_context`**로 이어진다.

### 2.1 파일 내 구역(랜드마크)

| 구역 | 노드 (URL `node-id`) | 역할 |
|------|----------------------|------|
| 컴포넌트 모음 | `36:333` (`…?node-id=36-333`) | `UI` 섹션: 대부분의 컴포넌트·컴포넌트 세트 배치 |
| 아이콘 모음 | `174:1467` | `Icons` 섹션: Lucide 기반 심볼 일괄 배치 |
| 조립 예시 (화면) | `166:1586` `RecipeMainPage`, `233:1638` `RecipeFilterPage`, `258:3928` `RecipeSearchResultPage` | 최상위 **화면 컴포넌트** 또는 **화면용 컴포넌트 세트**로 레이아웃 조립 |
| 빈 검색 결과 UI | `258:3926` `EmptyResultScreen` | 조립용 컴포넌트 — **구조·토큰은 §2.2** 「태그·검색 카드·리스트·빈 상태」 블록 |

**`UI` 캔버스 배치(MCP `get_metadata` 기준)**  
- 단일 `UI` 프레임이 **가로·세로 모두 큰 스테이징 캔버스**(대략 2973×3403)로, x 오프셋이 다른 **세로 컬럼**에 컴포넌트를 나란히 둔다(예: 네비·검색·`MainContent`·`Tabbar` 열, 레시피 그리드·슬라이더·페이지네이션 열, `CardBase`·`Button`·`Toggle` 열, 검색 헤더·드롭다운·칩 열, `EmptyResultScreen` 열). 라이브러리 **탐색·캡처용 무대**로 쓰는 패턴이다.  
- `Navbar`, `SearchBar`, `Button`처럼 **variant를 모은 프레임** 안에서는 자식 심볼이 부모 가장자리에서 **약 20px** 띄워져 격자처럼 쌓인다(세트 간 여백 규칙).

### 2.2 컴포넌트 관리 체계·구현 depth

- **원자(Atomic)**: `BackButton`, `AddButton`, `ShareButton`, `LikeButton`(단일 축 `isFavorite`), Lucide `lucide/*` 아이콘 컴포넌트, `Button`, `Toggle`, `PaginationDot`, `CustomScrollbar` 등 **한 역할·한 세트** 단위.
- **분자(Molecular)**: `Navbar`, `SearchBar`, `SearchBarHeader`, `ActionGroup`, `DropdownButton`·`DropdownItem`·`DropdownList`, `FilterDropdown`, `Chip`, **`FlatTag`**, `CardBase` 등 — 원자·다른 분자를 **인스턴스**로 조합.
- **유기(Organism)**: `MainContent`, `RecipeSection`, `RecipeSlider`, `RecipeGrid`, `SearchResultHeader`(내부에 `SearchResultTop`·`SearchResultMeta`·`ChipsRow`), `RecipeSearchCard`·`RecipeSearchList`, `ToggleCard`, `SearchBarCard`, `EmptyResultScreen`, `Tabbar`, **`RecipeDetailContent`** 등 — **슬롯(SLOT)** 과 스크롤·그리드 같은 **레이아웃 패턴**을 포함.  
- **행·래퍼**: `ChipsRow`는 안쪽에 **`FlatGroup`**(고정 높이 영역)을 두고 칩을 가로로 쌓는 식으로, **가로 스크롤·랩** 같은 리스트 영역을 한 덩어리로 관리한다. **`FlatTagsRow`**는 태그 행용 동류 패턴.
- **템플릿·페이지**: `RecipeMainPage`, `RecipeFilterPage`, `RecipeSearchResultPage` — 상단·본문·하단 **고정 골격** + 유기체 인스턴스만 바꿔 **화면 전체**를 재구성.

**액션·아이콘 버튼** (`get_design_context`로 `162:711` `BackButton`, `162:770` `AddButton`, `166:1687` `ShareButton`, 세트 `256:2371` `LikeButton` 확인)

- **공통 셸(Back / Add / Share / Like)**: 바깥 프레임 **44×44**, 오토레이아웃 **가로·세로 가운데 정렬**, 패딩 **`spacing/2`(8px)**. Figma에서 **추가 variant 없이** 한 심볼로 쓰는 것은 `BackButton`·`AddButton`·`ShareButton` 세 가지.
- **LikeButton만 컴포넌트 세트**: 축 **`isFavorite`**(`false` / `true`). `false`는 **외곽선** `lucide/heart` 인스턴스, `true`는 **채움** 하트로 전환되며 MCP 응답 기준 채움은 **`Action/Primary/Default`**(주황 계열)와 연결된 표현이다. 구현·바인딩 시 **실제 페인트/스타일 id**는 파일에서 한 번 더 확인한다.
- **내부 아이콘 매핑**: `BackButton` → `lucide/arrow-left`, `AddButton` → `lucide/plus`, `ShareButton` → **`lucide/share-2`**(이름이 `share`가 아님). 베이스 아이콘 노드는 `Icons` 섹션의 `174:1464`, `174:1463`, `174:1461` 등과 대응한다.
- **광학 패딩**: 동일 44px 셸 안에서도 **Lucide 심볼별 내부 패딩이 다름** — 수치는 **§2.6**.

**내비·검색·본문 골격** (`get_design_context`: `180:1770` `Navbar`, `185:2495` `SearchBar`, `190:2861` `SearchBarHeader`, `216:2300` `CustomScrollbar`, `216:2304` `MainContent`, `167:3234` `Tabbar`)

- **Navbar**: 루트는 **가로·가운데 정렬** + **`Background/Surface`**, 하단 **`Border/Subtle`**(`border/default`). 라이브러리 심볼 **폭 404**(화면 400과 다를 수 있음). 패딩 **`px spacing/2`**; 세로는 MCP 기준 **`pt`/`pb`가 `spacing/4`로 묶여 있으나 화면 값 16·17px처럼 1px 차이**가 날 수 있다. **좌측 뒤로**: `left: 8px`, **44×44**, `top: calc(50% + 1px)` + 수직 중앙 보정(absolute). **중앙 브랜딩**: `lucide/chef-hat`(브랜드 아이콘, 주황 톤) + 제목 **`H1`/`Text/Primary`**, 둘 사이 **`gap spacing/2`**, 묶음은 `shrink-0`. **우측 액션**: `right: 8px`, `top: 15px`(absolute) — 빈 변형은 **약 44px 정사각 영역**만 잡고, `engageWithBack`는 **`LikeButton`·`ShareButton`을 `gap spacing/2`로 가로 스택**.
- **SearchBar**: 가로 오토레이아웃, **`gap spacing/3`**, **`px spacing/4`·`py spacing/3`**, **`radius/full`**, 기본 **`Background/Primary/Default`**. **focus**(`input`·empty): **`border-2` + `color/primary`**. **disabled**: **`opacity/disabled`**. **`button`·hover**: 배경 **`Background/Primary/Hover`**(변수 경로에 `…placeholder`가 함께 쓰이기도 함). 텍스트 행은 **`flex-[1_0_0]` + min 크기**로 아이콘 사이를 채움. **filled + input + default**일 때만 **`lucide/x` 클리어**(래퍼 **20×20**, 패딩 **6px**). 검색 아이콘은 **24 + 내부 3px**. 값 텍스트는 **`SearchBar/Value`(Medium) + `Text/Primary`**, 플레이스홀더는 **Body Regular + `Text/Placeholder`**. Figma **컴포넌트 설명**의 `transition-shadow`·focus `ring` 등은 **`get_design_context` Component descriptions**와 함께 읽는다.
- **SearchBarHeader**: **고정 높이 72**, **`Background/Surface`**, **`px spacing/4`·`py spacing/3`**, **`Elevation/Small`**. 자식으로 **`SearchBar`를 전체 너비(`w-full`)** 에 두고, variant **`state=default` / `hover`** 는 내부 검색바 배경만 **Default vs Hover** 로 바꾼다(버튼형 검색과 동일 토큰).
- **CustomScrollbar**: **너비 `spacing/2`(8)**, **높이 200**, **`radius/lg`**, **`Scrollbar/Thumb`**(또는 `color/scrollbar/thumb`).
- **MainContent**: 스테이징 **400×400**, **`Background/Primary/Default`**, **`Container`** 슬롯은 **`flex-1`·전폭**. **`scroll=true`** 변형은 오른쪽 **`right: 4px`·`top: 8px`** 에 위와 **동일 토큰**의 세로 막대를 absolute로 겹친다(단독 `CustomScrollbar` 심볼과 시각 스펙 일치).
- **Tabbar**: **`Border/Subtle` 상단**, **`gap spacing/6`**, **`px spacing/6`·`py spacing/3`**. 라벨 색 **`color/tab/active` / `tab/inactive`**, 타이포 **`typography/font-size-small`·Medium**. 아이콘 예: **`lucide/cooking-pot`**, **`message-circle`**, **`package`**, **`user`** — lucide-react 등 코드 매핑 시 **이름 그대로**인지 한 번 확인한다.

**레시피 노출·캐러셀** (`get_design_context`: `166:2030` `RecipeGridCard`, `167:2276` `RecipeGrid`, `198:1397` `PaginationDot`, `198:1388` `SliderPagination`, `183:2136` `RecipeSlider`, `167:2463` `RecipeSection`)

- **RecipeGridCard**: 세로 스택, **썸네일 영역 ↔ 텍스트 블록 `gap spacing/2`**. 라이브러리에서 카드 **폭 ~169.66px**(2열 그리드 셀에 맞춤). 썸네일 컨테이너: **`Background/Placeholder`**, **`radius/xl`**, 안 **1:1 aspect**·`object-cover`. 텍스트: 제목 **`H3`·`Text/Primary`** 와 메타( **`Card/Caption`** = small·Medium, **`Text/Caption`** ) 사이 **`gap spacing/1`**. 메타는 **가로 한 줄**이며 구분 **`·`** 를 **별도 텍스트 노드**로 반복 배치.
- **RecipeGrid**: **2열 GRID**, **`gap-x` 16(`spacing/4`)·`gap-y` 24(`spacing/6`)**, 바깥 **폭 350**, **`RecipeGridCard` 4개**(2×2), `overflow-clip`.
- **PaginationDot**: 비활성 **`spacing/2` 정사각** + **`color/indicator/inactive`**; 활성 **`w spacing/6`(24)·`h spacing/2`(8)** 캡슐 + **`color/primary`**, 공통 **`radius/full`**. MCP 코드에서는 prop이 **`state` 불리언**처럼 보일 수 있으나, 파일 세트는 variant 이름 **`state=inactive` / `state=active`**(또는 동등 표기)로 관리된다.
- **SliderPagination**: **폭 400**, **`gap spacing/2`**, 가운데 정렬, **`PaginationDot` 3개** 인스턴스를 **`activeIndex=1|2|3`** variant로 **어느 점이 캡슐인지 박제**.
- **RecipeSlider**: 루트 세로 **`gap spacing/4`**. **`SlideContainer`** 는 가로 **`gap spacing/4`·좌우 `px spacing/4`**, **`overflow-clip`** 안에 **2×2 그리드(폭 ~351)를 두 덩어리 나란히** 배치해 **가로 스크롤(페이지) 단위**를 표현한다(한쪽은 인라인 그리드, 다른 쪽은 **`RecipeGrid` 인스턴스**로 동일 레이아웃이 복제된 형태). 하단 **`SliderPagination`**.
- **RecipeSection**: **폭 400**, **`Heading`(`H2`·`px spacing/4`) + `RecipeSlider`** 를 **`gap spacing/4`** 세로 스택.

**카드·토글·액션 그룹(1차, `get_design_context`)** — 노드 `221:1432` `CardBase`, `233:1720` `SearchBarCard`, 세트 `228:1571` `Button`, 세트 `231:1601` `Toggle`, `224:1552` `FlatGroup`

- **CardBase**: **폭 360**, **`Background/Surface`**, **`radius/xl`**, **`Elevation/Medium`**. 세로 스택 **`Header` → `Body`**. **`Header`는 비어 있으면 `h-0`·`shrink-0`로 접힘**; **`Body`는 MCP 기준 고정 높이 119px·`shrink-0`** 슬롯(내용은 인스턴스로 채움).
- **SearchBarCard**: 바깥 래퍼 아래 **`CardBase` 인스턴스**를 두고, **`Body` 안에** 제목(예: 「검색어」— **`Card/Heading`** = H3·Medium·`Text/Primary`)과 **캡슐형 검색 행**을 세로로 쌓는다. 검색 행은 독립 `SearchBar` 심볼이 아니라 **동일 토큰**(`Background/Primary/Default`, **`gap spacing/3`**, **`px spacing/4`·`py spacing/3`**, **`radius/full`**, `lucide/search` + 플레이스홀더)으로 맞춘 인라인 구조이며, **`SearchBar` 컴포넌트 설명**(shadow·focus ring)이 응답에 붙을 수 있다.
- **Button**: 캡슐(**`radius/full`**), **`px spacing/4`·`py spacing/3`**, 가로 **~178px**, 텍스트 **Bold·body**·가운데. **primary**: 기본 `color/primary`, hover `color/primary-hover`, inactive `color/indicator/inactive`(배경) + **`Text/Button/Primary`**(흰 글자). **secondary**: 기본 `color/secondary`·글자 `color/text/on-secondary`, hover `color/secondary-hover`(배경 밝아짐).
- **Toggle**: 캡슐, **`px spacing/4`·`py spacing/2`** — 세로 패딩이 **`Button`보다 작다**. **`selected` × `state(default|hover)`** 네 조합. 선택: 배경 `color/toggle/selected/default` / hover는 `…/selected/hover`(진한 주황), 글자 **`Text/Toggle/Active`**(흰색). 비선택: `color/toggle/unselected/default`·hover `…/unselected/hover`, 글자 **`Text/Toggle/Inactive`** / `color/text/secondary`. 라벨은 **Medium·body**(Button과 달리 Bold 아님).
- **FlatGroup**: **폭 360**, 안 **`Container` 고정 높이 85px·`shrink-0`** — 가로 스크롤 행(`ChipsRow` 등)용 **플랫 영역** 래퍼.
- **ActionGroup** (`231:1656`): **폭 360**, **`Background/Surface`**, **상단 `Border/Subtle`**, **`px spacing/4`·`py spacing/3`**, 가로 **`gap spacing/4`**. 자식은 **`Button` 인스턴스 2개**(secondary·primary)를 **`flex-[1_0_0]`** 로 **동일 폭 분할**(세트 기본은 default 상태만 노출).

**드롭다운(1차, `get_design_context`)** — 세트 `256:2158` `DropdownButton`, 세트 `253:1733` `DropdownItem`, `253:1723` `DropdownList`, 세트 `256:2112` `FilterDropdown`

- **DropdownButton**: **`open=false` / `true`** 로 **라벨 + chevron** 만 전환. 배경 **`Background/Primary/Default`**, **`radius/lg`(8)**, **`gap spacing/2`**, **`px spacing/3`·`py spacing/2`**, 라이브러리 **폭 ~89**. 라벨 **`Label/Dropdown`**(caption 14·Medium·`Text/Primary`). 아이콘 **`lucide/chevron-down` / `chevron-up`**, **20×20** 래퍼 안 **`px 6`·`py 9`**(세로 광학 패딩 큼).
- **DropdownItem**: **`selected` × `state(default|hover)`** 네 조합. **`px spacing/4`·`py spacing/3`**. 선택: 배경 `color/dropdown/selected/default`·hover `…/selected/hover`, 글자 **`color/text/accent`**. 비선택: `…/unselected/default`·hover `…/unselected/hover`, 글자 **`Text/Primary`**. 세트 셀 **폭 100**이나 리스트 안에서는 **`w-full`** 로 늘림.
- **DropdownList**: **폭 120**, **`Background/Surface`**, **`radius/xl`**, **`Elevation/Medium`**, 안 **`Container`** 세로 스택에 **`DropdownItem`** 인스턴스 나열.
- **FilterDropdown**: 루트 **`items-end`·폭 121** — **오른쪽 정렬** 묶음. **`open=true`** 일 때 **`DropdownList`를 `absolute`·`right-0`·`top-[40px]`** 로 겹쳐 **트리거 아래·우측 기준** 패널을 띄운다(목록 폭 120, 카드와 동일 그림자·모서리).

**칩·검색 결과 헤더(1차, `get_design_context`)** — 세트 `255:1817` `Chip`, `256:2279` `ChipsRow`, `256:2088` `SearchResultTop`, `256:2105` `SearchResultMeta`, `256:2315` `SearchResultHeader`

- **Chip**: variant **`state=기본` / `hover`**(한글). 캡슐 **`radius/full`**, **`gap spacing/2`**, **`px spacing/4`·`py spacing/2`**. 기본 **`Background/Primary/Default`**, hover **`Background/Primary/Hover`**(MCP에 `…placeholder`로도 표기). 라벨 **caption·Regular·`Text/Primary`**. 오른쪽 **`lucide/x`** 제거 아이콘은 **20×20** 래퍼·**내부 패딩 6px**(검색 클리어와 동일).
- **ChipsRow**: **폭 400**, **`FlatGroup`을 전체 너비(`w-full`)** 로 감싼 뒤 **`Container`(고정 85px)** 안에 **`Chip` 인스턴스**를 둔다. MCP가 펼친 예시는 **세로로 Chip 3개**가 보이나, 실제 프레임이 **가로 스크롤/랩**인지는 **`get_metadata`로 축·자식 순서**를 한 번 더 본다.
- **SearchResultTop**: **`Background/Surface`**, **폭 400**, **`gap spacing/4`**, 가로 **`BackButton`** + **`SearchBar`**(**`flex-[1_0_0]`**), 라이브러리 예시는 **button·filled**에 가까운 채운 검색값·`SearchBar/Value` Medium).
- **SearchResultMeta**: **폭 400**, **`justify-between`·가운데 정렬**. 좌측 **「총 N개」** — 캡션 **`Text/Secondary`**, 숫자만 **주황(`#c2410c`)·Medium**(primary 계열). 우측 **`FilterDropdown`에 `flex-[1_0_0]`·`min-w-0`** 를 주어 **남는 폭을 채우면서** 루트 `items-end`와 맞물려 **드롭다운을 행 오른쪽**에 붙인다.
- **SearchResultHeader**: **`Background/Surface`**, **`p spacing/4`**, 세로 **`gap spacing/4`**, **`overflow-clip`**. 자식 순서 **`SearchResultTop` → `SearchResultMeta` 행 → `ChipsRow`**(각 **폭 400**). 검색바 **컴포넌트 설명**(shadow·focus ring)이 응답에 포함될 수 있다.

**태그·검색 카드·리스트·빈 상태(1차, `get_design_context`)** — 세트 `256:2464` **`FlatTag`**(구 `Tag`), `256:2496` **`FlatTagsRow`**(구 `TagsRow`), `256:2514` `RecipeSearchCard`, `256:2945` `RecipeSearchList`, `258:3926` `EmptyResultScreen`, 심볼 `290:4194` **`Thumbnail`**(검색 카드 썸네일 비율용으로 분리된 경우 MCP에 노출됨)

- **`FlatTag`**: variant **`accent=false` / `accent=true`**. 캡슐 **`radius/full`**, 가로 **`gap` ~8px**(MCP `7.997px`), **`px spacing/3`·`py spacing/2`**. 기본 **`color/tag/default`** 배경 + **`Text/Secondary`** 캡션 + **아이콘 16×16** 슬롯(예: `lucide/clock`). 액센트는 **`color/tag/accent`** 배경·**`Text/Accent`** 라벨·아이콘 톤을 맞춘다. 문서·옛 노드 ID 검색 시 **`Tag`라는 이름**이 나오면 **파일 SSOT는 `FlatTag`** 로 본다.
- **`FlatTagsRow`**: MCP가 펼친 **라이브러리 단독 프레임**은 **`FlatGroup`(폭 360) + `Container` 높이 85** 안에 **`FlatTag`를 세로로 3개** 둔 예시다. **`RecipeSearchCard`에 끼운 인스턴스**에서는 동일 **`FlatGroup`·`Container`가 `flex-wrap` + `gap spacing/3`** 로 **가로 줄바꿈 태그 행**(예: 15분·쉬움·2인분)을 만든다. 맥락별 축이 다를 수 있으니 `get_metadata`로 해당 인스턴스의 `layoutMode`를 확인한다.
- **RecipeSearchCard**: 폭 **360**. **`CardBase`** — **헤더**: 비율 **`360/202.5` 썸네일**(`Thumbnail` 심볼 또는 동일 비율 프레임) + **`LikeButtonWrapper`**를 **`absolute`** `right-[52px] top-[12px]`(**`Background/Surface`**, 원형, **`Elevation/Small`**)으로 겹침. **바디**: **`FlatTagsRow`(랩)** 아래 **`Meta`** 세로 **`gap spacing/1`** — 제목 **`typography/font-size-h3`·Medium·`Text/Primary`**, 설명 **caption·Regular·`Text/Secondary`**(여러 줄). 태그는 시계·불꽃·사용자 등 **아이콘+짧은 라벨** 조합.
- **RecipeSearchList**: 세로 **`gap spacing/6`(24)**, 폭 **360**, **`RecipeSearchCard` 인스턴스 반복**.
- **EmptyResultScreen**: 세로 **`gap spacing/4`**, **`items-center`**, 폭 **360**. 상단 **원형 배경 컨테이너**는 MCP 기준 **`#f5f5f4`** 면 + **`p spacing/4`**, 안 **`lucide/search` 24**. **제목** H3 Bold(응답에 **`#1c1a17` 직접값**과 토큰 혼용 가능), **메시지** Body **`Text/Secondary`**. 하단 **`Button` primary** 캡슐(**`Action/Primary/Default`**, **`Text/on-primary`**) — 예시에서 **폭 약 76px**로 좁게 잡힌다.

**레시피 상세(Recipe Detail) 보조 컴포넌트** — `RecipeDetailPage` 등에서 본문·메타를 조립할 때 쓰는 이름·패턴(**파일 심볼명이 SSOT**; 에이전트가 한 번에 만든 임시명과 다를 수 있음).

- **`CardTag`** (`279:1848`): 카드·상세 맥락의 **캡슐형 메타 칩**(흰 **`Background/Surface`** + **`Elevation/Small`**, 아이콘 + 라벨). 필터용 **`Chip`**·검색 카드 메타 **`FlatTag`**·상단 카테고리 액센트와 **시각·역할이 다르므로 이름을 분리**한다. 라이브러리 기본 라벨은 **`Label`** 등 추상 문자열을 쓴다. (과거 임시명 `RecipeMetaChip`.)
- **`CardTagsRow`** (`282:1874`): **`CardTag`** 가로 묶음; 라이브러리 예시 라벨은 **`Time` / `Difficulty` / `Servings`** 처럼 **역할만 드러나는 영문**을 권장한다. 행 **`itemSpacing`은 `spacing/3`(12px) 등 변수**로 묶는다(MCP 코드에 `gap-[12px]`처럼 **숫자 리터럴만 보이면** §2.7·§5.6대로 토큰 바인딩 미완료로 보고 보고서에 적는다). (과거 임시명 `RecipeMetaChipsRow`.)
- **`RecipeIngredientRow`** (`279:1845`): 재료 한 줄. 기본 카피 **`Name` / `Amount`**; 구분선·패딩은 **`Border/Subtle`**, **`spacing/3`** 등 토큰. (과거 임시명 `IngredientRow`.)
- **`RecipeIngredientsCard`** (`290:4176`), **`RecipeStepsCard`** (`290:4186`), **`RecipeStepRow`** (`279:1852`): **`CardBase` 인스턴스**로 겉틀을 통일하고 **`Body`** 안에 섹션 제목·리스트·스텝을 넣는다. **`RecipeStepRow`** 는 **`StepBadge`**(원형, **`Background/Placeholder`**, **`Caption/Default`** + **`Text/Secondary`**) + **`StepDescription`**(본문, **`spacing/1`** 등) 패턴. 리스트가 길면 **`CardBase` 기본 Body 고정 높이(라이브러리 MCP 기준 119px)** 와 충돌할 수 있으니, 실제 파일에서는 **높이·클립·오토레이아웃**을 조정했는지 확인한다.
- **`RecipeDetailHeader`** (`282:1866`): 세로 스택(기본 **`Title` / `Description`**). 카테고리는 **`FlatTag` `accent=true`와 동일 토큰**(`color/tag/accent`, **`Text/Accent`**, **`Caption/Default`**)을 쓴 **캡슐 프레임**으로 두며, 라이브러리 기본 문자열은 **`Category`**.
- **`RecipeDetailContent`** (`291:1936`): **`MainContent` `Container`** 에 넣기 위한 **조립용 유기체**(폭 **400**, **`px spacing/4`·`py spacing/6`**, 세로 **`gap spacing/6`**). **`RecipeDetailHeader` → `CardTagsRow` → `RecipeIngredientsCard` → `RecipeStepsCard`** 순서가 MCP 기준 예시다. **실제 레시피 카피**(한식·비빔밥·본문 등)는 **이 조립 프레임 또는 페이지 인스턴스**에서만 넣고, 재사용 심볼 단에서는 §5.3 **추상 카피**를 유지하는 것이 목표다(기존에 카드 심볼 안에 한글 예시가 남아 있으면 정리 후보).

**`ToggleCard`(`233:1857`)**: 일부 환경에서 **MCP `get_design_context`가 해당 노드를 안정적으로 내려주지 않는다**. 본 절에는 **MCP 기반 상세를 두지 않으며**, Figma 클라이언트·Plugin API로 구조를 확인한다.

**분리 방식**

- 화면 전용 로직은 **페이지/화면 컴포넌트**에 두고, 반복 UI는 **UI 섹션의 재사용 컴포넌트**로만 노출한다.
- 카드류는 **`CardBase`를 인스턴스로 끼워 넣는 패턴**(`SearchBarCard`, `ToggleCard`)으로 **헤더/바디 슬롯**을 공유한다. 라이브러리 구현에서는 **헤더 슬롯은 비어 있으면 높이 0에 가깝게 접히고**, **`CardBase` 바디는 MCP 기준 119px 고정**(§2.2 카드·토글 블록)처럼 **슬롯마다 세로 규칙이 다를 수 있다**.
- 본문 스크롤 영역은 **`MainContent`의 `Container` SLOT**에 섹션·리스트를 끼우는 방식으로, 화면마다 내용만 교체한다.

### 2.3 기존 컴포넌트를 상위에 활용하는 방식

- **중첩 인스턴스**: 화면 → `Navbar` 등 유기체 → 원자(`BackButton`·`lucide/*` 인스턴스). **치수는 §2.2**.
- **variant로 조합 선택**: `Navbar`의 `buttons=…` 등 — **축 목록은 §2.4**.
- **`SearchResultHeader`**: 자식 순서 **`SearchResultTop` → `SearchResultMeta` → `ChipsRow`**. **간격·폭·flex는 §2.2** 「칩·검색 결과 헤더」.
- **`ActionGroup`**: 하단 **primary·secondary 두 `Button`**. **§2.2** 「카드·토글·액션 그룹」.
- **`Navbar` 하이브리드**: 좌·우 **absolute**, 가운데 **flex** — **§2.2** 「내비·검색·본문」.
- **캐러셀 점**: `SliderPagination`이 **`PaginationDot` 인스턴스**를 묶음 — **§2.2** 「레시피 노출·캐러셀」.
- **`RecipeGrid` / `RecipeSection` / `RecipeSlider`**: 그리드 반복·섹션+슬라이더·슬라이드 페이지 — **§2.2** 동일 블록.
- **`SearchBarCard`**: `CardBase` + 제목 + 검색 행(토큰은 `SearchBar`와 정렬) — **§2.2** 「카드·토글·액션」.
- **`RecipeSearchList` / `RecipeSearchCard`**: 리스트 스택·카드 조합 — **§2.2** 「태그·검색 카드·리스트·빈 상태」.

### 2.4 Variant 생성 기준 및 관리 방식

- **컴포넌트 세트(CONTAINER)**: 관련 변형을 **한 프레임 안에 모아** 세트로 관리한다(예: `Navbar`, `SearchBar`, `Button`, `Toggle`, `PaginationDot`, `SliderPagination`, `LikeButton`, `DropdownItem`, `FilterDropdown`, `Chip`, **`FlatTag`**, `MainContent`, `RecipeSearchResultPage`).
- **이름 규칙**: Figma variant 이름은 대체로 **`속성명=값`** 형태(`mode=input, value=empty, state=default`, `buttons=addWithBack`, `variant=primary, state=default`). **축(axis)마다 독립 variant**로 두어 조합 전개를 표현한다.
- **축 설계 예**
  - **SearchBar**: `mode` × `value` × `state` — 입력/버튼 모드, 값 유무, 포커스·비활성·호버 등.
  - **Navbar**: 단일 축 `buttons` — `empty` / `addOnly` / `backOnly` / `addWithBack` / `engageWithBack` 등 **조합을 미리 열거**(불리언 2개로 Cartesian 하지 않음).
  - **MainContent**: `scroll` true/false + **`Container` SLOT** — 스크롤 여부만 variant로 두고 **내용은 슬롯**으로 위임.
  - **LikeButton**: `isFavorite` true/false — 단순 이진 상태.
  - **SearchBarHeader**: `state=default` / `hover` — 안쪽 **`SearchBar`(버튼형)** 배경만 **`Background/Primary/Default` ↔ Hover** 전환, 바깥은 **`Elevation/Small`** 고정.
  - **Chip**: `state=기본` / `state=hover` — **라벨이 한국어**인 variant 값(디자이너 로캘·문서화 일관성 측면에서 특징적).
  - **`FlatTag`**: `accent=false` / `accent=true` — 배경·텍스트·아이콘 톤이 **`color/tag/default|accent`**·**`Text/Secondary` vs `Text/Accent`** 로 묶인다(필터 칩 `Chip`과 시각적으로 구분되는 **메타 태그** 역할).
  - **DropdownButton**: `open=false` / `true` — **chevron 방향·아이콘 스왑**만 바꾸고 치수·패딩은 동일.
  - **DropdownItem**: `selected` × `state` — 배경·글자색이 **`color/dropdown/...`**·`text/accent` 로 묶임.
  - **FilterDropdown**: `open=false` / `true` — 열림 시 **`DropdownList` 오버레이**를 variant로 박제.
- **화면 수준 variant**: `RecipeSearchResultPage`는 `hasResult=true` / `hasResult=false`처럼 **시나리오 단위**로 세트를 나눈다.
- **부분 행렬**: `Button` 세트는 **`variant=primary`에만 `state=inactive`가 있고**, `secondary`는 default/hover까지만 있는 식으로 **실제 쓰는 조합만** 남긴다(불필요한 variant 셀을 비워 둠).
- **토글 2축**: `Toggle`은 **`selected` × `state`** 로 **4셀 전부 존재**(비선택·선택 각각 default/hover). 색은 **`color/toggle/selected|unselected`/`default|hover`** 와 텍스트 **`Text/Toggle/Active`·`Inactive`** 로 구분된다.
- **인덱스형 variant**: `SliderPagination`은 `activeIndex=1|2|3`처럼 **캐러셀 위치를 통째로 박제**한 variant로 관리한다.
- **점 인디케이터 1축**: `PaginationDot`은 **`state=inactive` / `active`** 한 축으로 **크기·색을 동시에** 바꾼다(원 8px vs 캡슐 24×8).

### 2.5 Auto layout 패턴 및 규칙

**색인**: 아래 표는 **패턴·컴포넌트 이름**을 빠르게 찾기 위한 것이다. **치수·토큰·variant의 정본은 §2.2·§2.4**; 아이콘·터치는 **§2.6**.

| 패턴 | 예시 컴포넌트 | 관찰된 특징(요약) |
|------|----------------|-------------|
| 가로 바 | `Navbar`, `SearchBar`, `ActionGroup` | `HORIZONTAL`; `Navbar`는 **absolute 좌·우 + flex 중앙**(§2.2·§2.3). |
| 하단 2버튼 바 | `ActionGroup` | §2.2 카드·토글·액션 그룹 |
| 드롭다운 트리거 | `DropdownButton` | §2.2 드롭다운 |
| 플로팅 메뉴 | `DropdownList`, `FilterDropdown` | §2.2 드롭다운 |
| 리무버블 칩 | `Chip` | §2.2 칩·검색 결과 헤더 |
| 메타 태그 | `FlatTag` | §2.2 태그·검색 카드·… |
| 태그 행 | `FlatTagsRow` | §2.2 동일(카드 맥락은 wrap) |
| 검색 결과 카드 | `RecipeSearchCard` | §2.2 태그·검색 카드·… |
| 검색 카드 스택 | `RecipeSearchList` | §2.2 동일 |
| 검색 결과 메타 행 | `SearchResultMeta` | §2.2 칩·검색 결과 헤더 |
| 검색 헤더 묶음 | `SearchResultHeader` | §2.2 칩·검색 결과 헤더 |
| 검색 필드 | `SearchBar` | §2.2 내비·검색·본문 |
| 세로 스택 | `RecipeSection`, 본문 | `VERTICAL` + `gap` |
| 카드 슬롯 | `CardBase` | §2.2 카드·토글·액션 |
| 캡슐 CTA | `Button` | §2.2 동일 |
| 캡슐 필터 | `Toggle` | §2.2 동일 |
| 고정 행 높이 | `FlatGroup` | §2.2 동일(Container 85px) |
| 그리드 | `RecipeGrid` | §2.2 레시피 노출·캐러셀 |
| 그리드 간격 | `RecipeGrid` | 열·행 `gap` 상이 — §2.2 |
| 레시피 카드 | `RecipeGridCard` | §2.2 레시피 노출·캐러셀 |
| 가로 슬라이드 페이지 | `RecipeSlider` | §2.2 레시피 노출·캐러셀 |
| 고정 폭·모바일 | 화면 ~400 | §2.2 `MainContent` 등 |
| 정렬 | 검색바·내비 | 중앙·`MIN` 등 — §2.2 |
| 아이콘-only 터치 | `BackButton` 등 | **§2.6** |
| 하단 탭 | `Tabbar` | §2.2 내비·검색·본문 |
| 빈 상태 | `EmptyResultScreen` | §2.2 태그·검색 카드·… |
| 캐러셀 인디케이터 | `SliderPagination` | §2.2 레시피 노출·캐러셀 |
| 카드 메타 칩 | `CardTag` | §2.2 레시피 상세 보조; 원자·HUG 위주 |
| 카드 메타 칩 행 | `CardTagsRow` | §2.2 레시피 상세 보조; 컨테이너·가로 FILL |
| 재료 한 줄 | `RecipeIngredientRow` | §2.2 레시피 상세 보조 |
| 재료 카드 | `RecipeIngredientsCard` | §2.2 `CardBase` + Body 스택 |
| 조리 스텝 한 줄 | `RecipeStepRow` | §2.2 레시피 상세 보조 |
| 조리 순서 카드 | `RecipeStepsCard` | §2.2 `CardBase` + Body 스택 |
| 상세 헤더 묶음 | `RecipeDetailHeader` | §2.2 `FlatTag` 토큰 정렬 캡슐 + 타이포 토큰 |
| 상세 본문 조립 | `RecipeDetailContent` | §2.2 `MainContent` 슬롯용 스택 |

신규 컴포넌트 추가 시 **같은 파일의 유사 분자**와 `itemSpacing`·패딩 리듬을 맞출 것.

**오토레이아웃 크기(에이전트·수동 정리 공통)**  
- **원자(리프에 가까운 컴포넌트)**: 가로·세로 **`HUG`(내용에 맞춤)** 이 일반적이다.  
- **컨테이너(행·카드 래퍼·섹션)**: 부모 폭에 맞추 **`FILL`**(또는 화면 명세의 고정 폭)을 우선한다. Cook 모바일 폭(~400) 등은 §2.2·조립 화면과 맞출 것.

### 2.6 아이콘 사이징 및 활용 방식

- **소스**: `Icons` 섹션의 컴포넌트 이름이 **`lucide/아이콘명`** 패턴(예: `lucide/arrow-left`, `lucide/search`).
- **기본 캔버스**: 심볼 **24×24**가 기준.
- **터치 타깃**: `BackButton` 등은 **44×44** 프레임에 **`spacing/2`(8px) 패딩** + 가운데 **Lucide 인스턴스** — **이중 크기** 구조(`get_design_context`도 토큰 **`spacing/2`**).
- **액션 버튼 내부 광학 패딩(MCP)**: 동일 셸 안에서도 심볼별 패딩이 다름 — `arrow-left`·`plus` **사면 5px**; `heart` **좌우 2px·상하 3px**(심볼 높이 **~23px**); `share-2` **좌우 3px·상하 2px**. **이름 매핑은 §2.2** 액션 블록.
- **검색바 내 아이콘**: **`lucide/search`** — **24 격자 + 내부 3px**; **`lucide/x`** 클리어 — **20×20 래퍼 + 6px**(§2.2 SearchBar). `Chip` 닫기 등도 **6px** 류로 맞춤.
- **보조 20×20 래퍼**: `DropdownButton` chevron 등 — 래퍼 안 패딩 **아이콘마다 상이**(예: MCP **`px 6`·`py 9`**) — §2.2 드롭다운.
- **탭 아이콘**: `Tabbar` — **24×24 격자** 공유, 심볼별 **2~5px 대** 내부 패딩(§2.2).
- **활용**: 상위는 아이콘을 **직접 그리지 않고 인스턴스**만 — 코드에서도 **swap**으로 교체.

### 2.7 변수 및 스타일 활용 체계

- 색·타이포·보더·그림자는 **로컬 페인트/텍스트/이펙트 스타일**로 묶고, 스타일이 **변수에 연결**되는 구조가 기본이다(상세 키는 `figma-variables-and-styles.md` 표 참고).
- **간격·반경**은 `spacing/*`, `radius/*`, `border/*` 등 **숫자 변수**로 노출되는 경우가 많아, 컴포넌트에서 `setBoundVariable`로 묶기 좋다.
- **이름 이중 표기**: MCP `get_variable_defs`에는 같은 의미가 **`color/text/primary` 같은 슬래시 경로**와 **`Text/Primary` 같은 스타일 표기형 이름**으로 함께 나오는 경우가 있다. 문서·도구마다 키가 갈리므로 **파일에서 실제 바인딩 가능한 id·이름을 다시 확인**한다.
- raw 화면과의 차이는 주로 **스타일 미적용**이므로, 라이브러리에 맞출 때는 **스타일 id 부여 → 필요 시 변수 바인딩** 순이 안전하다.
- **하드코딩 금지(재사용 스타일)**: 패딩·폰트(텍스트 스타일)·색·`gap`(오토레이아웃 **`itemSpacing`**)·모서리 반경·그림자 등 **디자인 시스템에서 다시 쓸 만한 속성**은 **어떤 경우에도** raw hex·px·effect 객체를 노드에 직접 박지 않는다. 반드시 **로컬 스타일 또는 변수**로만 맞춘다. MCP/스크린샷에만 나오는 **임의 hex**는 “참고”일 뿐이며, 최종 노드에는 **가장 가까운 토큰·스타일**을 택한다. **`get_design_context` 출력에 `gap-[12px]`·`gap-[16px]`처럼 숫자만 있고 `var(--spacing/…)` 가 없으면** Figma 쪽에서 간격 변수 바인딩이 빠진 상태로 본다. 의도한 토큰이 **아직 파일에 없으면** §5.6대로 **유사 토큰으로 대체**하고 보고서에 남긴 뒤, 신규 토큰 필요 여부는 담당자와 합의한다.

### 2.8 생성자 작업 취향·관점(추론)

§2.4에 없는 **해석·팀 핸드오프** 관점만 남긴다(variant 축·열거 규칙 자체는 **§2.4**).

- **한국어 variant 값**: `Chip` 등 **UI 문자열과 variant 값이 같은 언어** — 개발 문서에는 **영문 키 병기** 권장.
- **시각 언어**: 검색바·칩·필터·CTA에 **`radius/full` 캡슐**이 반복 — **동일 곡률로 조작면을 묶는** 취향.
- **상태의 이중 인코딩**: 캐러셀 점은 **색+너비**로 활성 표시(색약·스캔 용이성 추정) — 수치·토큰은 **§2.2·§2.4**.
- **메타 텍스트**: `RecipeGridCard` 메타의 **`·` 분리 노드** — 코드에서는 **join** 등으로 치환하기 쉬움(§2.2).
- **`Tabbar`**: 탭을 **`TabButton` 세트로 쪼개지 않고** 한 심볼 안 **패턴 복제** — **화면 완성도 우선·재사용 깊이 절제**로 읽힌다.

---

## 3. 참고 문서 (agent)

**작업 시 참조 순서(요약)**: 실행 절차는 **§5**와 **§7** → Cook 라이브러리는 **§2.2**(상세)·**§2.4**(variant)·**§2.5**(표 색인)·**§2.3**(합성 목록) → 아이콘·터치는 **§2.6** → 스타일·변수 키는 **`figma-variables-and-styles.md`**(아래 표).

| 문서 | 용도 |
|------|------|
| `agent/design/figma-ui-components-audit-todo.md` | `UI`(`36:333`) **컴포넌트 인벤토리 체크리스트**·반복 파악 TODO·파악 기록 표. |
| `agent/design/figma-variables-and-styles.md` | Cook Figma 파일 기준 **변수 경로·로컬 스타일 이름·의미·사용처** 통합 표. 구현 전 스타일/변수 후보를 빠르게 고른다. |
| `agent/design/design_tokens.json` | 코드·토큰 SSOT와의 정합 확인(이름·값 불일치 시 Figma 쪽을 우선할지 제품 쪽을 우선할지 별도 합의). |
| `agent/design/design_to_code_guidelines.md` | Figma → 코드 방향 작업 시 함께 참고. |
| `agent/design/temp/` | Figma **컴포넌트 구현 작업 종료 후** 요약 보고서(§5.6). 토큰 갭·대체·이름 변경 기록. |
| Cursor **figma-use** 스킬 | **`use_figma` 호출 전 필수 로드**. `return` 규칙, `setCurrentPageAsync`, `FILL`은 `appendChild` 이후, 폰트 `loadFontAsync` 등. |

---

## 4. 사용 도구 (MCP)

| 도구 | 역할 |
|------|------|
| `get_design_context` | 노드별 레이아웃·클래스·스크린샷·에셋 URL. **컴포넌트 분해·역할 정의**의 1차 입력. |
| `get_variable_defs` | 노드 컨텍스트 기준 **변수 키→값** 스냅샷. 문서와 교차 검증할 때 유용. |
| `get_metadata` | 페이지·심볼 계층·좌표. **UI 섹션 그리드·컴포넌트 세트 배치** 파악에 유용. |
| `get_screenshot` | 시각 검증(선택). |
| `search_design_system` | 라이브러리·파일 내 **컴포넌트·변수·스타일 검색**. 결과가 비어 있으면 **로컬 파일만** 대상으로 `use_figma`에서 이름으로 해석한다. |
| `use_figma` | Plugin API 실행. **노드 생성·스타일 ID 적용·변수 바인딩·계층 트리 탐색**의 쓰기/읽기 경로. |

---

## 5. 권장 작업 절차

### 5.1 디자인 읽기 → 컴포넌트 목록

1. URL에서 `fileKey`, `node-id`(하이픈 → 콜론)를 추출한다.
2. `get_design_context`로 해당 노드를 읽는다.
3. 화면을 **재사용 단위**로 쪼개 표로 정리한다.  
   - 열 예: **이름**, **역할**, **부모 화면 구역**, **자식 슬롯(이미지/아이콘 생략 시 표기)**.
4. Cook 파일이면 **`36:333` UI 섹션**에 이미 있는 컴포넌트가 없는지 `get_metadata`로 먼저 훑는다.

### 5.2 스타일·변수 매핑

1. `figma-variables-and-styles.md`에서 **색·타이포·간격·반경·보더·이펙트** 후보를 고른다.
2. `search_design_system`으로 동일 파일/라이브러리에 있는지 검색한다.  
   - **결과가 비어 있어도** 파일에 로컬 스타일이 있을 수 있으므로, 다음 단계에서 `use_figma`로 `getLocalPaintStylesAsync` / `getLocalTextStylesAsync` / `getLocalEffectStylesAsync` / `getLocalVariablesAsync`로 **이름→id**를 만든다.
3. 표에 **사용할 로컬 스타일 이름**과, 필요 시 **변수 경로**(예: `spacing/4`, `radius/full`)를 기입한다.  
   - 문서의 슬래시 경로(`color/primary`)와 파일 내 실제 이름(`color/text/primary` 등)이 다를 수 있어 **파일 조회 결과가 최종 기준**이다.
4. **필요한 토큰·스타일이 파일에 없으면** 작업을 막지 말고, **의미가 가장 가까운 기존 토큰/스타일로 대체**한다. 대체한 항목은 §5.6 **보고서에 코멘트**로 남긴다(원래 의도 → 실제 적용 → 신규 토큰 제안 여부).

### 5.3 `use_figma`로 순차 생성

1. **figma-use 스킬**을 읽은 뒤 호출한다. `skillNames: "figma-use"`를 넘긴다.
2. **작은 단계로 나눈다**: 한 번에 전체 페이지를 한 스크립트에 넣지 않는다.  
   - 예: 히어로 → 타이포 블록 → 칩 → 카드 → 리스트 행 → 스텝.
3. **페이지**: 전용 페이지(예: `🧩 … — Components`)를 두거나, 기존 페이지에서 **우측 여백**에 배치해 `(0,0)`과 겹치지 않게 한다. (Cook의 **`UI` 섹션**처럼 한 구역에 모아 두는 방식도 가능.)
4. **스타일 적용 우선순위**:  
   - 채우기/글자/그림자는 가능하면 **`fillStyleId` / `textStyleId` / `effectStyleId`** 로 로컬 스타일을 연결한다(이미 변수와 연결된 스타일이면 토큰 일관성이 유지된다).  
   - 패딩·모서리 등은 **`setBoundVariable`** 으로 숫자 변수를 묶을 수 있으면 묶는다.
5. **카드류**: 새 “카드” 프레임을 그리지 말고 **`CardBase` 인스턴스**를 두고 **`Header` / `Body`** 슬롯만 채운다(§2.2 `SearchBarCard`·`RecipeIngredientsCard` 등).
6. **리프 컴포넌트의 예시 카피**: **가장 바깥 depth에서** 내부에 다른 UI 컴포넌트 인스턴스를 포함하지 않는 **원자 심볼**을 만들 때는, 예시 텍스트를 **추상적으로** 둔다(예: 버튼 **`Label`**, 카테고리 태그 **`Category`**, 분량 **`Amount`**). 화면별 실제 문구(「비빔밥」「30분」 등)는 **조립 프레임·상위 인스턴스**에서만 넣는다.
7. **텍스트**: `Noto Sans KR` 등 **반드시 `loadFontAsync`** 후 `characters` 설정.
8. **오토레이아웃**: 자식에 `FILL`/`HUG`를 쓸 때는 스킬의 순서 규칙(`appendChild` 후 `layoutSizing`)을 따른다. **원자는 HUG·컨테이너는 FILL** 원칙은 §2.5 표 직후 문단을 따른다. **기존 Cook 컴포넌트**와 동일한 `HORIZONTAL`/`VERTICAL`/`GRID`·간격 리듬을 맞출 것(섹션 2.5).
9. **산출물**: 생성·변경한 노드는 **`return`에 id 목록**을 넣어 다음 호출에서 참조한다.
10. **아이콘**: 동일 파일에 있으면 **`lucide/*` 인스턴스**를 끼우고, 터치 타깃이 필요하면 **44×44 + 8 패딩** 패턴을 따른다(섹션 2.6).

### 5.4 검증

- `get_metadata`로 **심볼 좌표·크기**를 확인하고, 세로 스택이 **겹치지 않는지** 본다.
- 필요 시 `get_screenshot`으로 시각 확인.

### 5.5 선택지·모호함

다음과 같이 **제품/브랜드 결정이 필요한 경우** 작업을 끊고 담당자 지시를 받는다.

- 문서·raw 디자인·파일 변수 세 가지가 서로 다른 값/이름을 가리킬 때 **어느 SSOT를 따를지**.
- 라이브러리 컴포넌트를 **import** 할지, 로컬에 **새로 만들지**.
- 문서에 없는 색(예: 카테고리 칩 전용 배경)을 **신규 토큰**으로 둘지, 기존 **Chip/`FlatTag` 스타일**로 대체할지.
- **variant 축을 추가**할지, **SLOT·인스턴스 교체**로 처리할지(Navbar식 열거 vs MainContent식 슬롯).

### 5.6 작업 종료 보고·토큰 갭 (반복 실수 방지)

컴포넌트 구현(에이전트 `use_figma` 또는 수동)이 **한 덩어리 끝날 때마다**, `agent/design/temp/` 아래에 **짧은 Markdown 보고서** 1개를 둔다.

- **파일명 예**: `figma-components-YYYYMMDD-주제.md` (한 작업당 1파일 또는 동일 주제에 append — 팀 규칙에 맞출 것).
- **권장 목차**
  - **범위**: 생성·수정한 컴포넌트 이름(Figma 최종명; 임시명에서 바뀐 경우 이전명 → 현재명).
  - **토큰·스타일**: 적용한 페인트/텍스트/이펙트 스타일·변수 요약.
  - **갭·대체**: 파일에 없어 **유사 토큰으로 치환**한 항목(의도했던 의미 → 실제 적용 스타일/변수 → 추후 신규 토큰 제안 여부).
  - **검수 메모**: 수동으로 고친 점(이름·`CardBase` 적용·HUG/FILL 등)이 있으면 한 줄씩.

이 절차로 **하드코딩·카드 재구현·리프에 실카피 고정** 같은 실수를 다음 작업에서 되풀이하지 않도록 한다.

---

## 6. 수행 예시 (참고)

**노드 `159:1639`(레시피 상세 Main Content)** 에 위 절차를 적용한 기록은 **화면별 작업 노트**로 두는 것을 권장한다. **절차·검증은 §5**, 스타일 후보는 **`figma-variables-and-styles.md`**, 레이아웃·토큰 리듬은 **§2.2**의 유사 분자(`CardBase`, `FlatTag`, `CardTag`, `RecipeDetailContent`, `RecipeIngredientRow` 등 §2.2 「레시피 상세 보조」)를 벤치마크한다. `search_design_system`이 빈 결과일 때는 **§5.2**대로 `use_figma`에서 로컬 스타일·변수를 조회한다. 작업 종료 시 **§5.6** 보고서를 `agent/design/temp/`에 남긴다.

---

## 7. 체크리스트 (복붙용)

단계별 설명은 **§5**; 아래는 **최소 확인 항목**만.

- [ ] figma-use 스킬 확인 후 `use_figma` 호출
- [ ] `get_design_context`로 구조 파악(응답 내 **Component descriptions** 유무 확인)
- [ ] Cook 파일이면 `UI`(`36:333`)·`Icons`(`174:1467`)에 동일 패턴 컴포넌트 존재 여부 확인
- [ ] `figma-variables-and-styles.md`와 파일 실제 변수명 대조
- [ ] 컴포넌트 표 + 스타일/변수 열 작성
- [ ] 전용 페이지 또는 여백 좌표 확보
- [ ] 스크립트 분할·id 반환·겹침 검사(`get_metadata`)
- [ ] 아이콘은 가능 시 `lucide/*` 인스턴스 + 44 터치 타깃 패턴
- [ ] 모호한 토큰/이름·variant vs SLOT은 중단 후 결정 요청
- [ ] 패딩·타이포·색·gap·radius·shadow 등 **하드코딩 없음**(스타일·변수만; 갭은 §5.6 보고)
- [ ] 카드류는 **`CardBase`** 기반; 상세 메타 칩·행은 **`CardTag` / `CardTagsRow`**; 검색 카드 메타는 **`FlatTag` / `FlatTagsRow`**(§2.2·§2.5, 옛 `Tag`/`TagsRow` 혼동 금지)
- [ ] 리프 심볼 예시 카피는 **추상적**(Label, Category …); 실카피는 조립 단계에서만
- [ ] 원자 **HUG**·컨테이너 **FILL** 원칙(§2.5) 준수
- [ ] `agent/design/temp/`에 **§5.6** 요약 보고서 작성

---

## 8. 관련 링크

- Cook 파일: `https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Cook`
- 컴포넌트 모음: `https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Cook?node-id=36-333`
- 빈 검색 결과(`EmptyResultScreen`): `https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Cook?node-id=258-3926`
- 아이콘 모음: `https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Cook?node-id=174-1467`
- 조립 예시: `RecipeMainPage` `node-id=166-1586`, `RecipeFilterPage` `node-id=233-1638`, `RecipeSearchResultPage` `node-id=258-3928`
- Figma MCP 서버 사용 지침: Cursor MCP `plugin-figma-figma` 설명 및 도구 스키마

**토큰·컴포넌트 이름**은 Figma 파일과 **`figma-variables-and-styles.md`** 가 최종 기준(**§5.2**).
