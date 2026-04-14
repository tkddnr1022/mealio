# Figma — 통합 변수·스타일 목록

- **소스**: 연동 중인 Figma 파일에서, **메인·필터·검색 결과·상세** 등 화면별 최상위 프레임(또는 컴포넌트 세트)을 골라 MCP로 수집한 뒤 **이름 기준으로 병합**한 스냅샷이다. 실제 `fileKey`·`node-id`·파일 제목은 디자인 쪽과 맞춰 두고, URL은 문서에 고정하지 않는다.
- **수집 방법**: Figma MCP `get_variable_defs`, `get_design_context`, `get_metadata`를 화면별 루트 노드에 대해 호출한 뒤 병합한다. 보조 `search_design_system`은 외부 라이브러리 잡음이 있을 수 있어 **이 표의 단일 근거로 쓰지 않는 것**을 권장한다.
- **주의**: MCP 응답 시점 스냅샷이다. Figma 수정 후 재수집할 것. 추가 화면은 **같은 파일**에서 `node-id`만 바꿔 동일 절차로 수집·병합하면 된다.

---

## 변수·스타일 목록

### 변수

| 구분 | 이름 | 값 | 사용처 |
|------|------|-----|--------|
| 변수 | `border/default` | `1` (px) | Navbar·Tabbar·ActionGroup 구분선 |
| 변수 | `border/focus` | `2` (px) | SearchBar Input 포커스 링 두께(`ring-2` 대응) |
| 변수 | `card/elevation/blur` | `8` (px) | 필터 화면 SearchBarCard·ToggleCard 그림자 반경 (`Elevation/Card`) |
| 변수 | `card/elevation/color` | `#0f172a` @ 약 8% 불투명 (`#0f172a14`) | 필터 카드 그림자 색 (`Elevation/Card`) |
| 변수 | `card/elevation/x` | `0` (px) | 필터 카드 그림자 X (`Elevation/Card`) |
| 변수 | `card/elevation/y` | `4` (px) | 필터 카드 그림자 Y (`Elevation/Card`) |
| 변수 | `card/gap` | `12` (px) | 필터 화면 카드 내부 세로 간격(제목 ↔ 입력/토글 행) |
| 변수 | `card/padding` | `16` (px) | 필터 화면 카드 내부 패딩 |
| 변수 | `card/radius` | `12` (px) | 필터 화면 카드 코너 반경 |
| 변수 | `color/background/default` | `#fafaf9` | 메인·필터 페이지 루트, MainContent, 검색 필드(SearchBar) 배경 |
| 변수 | `color/background/placeholder` | `#f5f5f4` | RecipeGridCard 이미지 컨테이너 배경; **조리 순서 StepBadge** 원형 배경 |
| 변수 | `color/background/surface` | `#ffffff` | Navbar, SearchBarHeader, Tabbar, CardBase·ToggleCard·SearchBarCard, ActionGroup 바; 레시피 상세 **CardTag**(시간·난이도·인분) 면 |
| 변수 | `color/border/subtle` | `#e5e5e5` | Navbar·Tabbar 보더; **RecipeIngredientRow** 행 구분선 |
| 변수 | `color/border/muted` | `#f5f5f4` | 마이페이지 섹션 경계선(그룹 분리선), 리스트 구분선의 저대비 보더 |
| 변수 | `color/dropdown/selected/default` | `#fff7ed` | 챗봇 대화 목록 카드 아이콘 쉘 배경(`IconShell`) |
| 변수 | `color/indicator/inactive` | `#d4d4d4` | PaginationDot 비활성 |
| 변수 | `color/primary` | `#c2410c` | PaginationDot 활성, Tab 활성, Toggle 선택 칩, Primary 버튼·헤더 아이콘 강조 |
| 변수 | `color/scrollbar/thumb` | `#d4d4d4` @ 80% 불투명 (`#d4d4d4cc`) | MainContent CustomScrollbar |
| 변수 | `color/secondary` | `#fafaf9` | 필터 하단 **초기화** 버튼 면(ActionGroup Secondary) — 제품 JSON의 브랜드 `secondary`와 **동일 값 아님** |
| 변수 | `color/tab/active` | `#c2410c` | Tabbar 활성 탭 라벨 |
| 변수 | `color/tab/inactive` | `#737373` | Tabbar 비활성 탭 라벨 |
| 변수 | `color/tag/accent` | `#fff7ed` | 레시피 상세 **카테고리** FlatTag 면(연한 오렌지 틴트) |
| 변수 | `color/tag/default` | `#fafaf9` | RecipeSearchCard **FlatTag** 칩 면(`color/background/default`와 동일 hex) |
| 변수 | `color/text/accent` | `#c2410c` | 레시피 상세 카테고리 FlatTag 글자색(`color/primary`·`color/tab/active`와 동일 hex) |
| 변수 | `color/text/caption` | `#9ca3af` | RecipeGridCard 메타 행 |
| 변수 | `color/text/on-primary` | `#ffffff` | Toggle 선택 라벨, Primary 버튼 라벨 |
| 변수 | `color/text/on-secondary` | `#575352` | Secondary(초기화) 버튼 라벨 — 면은 `color/secondary`, 글자는 본 토큰 |
| 변수 | `color/text/placeholder` | `#737373` | SearchBar 플레이스홀더 |
| 변수 | `color/text/primary` | `#1c1a17` | Navbar 제목, 섹션·카드 제목, 필터 카드 섹션 제목(타이포는 Card/Heading과 조합) |
| 변수 | `color/text/secondary` | `#575352` | Toggle 비선택 칩 라벨; FlatTag·검색 카드 설명·SearchResultMeta; **재료 행 수량**(Bold), **조리 순서 StepBadge** 숫자 |
| 변수 | `color/toggle/selected/default` | `#c2410c` | Toggle 선택 칩 배경(`color/primary`와 동일 hex) |
| 변수 | `color/toggle/unselected/default` | `#fafaf9` | Toggle 비선택 칩 배경(`color/background/default`와 동일 hex) |
| 변수 | `color/toggle/unselected/hover` | `#f5f5f4` | 챗봇 입력/전송 컨텍스트의 비활성·호버 계열 면색(`Toggle/Unselected/Hover`) |
| 변수 | `elevation/md/blur` | `8` (px) | 카드·필터·**재료/조리 순서** 카드 그림자(Elevation/Medium) |
| 변수 | `elevation/md/color` | `#0f172a` @ 약 8% 불투명 (`#0f172a14`) | Elevation/Medium 섀도 색 |
| 변수 | `elevation/md/x` | `0` (px) | Elevation/Medium X |
| 변수 | `elevation/md/y` | `4` (px) | Elevation/Medium Y |
| 변수 | `elevation/sm/blur` | `2` (px) | SearchBarHeader 그림자(Elevation/Small) |
| 변수 | `elevation/sm/color` | `#0f172a` @ 약 6% 불투명 (`#0f172a0f`) | SearchBarHeader 드롭 섀도 |
| 변수 | `elevation/sm/x` | `0` (px) | Elevation/Small X |
| 변수 | `elevation/sm/y` | `1` (px) | Elevation/Small Y |
| 변수 | `radius/full` | `9999` (px) | SearchBar, Toggle 칩, 하단 버튼, PaginationDot |
| 변수 | `radius/2xl` | `16` (px) | 챗봇 대화 버블 라운드(좌/우 꼬리 제외 기본 코너), 정보 화면 IconShell 패딩 컨테이너 |
| 변수 | `radius/lg` | `8` (px) | CustomScrollbar 모서리 |
| 변수 | `radius/xl` | `12` (px) | RecipeGridCard 이미지·CardBase·ToggleCard·SearchBarCard |
| 변수 | `size/lg` | `24` (px) | 아이콘 24px 박스(탭·Navbar·뒤로가기·검색 아이콘 등) |
| 변수 | `size/md` | `20` (px) | 정렬 드롭다운 chevron·Chip 닫기 아이콘 박스 등 |
| 변수 | `size/sm` | `16` (px) | RecipeSearchCard FlatTag 내 메타 아이콘 컨테이너 |
| 변수 | `size/2xl` | `32` (px) | 검색 결과 없음 상태 아이콘(`lucide/search`) 박스 크기 |
| 변수 | `spacing/1` | `4` (px) | TabButton 내부, 카드 제목·메타 사이 |
| 변수 | `spacing/2` | `8` (px) | Navbar 아이콘·제목, 그리드·슬라이더, 스크롤바, Toggle 칩 세로 패딩 |
| 변수 | `spacing/3` | `12` (px) | SearchBar·Tabbar·SearchBarHeader, 카드 Body, ActionGroup 세로 패딩, Toggle 행 `gap` |
| 변수 | `spacing/4` | `16` (px) | Navbar·섹션 Heading·SearchBar 가로 패딩, RecipeSlider, 카드 Body 패딩, Toggle 칩 가로 패딩, ActionGroup 가로·버튼 패딩 |
| 변수 | `spacing/6` | `24` (px) | Tabbar 가로 패딩, MainContent 세로 패딩, RecipeSearchList 카드 간 `gap`, RecipeDetailContent 세로·썸네일 아래 패딩 |
| 변수 | `spacing/8` | `32` (px) | 메인 홈 MainContent 내 섹션 간 `gap` |
| 변수 | `typography/font-size-body` | `16` (px) | SearchBar 플레이스홀더·**채워진 검색어**(Medium 스타일과 조합), Toggle·버튼 라벨; 상세 **요리 설명**·**CardTag** 라벨·**조리 단계** 본문·**재료** 행 이름 |
| 변수 | `typography/font-size-caption` | `14` (px) | RecipeSearchCard 설명·FlatTag 라벨, SearchResultMeta·Chip·정렬 드롭다운; 상세 **카테고리** 태그·**StepBadge** 숫자 |
| 변수 | `typography/font-size-h1` | `28` (px) | Navbar 페이지 제목; 레시피 상세 **요리명**(본문 헤딩) |
| 변수 | `typography/font-size-h2` | `20` (px) | 추천 레시피 등 섹션 제목; **재료**·**조리 순서** 카드 제목 |
| 변수 | `typography/font-size-h3` | `18` (px) | 그리드 카드 제목; 필터 카드 섹션 제목은 **동일 크기·Medium**(Card/Heading) |
| 변수 | `typography/font-size-small` | `12` (px) | 탭 라벨, 카드 메타 |

### 스타일

| 구분 | 이름 | 값 | 사용처 |
|------|------|-----|--------|
| 스타일 | `Action/Primary/Default` | `color/primary` | 인디케이터·탭·Primary 버튼·선택 칩 등 액션 면색 |
| 스타일 | `Action/Primary/Inactive` | `color/indicator/inactive` (`#d4d4d4`) | MCP 변수 맵상 **비활성 Primary 트랙** 색(인디케이터 비활성과 동일 hex); 검색 결과 화면 컨텍스트에 포함 |
| 스타일 | `Action/Secondary/Default` | `color/secondary` | 초기화(Secondary) 버튼 면 |
| 스타일 | `Background/Placeholder` | `color/background/placeholder` | 카드 썸네일 자리 배경 |
| 스타일 | `Background/Primary/Default` | `color/background/default` | 페이지·메인 콘텐츠 기본 배경 |
| 스타일 | `Background/Surface` | `color/background/surface` | Navbar, 검색 헤더, Tabbar, 카드·하단 액션 바 |
| 스타일 | `Body/Default` | `typography/font-size-body` · Noto Sans KR Regular · lineHeight `24` | SearchBar 플레이스홀더 타이포 |
| 스타일 | `Body/Accent` | `typography/font-size-body` · Noto Sans KR Bold · lineHeight `24` | MCP 스타일 목록에 포함(강조 본문·레시피 상세 등에서 `Label/Button`과 구분해 쓸 수 있음) |
| 스타일 | `Caption/Default` | `typography/font-size-caption` · Noto Sans KR Regular · lineHeight `21` | RecipeSearchCard 설명, SearchResultMeta·Chip 본문 톤 |
| 스타일 | `Border/Subtle` | `color/border/subtle`, `border/default` | Navbar·Tabbar·ActionGroup 구분선 |
| 스타일 | `Border/Muted` | `color/border/muted`, `border/default` | 마이페이지 컨텐츠 그룹 사이의 연한 구분선 |
| 스타일 | `Card/Caption` | `typography/font-size-small` · Noto Sans KR Medium · lineHeight `16` | 카드 메타 한 줄 |
| 스타일 | `Card/Body` | `typography/font-size-caption` · Noto Sans KR Regular · lineHeight `21` | RecipeSearchCard 요약 설명 본문 |
| 스타일 | `Card/Heading` | `typography/font-size-h3` · Noto Sans KR Medium · lineHeight `27` | 필터 카드 섹션 제목; 검색 결과 카드 제목(레시피명)과 동일 스케일·굵기 조합이 쓰일 수 있음 |
| 스타일 | `Dropdown/Selected/Default` | `color/dropdown/selected/default` | 챗봇 대화 목록 `IconShell` 선택 배경(틴트) |
| 스타일 | `Elevation/Card` | `card/elevation/color`, `card/elevation/x`, `card/elevation/y`, `card/elevation/blur` | 필터 화면 SearchBarCard·ToggleCard 그림자 (`Elevation/Medium`과 수치 동일) |
| 스타일 | `Elevation/Medium` | `elevation/md/color`, `elevation/md/x`, `elevation/md/y`, `elevation/md/blur` | CardBase·SearchBarCard·ToggleCard·**RecipeIngredientsCard**·**RecipeStepsCard** |
| 스타일 | `Elevation/Small` | `elevation/sm/color`, `elevation/sm/x`, `elevation/sm/y`, `elevation/sm/blur` | SearchBarHeader 그림자; 레시피 상세 **CardTag**(시간·난이도·인분) |
| 스타일 | `H1` | `typography/font-size-h1` · Noto Sans KR Bold · lineHeight `42` | Navbar 제목 |
| 스타일 | `H2` | `typography/font-size-h2` · Noto Sans KR Bold · lineHeight `30` | 홈 섹션 제목 |
| 스타일 | `H3` | `typography/font-size-h3` · Noto Sans KR Bold · lineHeight `27` | 그리드 카드 제목 |
| 스타일 | `Indicator/Active` | `color/primary` | PaginationDot 활성(막대) |
| 스타일 | `Indicator/Inactive` | `color/indicator/inactive` | PaginationDot 비활성 |
| 스타일 | `Label/Button` | `typography/font-size-body` · Noto Sans KR Bold · lineHeight `24` | 하단 초기화·검색 버튼 라벨 타이포 |
| 스타일 | `Label/Dropdown` | `typography/font-size-caption` · Noto Sans KR Medium · lineHeight `21` | 검색 결과 **정렬** 드롭다운 라벨(예: 최신순) |
| 스타일 | `Label/Tab` | `typography/font-size-small` · Noto Sans KR Medium · lineHeight `16` | 탭 라벨 타이포 |
| 스타일 | `Label/Toggle` | `typography/font-size-body` · Noto Sans KR Medium · lineHeight `24` | Toggle 칩 라벨 타이포 |
| 스타일 | `Scrollbar/Thumb` | `color/scrollbar/thumb` | CustomScrollbar |
| 스타일 | `SearchBar/Value` | `typography/font-size-body` · Noto Sans KR Medium · lineHeight `24` | 검색 결과 상단 SearchBar **채워진 값**(플레이스홀더와 구분) |
| 스타일 | `Small` | `typography/font-size-small` · Noto Sans KR Regular · lineHeight `16` | 챗봇 대화 버블 타임스탬프(오전 10:31 등) |
| 스타일 | `Text/Button/Primary` | `color/text/on-primary` | Primary 버튼 라벨 색 |
| 스타일 | `Text/Button/Secondary` | `color/text/on-secondary` | Secondary(초기화) 버튼 라벨 색 |
| 스타일 | `Text/Caption` | `color/text/caption` | 카드 메타 색 |
| 스타일 | `Text/Placeholder` | `color/text/placeholder` | 검색 필드 힌트 색 |
| 스타일 | `Text/Primary` | `color/text/primary` | 제목·강조 본문 색 |
| 스타일 | `Text/Accent` | `color/text/accent` | 레시피 상세 **카테고리** FlatTag 글자색 |
| 스타일 | `Text/Secondary` | `color/text/secondary` | 보조 본문·FlatTag 글자색(캡션 스케일과 조합) |
| 스타일 | `Text/Tab/Active` | `color/tab/active` | Tabbar 활성 라벨 |
| 스타일 | `Text/Tab/Inactive` | `color/tab/inactive` | Tabbar 비활성 라벨 |
| 스타일 | `Text/Toggle/Active` | `color/text/on-primary` | 선택 칩 라벨 색 |
| 스타일 | `Text/Toggle/Inactive` | `color/text/secondary` | 비선택 칩 라벨 색 |
| 스타일 | `Toggle/Selected/Default` | `color/toggle/selected/default` | 선택 칩 배경 |
| 스타일 | `Toggle/Unselected/Default` | `color/toggle/unselected/default` | 비선택 칩 배경 |
| 스타일 | `Toggle/Unselected/Hover` | `color/toggle/unselected/hover` | 챗봇 하단 전송 버튼 비활성/호버 톤(중립 회색 면) |
| 스타일 | `Tag/Default` | `color/tag/default` | RecipeSearchCard **FlatTag**(시간·난이도·인분) 면색 |
| 스타일 | `Tag/Accent` | `color/tag/accent` | 레시피 상세 **카테고리** FlatTag 면색 |

---

## 권장 수정사항 (선택)

1. **Elevation 계열 정리**: 메인 홈 검색 헤더는 **`Elevation/Small`**, 필터·카드는 **`Elevation/Medium`** — 의도된 단계 구분이면 문서화만, 동일 “카드 그림자”로 통일할지 팀 규칙으로 정할 것.
2. **그리드 간격(홈)**: `RecipeGrid` 등에 `gap`이 픽셀 리터럴만 보이는 구간 → `spacing/*` 바인딩 점검.
3. **Navbar·헤더**: `pb` 17px, `BackButton`·`AdditionalButtonContainer` **절대 좌표** → spacing 토큰·오토레이아웃 정렬 검토.
4. **필터 MainContent**: 자식 카드 세로 스택에 **섹션 간 gap**이 MCP 코드에 토큰으로 드러나지 않으면, 프레임에서 간격 변수 적용 여부 확인.
5. **이중·동값 변수**: `color/primary` ≡ `color/toggle/selected/default`, `color/background/default` ≡ `color/toggle/unselected/default` ≡ `color/secondary`(필터 버튼 면), `color/text/secondary` ≡ `color/text/on-secondary` — **alias·SSOT 한 축** 검토.
6. **검색 결과 메타 강조 숫자**: `SearchResultMeta`에서 건수 강조가 MCP 코드에 **`text-[#c2410c]` 리터럴**로만 보일 수 있음 → `color/primary` 등 **변수·시맨틱 토큰** 바인딩 검토(SSOT).
7. **FlatTag 내부 간격**: 아이콘·텍스트 사이 `gap-[7.997px]` 등 **픽셀 리터럴** → `spacing/*` 정렬 검토.
8. **좋아요 버튼 래퍼**: 썸네일 위 `LikeButtonWrapper`의 `right`/`top` **절대 좌표**·`Elevation/Small` 조합은 의도 유지 시 문서화, 토큰화 가능하면 정렬 규칙으로 옮길 것.
9. **필터 Chip vs FlatTag**: Chip 행은 면이 `color/background/default`, FlatTag는 `color/tag/default`(동일 hex) — **별도 변수 vs alias** 정리 검토.
10. **레시피 상세 세로 간격**: `RecipeDetailHeader`·`CardTagsRow` 등에 `gap-[12px]`가 **리터럴**로만 보이는 구간 → `spacing/3` 바인딩 검토.
11. **조리 순서 Steps**: 단계 블록 `gap-[16px]`, **StepBadge** `32px` 고정, **CardTag** 아이콘 `18px` 등 → `spacing/4`·`size/*` 토큰화 또는 의도 문서화.
12. **SearchBar 포커스 상태 토큰화**: 컴포넌트 설명에 `ring-2`, `ring-offset-2`가 명시되어 있고 변수 맵에 `border/focus=2`가 존재함 → 포커스 링 두께/오프셋이 리터럴로 남지 않도록 `border/focus`(및 필요 시 대응 offset 토큰) 기준으로 정렬 검토.
13. **카드 토큰 네임스페이스 정합성**: 필터 노드(`233:1638`)에서 `card/gap`, `card/padding`, `card/radius`, `Elevation/Card`가 확인되며 기존 `spacing/*`, `radius/xl`, `Elevation/Medium`과 값이 겹침 → 화면 전용 토큰 유지 여부를 정하고, 공통 토큰 alias 또는 단일 SSOT로 통일 검토.
14. **틴트 배경 토큰 중복**: `color/dropdown/selected/default`와 `color/tag/accent`가 동일 `#fff7ed`를 사용함 → 용도 분리 유지 여부를 결정하고, 공통 tint 토큰 alias로 정리할지 검토.
15. **챗버블 최대 폭 토큰화**: 컴포넌트 설명에서 ChatBubble 최대 길이를 `design_tokens.json` 기준으로 관리하라고 명시됨. 현재 MCP 코드에 `max-w-[320px]`, `min-w-[120px]` 리터럴이 보여서, 대화 버블 폭 규칙을 사이즈 토큰으로 승격할지 검토.
16. **보관함 그리드 레이아웃 토큰화**: `IngredientGrid`에서 `gap-x-[16px]`, `gap-y-[16px]`, 행 높이 `113px` 리터럴이 보임 → `spacing/*`·`size/*`(또는 카드 높이 전용 토큰)로 치환해 반응형/일관성 기준 정렬 검토.
17. **보더/배경 동값 중복**: `color/border/muted`와 `color/background/placeholder`가 동일 `#f5f5f4`를 사용함 → 보더 전용 토큰 분리 유지 또는 공통 neutral alias로 단일화할지 SSOT 관점 정리 검토.

---

## 토큰·스타일 검토 (이슈 및 해결 방향)

아래는 통합 표·`design_tokens.json`을 기준으로 한 검토이다. **색 대비** 수치는 경향 수준이며, 최종 판단은 [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) 등으로 측정하는 것을 권장한다.

### 1. 디자인 시스템 구조상 이름이 부적절한 경우

| 케이스 | 이유 | 해결 방향 |
|--------|------|-----------|
| `Background/Placeholder` / `color/background/placeholder` | **썸네일 자리**와 입력 placeholder 용어 충돌 | 콘텐츠 역할이 드러나는 이름 검토 |
| `typography/font-size-h3` | **H3 Bold(카드 제목)**와 **Card/Heading Medium(필터 섹션)**이 같은 크기 토큰 공유 | 스케일 토큰 + 복합 텍스트 스타일로 역할 분리 검토 |
| `color/secondary` | **연한 버튼 채움**인데 JSON `secondary`는 브랜드 2차색 | Figma·코드에서 **이름 분리**(예: `surface/button-muted`, `color/action-secondary-surface`) |
| `color/text/on-secondary` | “on-secondary”는 보통 **세컨더리 배경 위 전경**인데, 실제는 **연한 면 위 짙은 글자** | `text/action-secondary` 등 의미 재정의 또는 `on-*`는 짝 배경이 있을 때만 사용 |
| PascalCase 스타일 vs `color/...` 변수 | 패널·코드 간 이중 진입점 | 스타일 → 변수 매핑 테이블 + SSOT 축 하나 정함 |

### 2. 의미와 실제 사용처가 맞지 않는 경우

| 케이스 | 불일치 | 해결 방향 |
|--------|--------|-----------|
| JSON `secondary` / `on-secondary` | 제품 팔레트 vs Figma 필터 버튼 | SSOT 우선순위 정한 뒤 이름·값 동기화 |
| `color/text/placeholder` vs `color/tab/inactive` | 값 동일 시 테마 독립 조정 어려움 | alias 또는 탭 전용 토큰 분리 |

### 3. 중복·SSOT 문제가 예상되는 경우

| 케이스 | 내용 | 해결 방향 |
|--------|------|-----------|
| `color/primary` · `color/toggle/selected/default` · `Text/Tab/Active` 등 | 동일 주황의 다중 경로 | 하나만 SSOT, 나머지 alias |
| `elevation/sm/*` vs `elevation/md/*` | 화면별로 그림자 단계가 다름 | 디자인 의도 문서화 또는 단계 수 최소화 |
| `color/text/secondary` ≡ `color/text/on-secondary` | 동일 `#575352` 이중 경로 | 한 토큰으로 통합 또는 alias |
| `color/tag/default` ≡ `color/background/default` | 동일 `#fafaf9` 이중 경로 | 태그 전용 의미 유지 vs 배경 토큰 alias |
| `color/text/caption` vs `color/text/secondary` | 그리드 메타는 caption, 검색 카드 설명·FlatTag는 secondary(MCP 기준) | 역할별로 둘 다 필요하면 명명·대비 정책 문서화 |
| `color/text/accent` ≡ `color/primary` ≡ `color/tab/active` | 동일 `#c2410c` 다중 경로 | 강조 텍스트는 **한 토큰**만 SSOT, 나머지 alias |
| `Tag/Accent` vs `Tag/Default` | 면색·의미가 다름(연한 틴트 vs 중립 회색 톤) | 용도별 유지; `color/tag/accent`만으로 시맨틱 구분 |

### 4. 색상 대비가 불안한 경우

| 조합 | 우려 | 해결 방향 |
|------|------|-----------|
| `color/text/placeholder` on `color/background/default` | 작은 글씨·탭에서 AA 이슈 가능 | 실측·토큰 분리 |
| `color/text/caption` on `color/background/placeholder` | 12px 메타 | 필수 정보는 caption만 쓰지 않기; 대비 개선 |
| `color/tab/active` / `color/primary` 텍스트 on 흰 배경 | 오렌지 단독 글자색 대비 | 검사 후 진한 primary 텍스트 토큰 검토 |

### 5. 오버 엔지니어링 가능성

| 케이스 | 내용 | 해결 방향 |
|--------|------|-----------|
| 그림자 변수 4개×단계 | 코드는 `box-shadow` 한 줄과 매핑 가능 | 제품 단일 shadow 토큰 + Figma 세분 변수 |

### 요약

- **노드 병합 결과(역할만 요약)**: 홈 화면 루트는 탭·슬라이더·**Small** 섀도 중심; 필터 루트는 토글·카드·**Medium**·하단 버튼; 검색 결과 루트는 캡션 스케일·검색 바 값·태그·칩 등; 상세 루트는 **`color/text/accent`·`color/tag/accent`·`Text/Accent`·`Tag/Accent`·`Body/Accent`**, **CardTag(Small 섀도)**, 재료 행·조리 순서(StepBadge·Medium 카드), Navbar 좋아요·공유 등을 추가로 드러낸다.
- **가장 유의할 SSOT 이슈**: 검색 건수 강조는 **raw hex vs `color/primary`** 정리가 필요할 수 있음.

---

## 참고

- **Component descriptions (Figma)**: `SearchBar` — `transition-shadow`; focus 시 `outline-none`, `ring-2`, `ring-offset-2` 등. 필터·검색 결과 등 동일 컴포넌트 인스턴스에 적용될 수 있음.
- 아이콘·이미지는 MCP 자산 URL로만 제공되며 토큰 표와 별개이다.
- 스타일 **이름**은 Figma 텍스트·색·이펙트 스타일명, **값** 열은 연결 변수 위주로 기술했다.
