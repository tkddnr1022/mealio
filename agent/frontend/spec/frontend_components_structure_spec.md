# 프론트엔드 컴포넌트 구조 명세서

에이전트가 `client/src/components/`에서 **무엇을 어떤 경로에 배치할지**를 정의하는 정형 명세이다. 구현 원칙·import 규칙·컴포넌트 폴더 컨벤션은 `../guidelines/frontend_component_conventions_guidelines.md`에 정의되어 있다.

아래 경로는 **저장소 루트 기준**이다.

---

## 1. 컴포넌트 디렉터리 최상위 구조

`client/src/components/`는 **전역 UI 프리미티브(`ui`)**, **앱 셸(`layout`)**, **도메인 컴포넌트(`recipe`·`chatbot`·`inventory`·`mypage`·`auth`)**로 구성한다.

| 경로 | 역할 |
|------|------|
| **client/src/components/ui/** | 도메인 중립 프리미티브(디자인 시스템) |
| **client/src/components/layout/** | 전역/앱 공통 레이아웃 셸 |
| **client/src/components/recipe/** | 레시피 탭 도메인 컴포넌트 |
| **client/src/components/chatbot/** | 챗봇 탭 도메인 컴포넌트 |
| **client/src/components/inventory/** | 보관함 탭 도메인 컴포넌트 |
| **client/src/components/mypage/** | 마이페이지 탭 도메인 컴포넌트 |
| **client/src/components/auth/** | 인증 그룹 도메인 컴포넌트 |

---

## 2. 레이어별 상세 배치 명세

### 2.1 전역 UI 프리미티브 (`client/src/components/ui/`)

| 경로 | 역할 |
|------|------|
| **client/src/components/ui/** | 도메인 독립 UI 컴포넌트 묶음 |
| client/src/components/ui/Button/ | 버튼 세트(`variant` × `state` × `size`) |
| client/src/components/ui/Input/ | 입력 필드 세트(`filled` × `state` × 아이콘/클리어 표시) |
| client/src/components/ui/SearchBar/ | 검색 입력 조합 컴포넌트 |
| client/src/components/ui/RangeSlider/ | 범위 슬라이더 |
| client/src/components/ui/RangeSliderCard/ | 범위 슬라이더 카드 조합 컴포넌트 |
| client/src/components/ui/Toggle/ | 토글 세트(`selected` × `state` × `size`) |
| client/src/components/ui/SubTab/ | 서브 탭 단일 아이템 세트(`selected`) |
| client/src/components/ui/ToggleCard/ | 카드형 토글 UI |
| client/src/components/ui/Chip/ | 칩 세트(`state`) |
| client/src/components/ui/ChipsRow/ | 칩 행 조합 컴포넌트 |
| client/src/components/ui/FlatTag/ | 플랫 태그 세트(`accent`) |
| client/src/components/ui/FlatTagsRow/ | 플랫 태그 행 조합 컴포넌트 |
| client/src/components/ui/MiniTag/ | 미니 태그 UI |
| client/src/components/ui/MiniTagsRow/ | 미니 태그 행 조합 컴포넌트 |
| client/src/components/ui/CardTag/ | 카드 내부 태그 UI |
| client/src/components/ui/CardTagsRow/ | 카드 태그 행 조합 컴포넌트 |
| client/src/components/ui/BaseRow/ | 단일 행 조합 UI |
| client/src/components/ui/ActionGroup/ | 액션 버튼 그룹 |
| client/src/components/ui/Thumbnail/ | 썸네일 세트(`square`) |
| client/src/components/ui/IconShell/ | 아이콘 래퍼 세트(`variant` × `size`) |
| client/src/components/ui/PaginationDot/ | 페이지네이션 점 세트(`active`/`inactive`) |
| client/src/components/ui/SliderPagination/ | 슬라이더 페이지네이션 세트(`activeIndex`) |
| client/src/components/ui/Spinner/ | 로딩 스피너(`Spinner`) |
| client/src/components/ui/ListLoadMore/ | 목록 하단「더 보기」버튼(무한 스크롤·페이지네이션 공용) |
| client/src/components/ui/CustomScrollbar/ | 커스텀 스크롤바 프리미티브 |
| client/src/components/ui/Alert/ | 알림 배너 세트(`variant` × 제목·메시지) |
| client/src/components/ui/Toast/ | 전역 Toast 카드·뷰포트(`Alert` 토큰 재사용) |
| **client/src/components/ui/buttons/** | 아이콘 액션 버튼 그룹 |
| client/src/components/ui/buttons/BackButton/ | 뒤로 가기 버튼 |
| client/src/components/ui/buttons/AddButton/ | 추가 버튼 |
| client/src/components/ui/buttons/LikeButton/ | 좋아요 버튼 세트(`isFavorite`) |
| client/src/components/ui/buttons/ShareButton/ | 공유 버튼 |
| **client/src/components/ui/dropdown/** | 드롭다운 프리미티브 그룹 |
| client/src/components/ui/dropdown/DropdownButton/ | 드롭다운 버튼 세트(`open`) |
| client/src/components/ui/dropdown/DropdownItem/ | 드롭다운 아이템 세트(`selected` × `state`) |
| client/src/components/ui/dropdown/DropdownList/ | 드롭다운 목록 |
| client/src/components/ui/dropdown/FilterDropdown/ | 필터 드롭다운 조합 컴포넌트 |

### 2.2 앱 셸 (`client/src/components/layout/`)

| 경로 | 역할 |
|------|------|
| **client/src/components/layout/** | 페이지 공통 골격·네비게이션 |
| client/src/components/layout/AppRootFrame/ | 앱 루트 프레임 |
| client/src/components/layout/MainContent/ | 스크롤 여부를 제어하는 본문 컨테이너 |
| client/src/components/layout/FullPageSuspenseFallback/ | `<Suspense>` 풀페이지 폴백(`MainContent` + `Spinner`) |
| client/src/components/layout/Navbar/ | 상단 내비게이션 바 세트 |
| client/src/components/layout/Tabbar/ | 하단 탭바 세트(`activeIndex`) |
| client/src/components/layout/SearchBarHeader/ | 검색 화면 상단 헤더 세트(`state`) |
| client/src/components/layout/InfoScreen/ | 빈 상태/오류/안내 공통 화면 |

### 2.3 레시피 도메인 (`client/src/components/recipe/`)

| 경로 | 역할 |
|------|------|
| **client/src/components/recipe/** | 레시피 도메인 컴포넌트 묶음 |
| **client/src/components/recipe/cards/** | 레시피 카드 계열 |
| client/src/components/recipe/cards/RecipeGridCard/ | 그리드 카드 |
| client/src/components/recipe/cards/RecipeCard/ | 검색 결과 카드 |
| client/src/components/recipe/cards/SearchBarCard/ | 검색바 연계 카드 |
| **client/src/components/recipe/lists/** | 레시피 노출 목록·캐러셀 |
| client/src/components/recipe/lists/RecipeGrid/ | 레시피 그리드 |
| client/src/components/recipe/lists/RecipeSlider/ | 레시피 슬라이더 |
| client/src/components/recipe/lists/RecipeSection/ | 섹션 단위 레시피 묶음 |
| client/src/components/recipe/lists/RecipeList/ | 검색 결과 리스트 |
| **client/src/components/recipe/search/** | 검색 결과 헤더/메타 |
| client/src/components/recipe/search/SearchResultTop/ | 검색 상단 요약 |
| client/src/components/recipe/search/SearchResultMeta/ | 검색 메타 정보 |
| client/src/components/recipe/search/SearchResultHeader/ | 검색 결과 헤더 |
| **client/src/components/recipe/detail/** | 레시피 상세 블록 |
| client/src/components/recipe/detail/RecipeDetailHeader/ | 상세 헤더 |
| client/src/components/recipe/detail/RecipeDetailContent/ | 상세 본문 |
| client/src/components/recipe/detail/RecipeIngredientRow/ | 재료 행 |
| client/src/components/recipe/detail/RecipeIngredientsCard/ | 재료 카드 |
| client/src/components/recipe/detail/RecipeStepRow/ | 조리 단계 행 |
| client/src/components/recipe/detail/RecipeStepsCard/ | 조리 단계 카드 |

### 2.4 챗봇 도메인 (`client/src/components/chatbot/`)

| 경로 | 역할 |
|------|------|
| **client/src/components/chatbot/** | 챗봇 도메인 컴포넌트 묶음 |
| **client/src/components/chatbot/list/** | 대화 목록 영역 |
| client/src/components/chatbot/list/ChatCard/ | 대화 카드 |
| client/src/components/chatbot/list/ChatList/ | 대화 목록 |
| **client/src/components/chatbot/conversation/** | 대화 화면 영역 |
| client/src/components/chatbot/conversation/ChatBubble/ | 메시지 버블 세트(`role`) |
| client/src/components/chatbot/conversation/ChatConversationRow/ | 대화 행 세트(`role`) |
| client/src/components/chatbot/conversation/ChatConversation/ | 대화 본문 |
| client/src/components/chatbot/conversation/ChatComposer/ | 입력 컴포저 세트(`filled`) |
| **client/src/components/chatbot/suggested/** | 추천 레시피 영역(명세 경로; 구현·스토리북은 `conversation/`에 두고 `suggested/`는 re-export) |
| client/src/components/chatbot/suggested/SuggestedRecipeCard/ | 추천 레시피 카드 |
| client/src/components/chatbot/suggested/SuggestedRecipeSlider/ | 추천 레시피 슬라이더 |

### 2.5 보관함 도메인 (`client/src/components/inventory/`)

| 경로 | 역할 |
|------|------|
| **client/src/components/inventory/** | 재료 보관함 도메인 컴포넌트 묶음 |
| client/src/components/inventory/IngredientCard/ | 재료 카드 세트(`selected`) |
| client/src/components/inventory/IngredientGrid/ | 재료 그리드 |
| client/src/components/inventory/InventorySubTabbar/ | 보관함 서브 탭바 세트(`selectedIndex`) |
| client/src/components/inventory/IngredientGridHeader/ | 재료 그리드 헤더 |
| client/src/components/inventory/IngredientSearchResult/ | 재료 검색 결과 |

### 2.6 마이페이지 도메인 (`client/src/components/mypage/`)

| 경로 | 역할 |
|------|------|
| **client/src/components/mypage/** | 마이페이지 도메인 컴포넌트 묶음 |
| client/src/components/mypage/UserProfile/ | 사용자 프로필 세트(`loggedIn`) |
| client/src/components/mypage/StatCard/ | 통계 카드 |
| client/src/components/mypage/CreditUsageCard/ | 크레딧 사용량 카드(`used` × `max` × `label`) |
| client/src/components/mypage/MypageHeader/ | 마이페이지 헤더 세트(`loggedIn`, 선택 `creditUsed`/`creditMax`로 `CreditUsageCard` 연동) |
| client/src/components/mypage/MenuItem/ | 메뉴 아이템 세트(`border`) |
| client/src/components/mypage/MenuSection/ | 메뉴 섹션 |

### 2.7 인증 도메인 (`client/src/components/auth/`)

| 경로 | 역할 |
|------|------|
| **client/src/components/auth/** | 인증 화면 컴포넌트 묶음 |
| client/src/components/auth/LoginButton/ | 로그인 버튼 세트(`provider`) |
| client/src/components/auth/LoginButtonList/ | 로그인 버튼 목록 |
| client/src/components/auth/LoginHeader/ | 로그인 헤더 |
| client/src/components/auth/LoginFooter/ | 로그인 푸터 |

---

## 3. 라우팅 그룹과 컴포넌트 도메인 매핑

`agent/frontend/spec/frontend_architecture_spec.md`의 라우팅 그룹·탭 구분과 컴포넌트 도메인 경계를 아래와 같이 일치시킨다.

| 라우팅 그룹/탭 | 컴포넌트 도메인 경로 |
|----------------|----------------------|
| `(auth)` | `client/src/components/auth/` |
| `(marketing)` | `client/src/components/layout/`, `client/src/components/ui/` |
| `(main) · 레시피` | `client/src/components/recipe/` |
| `(main) · 챗봇` | `client/src/components/chatbot/` |
| `(main) · 보관함` | `client/src/components/inventory/` |
| `(main) · 마이페이지` | `client/src/components/mypage/` |
