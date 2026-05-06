# Figma 변수·스타일 — 권장 수정사항·검토·참고

본 문서는 `agent/design/spec/figma-variables-and-styles.md`의 **통합 표**를 보완하는 피드백·검토 산출물이다. 역할 분리·갱신 규칙은 `agent/design/guidelines/design_system_collection_guidelines.md` §7·§8 및 `agent/design/guidelines/design_system_analysis_guidelines.md`를 본다.

---

## 권장 수정사항 (선택)

표에 적힌 값·경로만을 근거로 한 후속 작업이다. `design_tokens.json`·실제 Figma 수정과 맞출 때 우선순위는 팀이 정한다.

1. (작성 필요)

---

## 토큰·스타일 검토 (이슈 및 해결 방향)

아래는 **통합 표**를 `design_system_analysis_guidelines.md` §2 체크리스트에 맞춰 정리한 것이다. 색 대비는 **경향·권장 검증** 수준이며, 최종 판단은 [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) 등으로 측정한다.

### 1. 구조·이름

| 관찰 (표 기준) | 검토 포인트 | 해결 방향 |
|----------------|-------------|-----------|
| `color/secondary` | 브랜드 의미의 “secondary”가 아니라 **연한 액션 면** | 코드·토큰 JSON과 이름·값 동기화, 또는 `surface/muted` 등으로 리네임 |
| `color/text/on-secondary` | `on-*`는 보통 특정 **배경 토큰과 짝**을 떠올리게 함 | 실제 짝은 `color/secondary` 면 — 네이밍 규칙 문서화 또는 리네임 |
| `Background/Placeholder` | **이미지 자리** 배경인데 “Placeholder”는 입력 필드와 혼동 | 스타일·변수명에서 미디어/슬롯 역할을 드러내기 |
| `typography/font-size-h3` | **H3 Bold**(그리드 카드 제목) vs **Card/Heading Medium**(**ToggleCard** 섹션·필터 섹션 제목)이 **같은 크기 토큰·다른 굵기** | 숫자 토큰 공유는 유지하되, **텍스트 스타일**로 역할 구분 유지 — 혼동 시 스케일 토큰 분리 검토 |
| `Action/Primary/Inactive` | `color/indicator/inactive` — **Primary 비활성**과 **인디케이터 비활성** 동일 | 의도적 공유면 문서화, 아니면 토큰 분리 |
| PascalCase **스타일** vs `color/...` **변수** | 두 축 모두에서 색을 고름 | SSOT를 변수 한 축으로 두고 스타일은 전부 변수 참조만 하도록 정책화 |

### 2. 의미와 사용처

| 관찰 | 검토 포인트 | 해결 방향 |
|------|-------------|-----------|
| `color/text/placeholder` `#737373` · `color/tab/inactive` 동일 | 탭 비활성과 입력 placeholder가 **같은 색** | 테마에서 독립 조정이 필요하면 토큰 분리 또는 alias 관계 명시 |
| `Text/Dropdown/Active` · `Text/Dropdown/Inactive` | 드롭다운 열림/강조 vs 닫힘 — `color/text/accent` vs `color/text/primary` | 시맨틱은 명확; 상위에서 accent·primary 중복 alias 정리와 연계 |
| 로그인 **Logo/Large**·**Logo/Small** | Plus Jakarta Sans — 본문은 Noto Sans KR | 브랜드 폰트 vs UI 폰트 이중 체계를 가이드 한 줄로 고정 |

### 3. 중복·SSOT

| 케이스 | 표상 근거 | 해결 방향 |
|--------|-----------|-----------|
| 주황 강조 | `color/primary` = `color/toggle/selected/default` = `color/text/accent` = `color/tab/active` (동일 hex) | **한 변수**를 마스터로 두고 나머지 alias |
| 보조 텍스트·버튼 라벨 | `color/text/secondary` = `color/text/on-secondary` | 중복 제거 또는 한쪽만 유지 |
| 페이지 배경 | `color/background/default` = `color/background/primary` | 하나로 통합하거나 명시적 alias |
| 카드 그림자 | `card/elevation/*` ≡ `elevation/md/*` (동일 수치), 스타일 `Elevation/Card` / `Elevation/Medium` | Figma·코드에서 **한 단계 정의**만 SSOT |
| 태그·칩·토글 비선택 면 | `#fafaf9`가 여러 경로로 반복 | `color/background/default`(또는 단일 surface) 참조로 통일 검토 |
| **ToggleCard** | `Background/Surface`·`card/padding`·`card/radius`·`Elevation/Card` / `Elevation/Medium`·내부 **Toggle**과 **필터 화면 Toggle**이 동일 토글 변수·스타일을 공유 | 필터 맥락과 **한 세트의 토큰**으로 정리됨 — 남는 이슈는 **그림자 스타일이 두 행에 모두 등장**하는 병합·중복 여부(위 표·권장 11) |

### 3.1 ToggleCard (`233:1857`) 병합 후 정리

| 항목 | 표상 근거 | 검토 |
|------|-----------|------|
| 카드 면 | `Background/Surface` → `color/background/surface` | SearchBarHeader·Tabbar 등과 동일 **흰 면** 축 — 필터 카드(SearchBarCard 등)와 시각적으로 한 팔레트 |
| 섹션 제목 | `Card/Heading` + `color/text/primary` + `typography/font-size-h3` | 필터 카드 섹션 제목과 **동일 텍스트 스타일** — H3 Bold(그리드 카드)와는 역할이 다름 |
| 내부 간격 | `card/gap`, `card/padding`, `spacing/3`(BaseRow), `spacing/2`·`spacing/4`(칩) | 12px 축이 `card/gap`과 `spacing/3`에 **겹쳐 서술** — 변수 하나로만 바인딩했는지 확인 |
| 토글 칩 | `Toggle/*`, `Text/Toggle/*`, `Label/Toggle`, `radius/full`, `color/text/on-primary` / `color/text/secondary` | 단독 **Toggle** 행과 **동일 스타일 세트** — 컴포넌트 간 복제만 한 경우 SSOT 유지에 유리 |
| 그림자 | `Elevation/Card`(`card/elevation/*`) + 표에 **`Elevation/Medium`에도 ToggleCard** | 수치는 `elevation/md/*`와 동일; **스타일 이름은 한 가지**로 통일할지 결정(권장 수정사항 11) |

### 4. 색상 대비 (샘플 검증 권장)

| 조합 (표의 변수·스타일) | 검토 이유 | 해결 방향 |
|-------------------------|-----------|-----------|
| `color/text/placeholder` on `color/background/default` / `Background/Primary` | 연한 회색 작은 글씨 | AA 기준 실측; 부족 시 진한 placeholder 토큰 또는 크기·굵기 조정 |
| `color/text/caption` on `color/background/placeholder` | 12px·메타 정보 | 필수 정보의 가독성; caption 전용 대비 정책 |
| `color/tab/active`·`Text/Tab/Active` (주황) on `Background/Surface` 등 밝은 면 | **오렌지 단독** 텍스트 | 굵기·크기별 대비 확인 |
| `color/provider/kakao/on-primary` (약 85% 불투명 검정) on 카카오 노랑 | 브랜드 고정값이어도 **실제 대비** 확인 | 접근성 요구와 충돌 시 디자인 예외·대안 문서화 |

### 5. 오버 엔지니어링

| 케이스 | 표상 근거 | 해결 방향 |
|--------|-----------|-----------|
| 그림자 | 단계마다 `color`·`x`·`y`·`blur` 4변수 + `card/*` vs `elevation/md/*` 중복 | 코드 배포 시 **semantic shadow 토큰**(`shadow-sm`, `shadow-md`)으로 축약 가능 여부 검토 |
| 타이포 | `Label/Tab`은 `font-size-small`, `Label/Toggle`·`Label/Button`은 `font-size-body`로 **스케일이 갈림** | 탭 vs 칩·버튼 라벨 구분은 유지되는지 확인; **동일 스케일·동일 굵기**가 중복되면 스타일 통합 검토 |

### 요약

- 표 기준으로 가장 큰 정리 여지는 **동일 hex의 다중 경로**(주황·보조 텍스트·배경·중립 면·그림자)와 **`color/secondary`·`on-secondary`의 제품 토큰과의 의미 차이**다.
- **ToggleCard**는 루트 `36:333` 배치와 별도로 `233:1857`에서 수집·병합되었으며, **필터 카드·단독 Toggle과 토큰이 정렬**되어 있다. 추가로 손볼 부분은 **`Elevation/Card` vs `Elevation/Medium`이 같은 노드에 중복 기술**된 것이 실제 중복 바인딩인지, 병합 문서상 중복인지 확인하는 일이다.
- 폰트는 **로고(Plus Jakarta)** vs **UI(Noto Sans KR)** 이원화가 표에 명시되어 있으므로, 신규 화면에서도 동일 규칙을 따르는지만 확인하면 된다.

---

## 참고

- **`ToggleCard`** (`233:1857`): MCP 생성 코드 기준으로 카드 루트는 `background/surface`·`card/gap`·`card/padding`·`card/radius`·`card/elevation/*`·`Elevation/Card`; 제목은 `Card/Heading`·`Text/Primary`; 본문은 **BaseRow** 안에 **Toggle** 인스턴스(선택/비선택·`Label/Toggle`·토글 면/텍스트 스타일)가 배치된다.
- **Component descriptions (Figma)**: `SearchBar` — `transition-shadow`; focus 시 `outline-none`, `ring-2`, `ring-offset-2` 등. 필터·검색 결과 등 동일 컴포넌트 인스턴스에 적용될 수 있음.
- 아이콘·이미지는 MCP 자산 URL로만 제공되며 토큰 표와 별개이다.
- 스타일 **이름**은 Figma 텍스트·색·이펙트 스타일명, **값** 열은 연결 변수 위주로 기술했다.
