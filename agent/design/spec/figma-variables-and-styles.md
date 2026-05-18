# Figma — 통합 변수·스타일 목록

- **소스**: `https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Mealio` — `fileKey` `r9bdZPeswvPR1ncezzt4ri`, 스테이징 섹션 **UI** 루트 노드 `36:333` + 추가 수집 노드 `492:2935`(`SubTab`), `492:2955`(`InventorySubTabbar`).
- **수집 방법**: Figma MCP `get_variable_defs`를 위 루트에 **한 번** 호출해 스테이징 하위 전 컴포넌트 서브트리에 등장하는 변수·스타일 정의를 평탄 맵으로 수집 후 표로 정리했다. 동일 노드에 대한 `get_design_context`는 섹션 노드라 **희소 메타(XML 구조)만** 반환되어, 본 표는 **변수 맵이 단일 근거**다. 보조 `search_design_system`은 사용하지 않았다.
- **수집 시점**: 2026-05-01 (변수 표 보완: 2026-05-14 — **Alert** 노드 `590:4481`, MCP `get_design_context` 기준 `color/state/*` 값 반영)
- **주의**: MCP 응답 시점 스냅샷이다. Figma 수정 후 재수집할 것.
- **절차·피드백 분리**: 수집·검토 절차는 `agent/design/guidelines/design_system_collection_guidelines.md`를 본다. **컴포넌트 순차 작업 프로그레스**는 `agent/design/temp/figma-ds-component-progress.md`에 둔다. **권장 수정사항·토큰·스타일 검토·참고 노트**는 `agent/design/temp/figma-variables-and-styles-feedback.md`에 둔다.

---

## 변수·스타일 목록

### 변수

| 구분 | 이름 | 값 | 사용처 |
| ---- | ---- | --- | ------ |
| 변수 | `border/default` | `1` (px) | UI 스테이징 전반 보더 두께(내비·탭·액션 바·드롭다운·메뉴 구분선·`InventorySubTabbar` 비활성 하단선 등) |
| 변수 | `border/focus` | `2` (px) | **Input** 포커스 링·검색 필드 포커스 링·`SubTab` 활성 하단선 두께 |
| 변수 | `card/elevation/blur` | `8` (px) | 카드 계열 그림자(`Elevation/Card`·필터 카드) |
| 변수 | `card/elevation/color` | `#0f172a` @ 약 8% 불투명 (`#0f172a14`) | 카드 그림자 색 |
| 변수 | `card/elevation/x` | `0` (px) | 카드 그림자 X |
| 변수 | `card/elevation/y` | `4` (px) | 카드 그림자 Y |
| 변수 | `card/gap` | `12` (px) | 카드 내부 세로 간격(토글 카드·플랫 행 등) |
| 변수 | `card/padding` | `16` (px) | 카드 내부 패딩 |
| 변수 | `card/radius` | `12` (px) | 카드 코너 반경 |
| 변수 | `color/background/placeholder` | `#f5f5f4` | 썸네일 플레이스홀더·연한 면 |
| 변수 | `color/background/primary` | `#fafaf9` | **Input**·**SearchBar**·**MainContent** 등 필드·본문 배경 |
| 변수 | `color/background/surface` | `#ffffff` | **Navbar**·**Tabbar**·`InventorySubTabbar`·카드·서치 헤더·서페이스 면 |
| 변수 | `color/border/accent` | `#c2410c` | 포커스·강조 보더 |
| 변수 | `color/border/muted` | `#f5f5f4` | 마이페이지·리스트 저대비 구분선 |
| 변수 | `color/border/subtle` | `#e5e5e5` | 내비·탭·행 구분선 |
| 변수 | `color/chip/default` | `#fafaf9` | **Chip** 기본 면 |
| 변수 | `color/chip/hover` | `#f5f5f4` | **Chip** 호버 면 |
| 변수 | `color/dropdown/selected/default` | `#fff7ed` | 드롭다운·**IconShell** 등 선택 배경 틴트 |
| 변수 | `color/dropdown/selected/hover` | `#f8f0e6` | 드롭다운 선택 항목 호버 |
| 변수 | `color/dropdown/unselected/default` | `#ffffff` | 드롭다운 비선택 기본 면 |
| 변수 | `color/dropdown/unselected/hover` | `#fafaf9` | 드롭다운 비선택 호버 면 |
| 변수 | `color/indicator/inactive` | `#d4d4d4` | 페이지네이션 도트 비활성 등 |
| 변수 | `color/on-primary` | `#ffffff` | Primary 면 위 텍스트·아이콘; **Toggle** 선택 칩 라벨 |
| 변수 | `color/on-secondary` | `#575352` | Secondary 버튼 라벨 |
| 변수 | `color/primary` | `#c2410c` | Primary 액션·탭 활성·토글 선택 등 |
| 변수 | `color/primary-hover` | `#9a3412` | Primary·토글 선택 호버 |
| 변수 | `color/primary-inactive` | `#d4d4d4` | Primary 트랙 비활성(`Action/Primary/Inactive`) |
| 변수 | `color/provider/google/on-primary` | `#1f1f1f` | **LoginButton** 구글 라벨 |
| 변수 | `color/provider/google/primary` | `#f2f2f2` | **LoginButton** 구글 면 |
| 변수 | `color/provider/kakao/on-primary` | `#000000` @ 약 85% 불투명 (`#000000d9`) | **LoginButton** 카카오 라벨 |
| 변수 | `color/provider/kakao/primary` | `#fee500` | **LoginButton** 카카오 면 |
| 변수 | `color/provider/naver/on-primary` | `#ffffff` | **LoginButton** 네이버 라벨 |
| 변수 | `color/provider/naver/primary` | `#03a94d` | **LoginButton** 네이버 면 |
| 변수 | `color/scrollbar/thumb` | `#d4d4d4` @ 80% 불투명 (`#d4d4d4cc`) | **CustomScrollbar**·스크롤 오버레이 |
| 변수 | `color/secondary` | `#fafaf9` | Secondary(초기화) 버튼 면 |
| 변수 | `color/secondary-hover` | `#f5f5f4` | Secondary 버튼 호버 |
| 변수 | `color/tab/active` | `#c2410c` | 탭 활성 라벨(`SubTab`·`InventorySubTabbar`) |
| 변수 | `color/tab/inactive` | `#737373` | 탭 비활성 라벨(`SubTab`·`InventorySubTabbar`) |
| 변수 | `color/tag/accent` | `#fff7ed` | 강조 **FlatTag** 면 |
| 변수 | `color/tag/default` | `#fafaf9` | 레시피 카드 **FlatTag** 기본 면 |
| 변수 | `color/text/accent` | `#c2410c` | 강조 라벨·카테고리 태그 |
| 변수 | `color/text/caption` | `#9ca3af` | 보조 메타 텍스트 |
| 변수 | `color/text/disabled` | `#a3a3a3` | 비활성 라벨 |
| 변수 | `color/text/placeholder` | `#737373` | 플레이스홀더 |
| 변수 | `color/text/primary` | `#1c1a17` | 본문·제목·아이콘 스트로크 기본 |
| 변수 | `color/text/secondary` | `#575352` | 보조 본문·비선택 토글 라벨 |
| 변수 | `color/toggle/selected/default` | `#c2410c` | 토글 선택 칩 배경 |
| 변수 | `color/toggle/selected/hover` | `#9a3412` | 토글 선택 칩 호버 |
| 변수 | `color/toggle/unselected/default` | `#fafaf9` | 토글 비선택 칩 배경 |
| 변수 | `color/toggle/unselected/hover` | `#f5f5f4` | 토글 비선택 호버·채팅 하단 등 중립 면 |
| 변수 | `color/state/error/subtle` | `#fee2e2` | **Alert** `variant=error` 면 |
| 변수 | `color/state/error/default` | `#fca5a5` | **Alert** `variant=error` 상단 보더 |
| 변수 | `color/state/error/strong` | `#b91c1c` | **Alert** `variant=error` 제목·오류 아이콘 원 채움 |
| 변수 | `color/state/warning/subtle` | `#fff7ed` | **Alert** `variant=warning` 면 |
| 변수 | `color/state/warning/default` | `#fed7aa` | **Alert** `variant=warning` 상단 보더 |
| 변수 | `color/state/warning/strong` | `#c2410c` | **Alert** `variant=warning` 제목·아이콘 |
| 변수 | `color/state/info/subtle` | `#eff6ff` | **Alert** `variant=info` 면 |
| 변수 | `color/state/info/default` | `#bfdbfe` | **Alert** `variant=info` 상단 보더 |
| 변수 | `color/state/info/strong` | `#2b6ba3` | **Alert** `variant=info` 제목·아이콘 |
| 변수 | `elevation/md/blur` | `8` (px) | 중간 그림자(`Elevation/Medium`) |
| 변수 | `elevation/md/color` | `#0f172a` @ 약 8% 불투명 (`#0f172a14`) | Elevation/Medium 색 |
| 변수 | `elevation/md/x` | `0` (px) | Elevation/Medium X |
| 변수 | `elevation/md/y` | `4` (px) | Elevation/Medium Y |
| 변수 | `elevation/sm/blur` | `2` (px) | 작은 그림자(`Elevation/Small`) |
| 변수 | `elevation/sm/color` | `#0f172a` @ 약 6% 불투명 (`#0f172a0f`) | Elevation/Small 색 |
| 변수 | `elevation/sm/x` | `0` (px) | Elevation/Small X |
| 변수 | `elevation/sm/y` | `1` (px) | Elevation/Small Y |
| 변수 | `logo` | `Mealio` (문자열) | **Navbar** 브랜드 텍스트 — 클라이언트 `Navbar`에서 동일 문자열로 고정 |
| 변수 | `opacity/disabled` | `50` (MCP 맵; UI 비활성 불투명도) | **Input** `disabled` 등 |
| 변수 | `radius/2xl` | `16` (px) | 큰 라운드(챗 버블·일부 셸) |
| 변수 | `radius/full` | `9999` (px) | 칩·버튼·필드 pill |
| 변수 | `radius/lg` | `8` (px) | 스크롤바 등 |
| 변수 | `radius/xl` | `12` (px) | 카드·썸네일 등 |
| 변수 | `size/2xl` | `32` (px) | 대형 아이콘 박스 |
| 변수 | `size/lg` | `24` (px) | 24px 아이콘 박스 |
| 변수 | `size/md` | `20` (px) | 20px 아이콘 박스 |
| 변수 | `size/sm` | `16` (px) | 16px 아이콘 박스 |
| 변수 | `spacing/1` | `4` (px) | 미세 간격 |
| 변수 | `spacing/10` | `40` (px) | **LoginHeader** 등 큰 세로 여백 |
| 변수 | `spacing/2` | `8` (px) | 콤팩트 간격·스크롤바 트랙 |
| 변수 | `spacing/3` | `12` (px) | 필드·탭·카드 body |
| 변수 | `spacing/4` | `16` (px) | 가로 패딩·칩 패딩 |
| 변수 | `spacing/6` | `24` (px) | 섹션·리스트 간격 |
| 변수 | `spacing/8` | `32` (px) | 블록 간격 |
| 변수 | `typography/font-size-body` | `16` (px) | 본문 스케일 |
| 변수 | `typography/font-size-caption` | `14` (px) | 캡션 스케일 |
| 변수 | `typography/font-size-h1` | `28` (px) | 페이지 제목 스케일 |
| 변수 | `typography/font-size-h2` | `20` (px) | 섹션 제목 스케일 |
| 변수 | `typography/font-size-h3` | `18` (px) | 카드·토글 섹션 제목 스케일 |
| 변수 | `typography/font-size-small` | `12` (px) | 탭·메타 스몰 타입 |

### 스타일

| 구분 | 이름 | 값 | 사용처 |
| ---- | ---- | --- | ------ |
| 스타일 | `Action/Primary/Default` | `color/primary` | Primary 버튼·인디케이터·토글 선택 면 등 |
| 스타일 | `Action/Primary/Hover` | `color/primary-hover` | Primary 호버 |
| 스타일 | `Action/Primary/Inactive` | `color/primary-inactive` | Primary 비활성 트랙 |
| 스타일 | `Action/Secondary/Default` | `color/secondary` | Secondary 버튼 면 |
| 스타일 | `Action/Secondary/Hover` | `color/secondary-hover` | Secondary 호버 |
| 스타일 | `Background/Placeholder` | `color/background/placeholder` | 이미지·플레이스홀더 배경 |
| 스타일 | `Background/Primary/Default` | `color/background/primary` | 필드·본문 기본 면 |
| 스타일 | `Background/Primary/Hover` | `color/background/placeholder` | **SearchBarHeader** 호버 시 내장 필드 면 |
| 스타일 | `Background/Surface` | `color/background/surface` | 내비·탭·카드·헤더 서페이스 |
| 스타일 | `Body/Bold` | `typography/font-size-body` · Noto Sans KR Bold · lineHeight `24` | 본문 볼드 |
| 스타일 | `Body/Medium` | `typography/font-size-body` · Noto Sans KR Medium · lineHeight `24` | 본문 미디엄 |
| 스타일 | `Body/Regular` | `typography/font-size-body` · Noto Sans KR Regular · lineHeight `24` | 본문 레귤러·플레이스홀더 톤 |
| 스타일 | `Border/Accent` | `color/border/accent`, `border/focus` | 포커스 링·`SubTab` 활성 하단선 |
| 스타일 | `Border/Muted` | `color/border/muted`, `border/default` | 마이페이지 등 연한 구분선 |
| 스타일 | `Border/Subtle` | `color/border/subtle`, `border/default` | 내비·탭·액션 바·`InventorySubTabbar` 비활성 구분선 |
| 스타일 | `Caption/Medium` | `typography/font-size-caption` · Noto Sans KR Medium · lineHeight `21` | `SubTab`·`InventorySubTabbar` 라벨 |
| 스타일 | `Caption/Regular` | `typography/font-size-caption` · Noto Sans KR Regular · lineHeight `21` | 캡션 본문 |
| 스타일 | `Card/Body` | `typography/font-size-caption` · Noto Sans KR Regular · lineHeight `21` | 카드 설명 |
| 스타일 | `Card/Caption` | `typography/font-size-small` · Noto Sans KR Medium · lineHeight `16` | 카드 메타 |
| 스타일 | `Card/Heading` | `typography/font-size-h3` · Noto Sans KR Medium · lineHeight `27` | 카드·토글 섹션 제목 |
| 스타일 | `Chip/Default` | `color/chip/default` | **Chip** 기본 |
| 스타일 | `Chip/Hover` | `color/chip/hover` | **Chip** 호버 |
| 스타일 | `Dropdown/Selected/Default` | `color/dropdown/selected/default` | 선택 항목 기본 면 |
| 스타일 | `Dropdown/Selected/Hover` | `color/dropdown/selected/hover` | 선택 항목 호버 |
| 스타일 | `Dropdown/Unselected/Default` | `color/dropdown/unselected/default` | 비선택 기본 면 |
| 스타일 | `Dropdown/Unselected/Hover` | `color/dropdown/unselected/hover` | 비선택 호버 |
| 스타일 | `Elevation/Card` | `card/elevation/color`, `card/elevation/x`, `card/elevation/y`, `card/elevation/blur` | 필터·토글 카드 등 |
| 스타일 | `Elevation/Medium` | `elevation/md/color`, `elevation/md/x`, `elevation/md/y`, `elevation/md/blur` | 카드·상세 블록 |
| 스타일 | `Elevation/Small` | `elevation/sm/color`, `elevation/sm/x`, `elevation/sm/y`, `elevation/sm/blur` | 헤더·**CardTag** 등 |
| 스타일 | `H1` | `typography/font-size-h1` · Noto Sans KR Bold · lineHeight `42` | 페이지 헤딩 |
| 스타일 | `H2` | `typography/font-size-h2` · Noto Sans KR Bold · lineHeight `30` | 섹션 헤딩 |
| 스타일 | `H3` | `typography/font-size-h3` · Noto Sans KR Bold · lineHeight `27` | 서브 헤딩 |
| 스타일 | `Indicator/Active` | `color/primary` | 페이지네이션 활성 |
| 스타일 | `Indicator/Inactive` | `color/indicator/inactive` | 페이지네이션 비활성 |
| 스타일 | `Label/Button` | `typography/font-size-body` · Noto Sans KR Bold · lineHeight `24` | 하단 액션 라벨 |
| 스타일 | `Label/Dropdown` | `typography/font-size-caption` · Noto Sans KR Medium · lineHeight `21` | 정렬·드롭다운 라벨 |
| 스타일 | `Label/Tab` | `typography/font-size-small` · Noto Sans KR Medium · lineHeight `16` | 탭 라벨 |
| 스타일 | `Label/Toggle` | `typography/font-size-body` · Noto Sans KR Medium · lineHeight `24` | 토글 칩 라벨 |
| 스타일 | `Login/Google/Background` | `color/provider/google/primary` | 구글 로그인 면 |
| 스타일 | `Login/Google/Label` | `color/provider/google/on-primary` | 구글 로그인 라벨 |
| 스타일 | `Login/Kakao/Background` | `color/provider/kakao/primary` | 카카오 로그인 면 |
| 스타일 | `Login/Kakao/Label` | `color/provider/kakao/on-primary` | 카카오 로그인 라벨 |
| 스타일 | `Login/Naver/Background` | `color/provider/naver/primary` | 네이버 로그인 면 |
| 스타일 | `Login/Naver/Label` | `color/provider/naver/on-primary` | 네이버 로그인 라벨 |
| 스타일 | `Logo/Large` | Plus Jakarta Sans ExtraBold · size `32` · lineHeight `42` | 로그인 브랜드 타이틀 |
| 스타일 | `Logo/Small` | Plus Jakarta Sans ExtraBold · size `20` · lineHeight `31` · letterSpacing `0` · `color/text/primary` | **Navbar** 워드마크 |
| 스타일 | `Scrollbar/Thumb` | `color/scrollbar/thumb` | 스크롤 썸 |
| 스타일 | `SearchBar/Value` | `typography/font-size-body` · Noto Sans KR Medium · lineHeight `24` | 입력·검색창 채워진 값 |
| 스타일 | `Small` | `typography/font-size-small` · Noto Sans KR Regular · lineHeight `16` | 타임스탬프 등 스몰 텍스트 |
| 스타일 | `Tag/Accent` | `color/tag/accent` | 강조 태그 면 |
| 스타일 | `Tag/Default` | `color/tag/default` | 기본 태그 면 |
| 스타일 | `Text/Accent` | `color/text/accent` | 강조 텍스트 |
| 스타일 | `Text/Button/Primary` | `color/on-primary` | Primary 버튼 라벨 |
| 스타일 | `Text/Button/Secondary` | `color/on-secondary` | Secondary 버튼 라벨 |
| 스타일 | `Text/Caption` | `color/text/caption` | 메타 색 |
| 스타일 | `Text/Disabled` | `color/text/disabled` | 비활성 텍스트 |
| 스타일 | `Text/Dropdown/Active` | `color/text/accent` | 드롭다운 강조 라벨 |
| 스타일 | `Text/Dropdown/Inactive` | `color/text/primary` | 드롭다운 기본 라벨 |
| 스타일 | `Text/Placeholder` | `color/text/placeholder` | 플레이스홀더 색 |
| 스타일 | `Text/Primary` | `color/text/primary` | 본문·제목 기본 색 |
| 스타일 | `Text/Secondary` | `color/text/secondary` | 보조 본문 색 |
| 스타일 | `Text/Tab/Active` | `color/tab/active` | 탭 활성(`SubTab`·`InventorySubTabbar`) |
| 스타일 | `Text/Tab/Inactive` | `color/tab/inactive` | 탭 비활성(`SubTab`·`InventorySubTabbar`) |
| 스타일 | `Text/Toggle/Active` | `color/on-primary` | 토글 선택 라벨 |
| 스타일 | `Text/Toggle/Inactive` | `color/text/secondary` | 토글 비선택 라벨 |
| 스타일 | `Toggle/Selected/Default` | `color/toggle/selected/default` | 토글 선택 배경 |
| 스타일 | `Toggle/Selected/Hover` | `color/toggle/selected/hover` | 토글 선택 호버 |
| 스타일 | `Toggle/Unselected/Default` | `color/toggle/unselected/default` | 토글 비선택 배경 |
| 스타일 | `Toggle/Unselected/Hover` | `color/toggle/unselected/hover` | 토글 비선택 호버 |
