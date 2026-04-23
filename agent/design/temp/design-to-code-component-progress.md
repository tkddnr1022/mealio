# Design to Code — 컴포넌트 순차 작업 프로그레스

- **소스**: `https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Cook` — `fileKey` `r9bdZPeswvPR1ncezzt4ri`, 스테이징 섹션 **UI** 루트 노드 `36:333`.

## 전체 컴포넌트 목록 및 순차 작업 프로그레스

### 액션 · 아이콘 버튼

- [x] `BackButton`
- [x] `AddButton`
- [x] `LikeButton` 세트 (`isFavorite=false` / `isFavorite=true`)
- [x] `ShareButton`

### 내비 · 검색 · 본문 골격

- [x] `Navbar` 세트 (`buttons=empty` … `engageWithBack`)
- [x] `Input` 세트 (`filled` × `state` × `displayIcon` × `displayClear`)
- [x] `SearchBar`
- [x] `SearchBarHeader` 세트 (`state=default` / `hover`)
- [x] `CustomScrollbar`
- [x] `MainContent` 세트 (`scroll=true` / `false`)
- [x] `Tabbar` 세트 (`activeIndex=1` … `4`)

### 레시피 노출 · 캐러셀

- [x] `RecipeGridCard`
- [x] `RecipeGrid`
- [x] `PaginationDot` 세트 (`state=inactive` / `active`)
- [x] `SliderPagination` 세트 (`activeIndex=1|2|3`)
- [x] `RecipeSlider`
- [x] `RecipeSection`

### 카드 · 토글 · 액션 그룹

- [x] `SearchBarCard`
- [x] `Button` 세트 (`variant` × `state` × `size`, primary에만 `inactive`)
- [x] `Toggle` 세트 (`selected` × `state` × `size`)
- [x] `FlatRow`
- [x] `ToggleCard`
- [x] `ActionGroup`

### 드롭다운 · 칩 · 검색 결과 헤더

- [x] `DropdownButton` 세트 (`open=true` / `false`)
- [x] `DropdownItem` 세트 (`selected` × `state`)
- [x] `DropdownList`
- [x] `FilterDropdown` 세트
- [x] `Chip` 세트 (`state=기본` / `hover`)
- [x] `ChipsRow`
- [x] `SearchResultTop`
- [x] `SearchResultMeta`
- [x] `SearchResultHeader`
- [x] `FlatTag` 세트 (`accent=true` / `false`)
- [x] `FlatTagsRow`

### 썸네일 · 검색 카드 · 정보 화면

- [x] `Thumbnail` 세트 (`square=true` / `false`)
- [x] `RecipeSearchCard`
- [x] `RecipeSearchList`
- [x] `InfoScreen` (명칭·용도 확인)

### 아이콘 셸 · 레시피 상세 블록

- [x] `IconShell` 세트 (`variant` × `size`)
- [x] `CardTag`
- [x] `CardTagsRow`
- [x] `RecipeIngredientRow`
- [x] `RecipeIngredientsCard`
- [x] `RecipeStepRow`
- [x] `RecipeStepsCard`
- [x] `RecipeDetailHeader`
- [x] `RecipeDetailContent`

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
- [ ] `InventoryTab` 세트 (`selected=owned` / `favorite`)
- [ ] `IngredientGridHeader`
- [ ] `IngredientSearchResult`

### 마이페이지 · 메뉴

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
