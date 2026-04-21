# Design to Code — 불일치 검출 로그

- 기준 소스: `https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Cook`
- `fileKey`: `r9bdZPeswvPR1ncezzt4ri`
- 루트 노드: `36:333` (`UI`)

## 2026-04-21 — 액션 · 아이콘 버튼 (1차)

- 검출 기준: Figma `UI`(`36:333`)의 액션 버튼 노드와 `client/src/components/ui/buttons/*` 구현 대조
- 사용 MCP: `get_metadata`(루트 구조), `get_design_context`(각 버튼 노드)
- 대상 노드:
  - `BackButton`: `162:711`
  - `AddButton`: `162:770`
  - `LikeButton`: `166:1686`(false), `256:2372`(true)
  - `ShareButton`: `166:1687`
- 검출 결과:
  - `BackButton` 일치: `44x44` 터치 타깃(`touch-target-icon`) + `24px` 아이콘(`size-6`) + 기본 텍스트 컬러
  - `AddButton` 일치: `44x44` 터치 타깃 + `24px` 아이콘 + 기본 텍스트 컬러
  - `LikeButton` 일치: `isFavorite=false`(윤곽), `isFavorite=true`(채움) 상태 분리 및 `#C2410C` 계열 토큰 매핑(`fill-primary-default`, `style-text-accent`)
  - `ShareButton` 일치: `44x44` 터치 타깃 + `24px` 아이콘 + 기본 텍스트 컬러
- 결론: **치명/주요 불일치 없음**

## 2026-04-21 — 내비 · 검색 · 본문 골격 (1차)

- 검출 기준: Figma `UI`(`36:333`)의 내비/검색/본문 골격 노드와 레이아웃·폼 컴포넌트 구현 대조
- 사용 MCP: `get_design_context`(컴포넌트 세트/단일 노드)
- 대상 노드:
  - `Navbar` 세트: `180:1770`
  - `Input` 세트: `308:2939`
  - `SearchBar`: `308:3125`
  - `SearchBarHeader` 세트: `190:2861`
  - `CustomScrollbar`: `216:2300`
  - `MainContent` 세트: `216:2304`
  - `Tabbar` 세트: `307:2334`
- 불일치:
  - `MainContent` (중요):
    - Figma 기준: 컨테이너 자체는 `Background/Primary` + 스크롤 옵션(`scroll=true/false`) 중심이며 기본 내부 패딩/간격이 없음
    - 구현(`client/src/components/layout/MainContent/MainContent.tsx`): 기본값으로 내부에 `px-4`, `py-6`, `gap-8`이 항상 적용됨
    - 영향: 별도 설정 없이 사용 시 Figma 기본 배리언트 대비 콘텐츠 시작 위치/간격이 과도하게 벌어짐
  - `SearchBarHeader` (경미):
    - Figma 기본 텍스트: `레시피 검색하기`
    - 구현 기본 placeholder: `검색어를 입력해 주세요`
    - 영향: 기본 상태 스냅샷 비교 시 문구 불일치
- 일치/특이사항:
  - `Navbar`: surface/border, 높이(`h-12`), 좌우 버튼 슬롯 구조, 액션 버튼 조합이 Figma 세트와 정합
  - `Input`: default/focus/disabled, icon/clear 조합 및 포커스 링(`ring + ring-offset`) 요구사항 정합
  - `SearchBar`: Input 조합 방식(아이콘 + placeholder + clear 조건) 정합
  - `CustomScrollbar`: thumb 폭/색상/radius 및 `MainContent` 오버레이 위치(`top 8`, `right 4`) 정합
  - `Tabbar`: surface/border, `gap-6 px-6 py-3`, active/inactive 토큰 정합
- 결론: **주요 1건(`MainContent` 기본 내부 spacing), 경미 1건(`SearchBarHeader` 기본 placeholder)**
- 수정 반영:
  - `client/src/components/layout/MainContent/MainContent.tsx`
    - 기본값을 `paddingX=false`, `paddingY=false`로 변경
    - 기본 내부 클래스에서 `gap-8` 제거
  - `client/src/components/layout/SearchBarHeader/SearchBarHeader.tsx`
    - 기본 placeholder를 `레시피 검색하기`로 변경

## 2026-04-21 — 레시피 노출 · 캐러셀 (1차)

- 검출 기준: Figma `UI`(`36:333`)의 레시피 노출/캐러셀 노드와 구현 컴포넌트 대조
- 사용 MCP: `get_design_context`
- 대상 노드:
  - `RecipeGridCard`: `166:2030`
  - `RecipeGrid`: `167:2276`
  - `PaginationDot` 세트: `198:1397`
  - `SliderPagination` 세트: `198:1388`
  - `RecipeSlider`: `183:2136`
  - `RecipeSection`: `167:2463`
- 불일치:
  - `RecipeGridCard` (경미):
    - Figma 기준: 메타(`15분 · 쉬움 · 2인분 · 한식`)가 한 줄 노출(`whitespace-nowrap`)
    - 구현(`client/src/components/recipe/cards/RecipeGridCard/RecipeGridCard.tsx`): 메타 라인에 `whitespace-normal` 적용
    - 영향: 긴 메타 조합에서 2줄 줄바꿈이 발생해 카드 하단 높이/밀도 편차 가능
- 일치/특이사항:
  - `RecipeGrid`: 2열, `gap-x-4(16)` / `gap-y-6(24)` 정합
  - `PaginationDot`/`SliderPagination`: inactive `8x8`, active `24x8`, 간격 `8` 정합
  - `RecipeSlider`: 상하 간격 `16`, 트랙 패딩/peek 구조(다음 슬라이드 일부 노출) 정합
  - `RecipeSection`: 헤딩 좌우 패딩 `16`, 섹션-슬라이더 간격 `16` 정합
- 결론: **경미 1건(`RecipeGridCard` 메타 줄바꿈 처리), 치명/주요 불일치 없음**

## 2026-04-21 — 카드 · 토글 · 액션 그룹 (1차)

- 검출 기준: Figma `UI`(`36:333`)의 카드/토글/액션 그룹 노드와 구현 컴포넌트 대조
- 사용 MCP: `get_design_context`
- 대상 노드:
  - `SearchBarCard`: `233:1720`
  - `Button` 세트: `228:1571`
  - `Toggle` 세트: `231:1601`
  - `FlatRow`: `224:1552`
  - `ToggleCard`: `233:1857`
  - `ActionGroup`: `231:1656`
- 불일치:
  - `Toggle` (중요):
    - Figma 기준: `size=medium` 토글은 세트에서 고정 폭(`225`) + `rounded-xl` + `py-3` 조합
    - 구현(`client/src/components/ui/Toggle/Toggle.tsx`): `size=medium`이 `w-full`로 정의되어 컨테이너 폭에 따라 과도 확장 가능
    - 영향: medium 토글을 단독/임의 레이아웃에 배치할 때 Figma 기준보다 넓게 렌더링될 수 있음
- 일치/특이사항:
  - `SearchBarCard`/`ToggleCard`: card surface·radius·elevation·내부 gap 구조 정합
  - `Button`: variant/state(size 포함) 토큰 매핑 및 라벨 타이포 계층 정합
  - `FlatRow`: 최소 높이(`85`)와 토글 래핑 행 동작 정합
  - `ActionGroup`: 상단 border, 양쪽 버튼 1:1 분할, 간격/패딩 정합
- 결론: **중요 1건(`Toggle size=medium` 폭 처리), 치명 불일치 없음**
