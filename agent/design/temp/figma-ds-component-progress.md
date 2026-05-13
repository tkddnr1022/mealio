# Figma ↔ 코드 DS — 컴포넌트 순차 작업 프로그레스

목적·소스 오브 트루스·MCP 절차·명세·피드백 분리 규칙은 **`agent/design/guidelines/design_system_collection_guidelines.md`**를 본다.

## 전체 컴포넌트 목록 및 순차 작업 프로그레스

### 액션 · 아이콘 버튼

- [ ] `BackButton`
- [ ] `AddButton`
- [ ] `LikeButton` 세트 (`isFavorite=false` / `isFavorite=true`)
- [ ] `ShareButton`

### 내비 · 검색 · 본문 골격

- [ ] `Navbar` 세트 (`buttons=empty` … `engageWithBack`)
- [ ] `Input` 세트 (`filled` × `state` × `displayIcon` × `displayClear`)
- [ ] `SearchBar`
- [ ] `SearchBarHeader` 세트 (`state=default` / `hover`)
- [ ] `CustomScrollbar`
- [ ] `MainContent` 세트 (`scroll=true` / `false`)
- [ ] `Tabbar` 세트 (`activeIndex=1` … `4`)

### 레시피 노출 · 캐러셀

- [ ] `RecipeGridCard`
- [ ] `RecipeGrid`
- [ ] `PaginationDot` 세트 (`state=inactive` / `active`)
- [ ] `SliderPagination` 세트 (`activeIndex=1|2|3`)
- [ ] `RecipeSlider`
- [ ] `RecipeSection`

### 카드 · 토글 · 액션 그룹

- [ ] `SearchBarCard`
- [x] `RangeSlider`
- [x] `RangeSliderCard`
- [ ] `Button` 세트 (`variant` × `state` × `size`, primary에만 `inactive`)
- [ ] `Toggle` 세트 (`selected` × `state` × `size`)
- [ ] `BaseRow`
- [ ] `ToggleCard`
- [ ] `ActionGroup`

### 드롭다운 · 칩 · 검색 결과 헤더

- [ ] `DropdownButton` 세트 (`open=true` / `false`)
- [ ] `DropdownItem` 세트 (`selected` × `state`)
- [ ] `DropdownList`
- [ ] `FilterDropdown` 세트
- [ ] `Chip` 세트 (`state=기본` / `hover`)
- [ ] `ChipsRow`
- [ ] `SearchResultTop`
- [ ] `SearchResultMeta`
- [ ] `SearchResultHeader`
- [ ] `FlatTag` 세트 (`accent=true` / `false`)
- [ ] `FlatTagsRow`

### 썸네일 · 레시피 카드 · 정보 화면

- [ ] `Thumbnail` 세트 (`square=true` / `false`)
- [ ] `RecipeCard`
- [ ] `RecipeList`
- [ ] `InfoScreen` (명칭·용도 확인)

### 아이콘 셸 · 레시피 상세 블록

- [ ] `IconShell` 세트 (`variant` × `size`)
- [ ] `CardTag`
- [ ] `CardTagsRow`
- [ ] `RecipeIngredientRow`
- [ ] `RecipeIngredientsCard`
- [ ] `RecipeStepRow`
- [ ] `RecipeStepsCard`
- [ ] `RecipeDetailHeader`
- [ ] `RecipeDetailContent`

### 채팅 · 추천

- [ ] `ChatCard`
- [ ] `ChatList`
- [ ] `ChatBubble` 세트 (`role=assistant` / `user`)
- [ ] `ChatConversationRow` 세트 (`role=assistant` / `user`)
- [ ] `MiniTag`
- [ ] `MiniTagsRow`
- [ ] `SuggestedRecipeCard`
- [ ] `SuggestedRecipeSlider`
- [ ] `ChatConversation`
- [ ] `ChatComposer` 세트 (`filled=true` / `false`)

### 재료 · 인벤토리

- [ ] `IngredientCard` 세트 (`selected=true` / `false`)
- [ ] `IngredientGrid`
- [ ] `SubTab` 세트 (`selected=true` / `false`)
- [ ] `InventorySubTabbar` 세트 (`selectedIndex`)
- [ ] `IngredientGridHeader`
- [ ] `IngredientSearchResult`

### 피드백 배너

- [x] `Alert` 세트 (`variant=error` / `warning` / `info`)

### 마이페이지 · 메뉴

- [ ] `CreditUsageCard`
- [ ] `UserProfile` 세트 (`loggedIn=true` / `false`)
- [ ] `StatCard`
- [ ] `MypageHeader` 세트 (`loggedIn=true` / `false`)
- [ ] `MenuItem` 세트 (`border=true` / `false`)
- [ ] `MenuSection`

### 로그인

- [ ] `LoginButton` 세트 (`provider=kakao` / `naver` / `google`)
- [ ] `LoginButtonList`
- [ ] `LoginHeader`
- [ ] `LoginFooter`
