# 디자인 시스템 수집 가이드라인

이 문서는 Figma 기반 **변수·스타일 수집**, 통합 목록 작성, 컴포넌트 인벤토리와의 **범위 정렬**, 그리고 **명세(`figma-variables-and-styles.md`)와 `temp` 문서(`agent/design/temp/`)의 역할 분리**까지 포함한 **반복 가능한 작업 절차**를 정의한다. 본 저장소에서 MCP·`agent/design/spec`·`agent/design/guidelines` 산출물을 다룰 때의 기준으로 쓴다.

---

## 1. 목적 및 범위

- **목적**: 디자인 파일의 토큰(변수)·텍스트·색·이펙트 스타일을 체계적으로 문서화하고, 수집 결과를 일관된 목록으로 유지한다.
- **범위**: Figma 변수, Figma 스타일(텍스트/색/이펙트), 화면별 사용처 요약, 통합 병합, 산출물 역할 분리.
- **범위 밖**: 컴포넌트 구현 상세, Figma 플러그인 제작(필요 시 별도 문서).
- **선택 확장 (`use_figma`)**: Figma MCP의 `use_figma`는 파일 컨텍스트에서 **Plugin API용 JavaScript를 실행**한다. 변수·스타일·노드 속성을 **스크립트로 대량 조회·검증**할 때 보조 수단이 될 수 있으나, 본 가이드의 **표준 수집·문서화**는 `get_variable_defs`·`get_design_context`가 우선이다. 상세는 **2.4절**.

---

## 2. 사전 준비

### 2.1 참조해야 할 로컬 문서

- `agent/design/spec/design_tokens.json` — 코드·명세와 정렬할 색·타이포·용도 설명.
- `agent/design/spec/design_principle.json` — 접근성·브랜드 원칙(대비 검토 시 참고).
- `agent/design/spec/figma-variables-and-styles.md` — **변수·스타일 목록(통합 표)**. (선택) 기존 결과가 있으면 갱신·병합 대상. 검토·권장사항 본문은 `agent/design/temp/` 문서를 본다(§8).

### 2.2 도구

- **Figma MCP** (예: Cursor의 `plugin-figma-figma`): 화면·노드 단위 수집은 `get_design_context`, `get_variable_defs`를 기본으로 사용한다.
- **`search_design_system`**: 같은 MCP의 **보조** 도구로, `fileKey`와 검색어(`query`)로 라이브러리 맥락의 변수·스타일·컴포넌트를 찾을 때 쓴다. 상세는 **3.3절**.
- MCP 도구 호출 전 **해당 서버의 tool 스키마**(descriptor JSON)를 확인하고, 필수 인자(`fileKey`, `nodeId`, `query` 등)를 맞춘다.

### 2.3 Figma URL에서 식별자 추출

- 형식: Figma 디자인 파일 URL은 경로 세그먼트에 `fileKey`, 쿼리에 `node-id`를 포함하는 패턴이 일반적이다(정확한 파싱은 공식 문서·MCP 안내를 따른다).
- **`fileKey`**: 경로의 첫 번째 ID 세그먼트.
- **`nodeId`**: `node-id` 쿼리 값의 하이픈을 콜론으로 바꾼다(MCP·Plugin API가 요구하는 형식에 맞출 것).
- 브랜치 URL이면 문서화된 규칙에 따라 `fileKey`를 `branchKey`로 쓸 수 있으니 MCP 안내를 따른다.

### 2.4 `use_figma` (선택·고급)

Figma MCP **`use_figma`**는 `fileKey`와 함께 **실행할 `code`(Plugin API)**·**`description`**을 넘겨, 파일 안에서 노드·변수·스타일·컴포넌트 등을 **생성·수정·삭제·조회**할 수 있다. (`code` 최대 길이 등은 MCP tool descriptor를 따른다.)

| 구분 | 설명 |
|------|------|
| **본 가이드와의 관계** | 변수·스타일 **목록을 마크다운으로 뽑는 기본 경로**는 여전히 `get_variable_defs` + `get_design_context`이다. `use_figma`는 예를 들어 특정 페이지 전체의 바인딩 덤프, 커스텀 리포트, **Figma 쪽 토큰 정리(쓰기)**까지 한 번에 돌릴 때 **선택적으로** 쓴다. |
| **스킬** | 도구 설명에 따라, 사용 가능하면 **`figma-use` 스킬을 호출한 뒤** `use_figma`를 호출한다. |
| **검색과의 연계** | Figma에 **컴포넌트를 새로 만들기 전**에는 `search_design_system`으로 기존 DS를 찾고, 플러그인 API에서는 **`importComponentByKeyAsync` / `importComponentSetByKeyAsync`**로 가져오는 것이 권장된다(중복 생성 방지). 분석 작업자가 파일을 **편집**할 때도 동일 원칙이 유효하다. |
| **주의 (Plugin API)** | 예: `figma.currentPage` 직접 대입은 지원되지 않을 수 있으므로 **`await figma.setCurrentPageAsync(page)`** 등 공식 API를 따른다. 폰트 패밀리별 **스타일 문자열**(예: Inter의 `Semi Bold`)은 Figma에 표시되는 이름과 **정확히 일치**시켜야 한다. 본 제품은 주로 Noto Sans KR이나, 스크립트에 다른 폰트를 쓸 때 동일하게 확인한다. |

**`generate_figma_design`과의 선택**: 웹 앱 **페이지·뷰를 Figma에 처음 캡처**할 때는 MCP 안내에 따라 `generate_figma_design`을 쓸 수 있다. **이미 캡처된 화면을 갱신**하거나 일반적인 Figma **쓰기**는 기본적으로 `use_figma`에 가깝다. HTML 캡처 실행 주체·확장 프로그램 절차는 `code_to_design_guidelines.md`를 본다.

### 2.5 컴포넌트 인벤토리와 수집 범위 (`agent/design/temp/figma-ds-component-progress.md`)

Figma ↔ 코드 연동·DS 분석 시 **어떤 컴포넌트를 대상으로 할지** 범위를 고정한다. **순차 작업 진행 상태**는 `agent/design/temp/figma-ds-component-progress.md`의 **프로그레스 체크리스트**에만 기록한다(그 파일에는 체크박스 섹션만 둔다).

#### 소스 오브 트루스 (스테이징)

| 항목 | 값 |
| --- | --- |
| 스테이징 영역 | `UI` (Figma 섹션) |
| 파일 URL | `https://www.figma.com/design/r9bdZPeswvPR1ncezzt4ri/Cook?node-id=36-333` |
| `fileKey` | `r9bdZPeswvPR1ncezzt4ri` |
| 스테이징 루트 `node-id` | `36:333` |

인벤토리는 Figma MCP `get_metadata`로 해당 노드 트리를 추출한 기준이다. **항목 하나 = 컴포넌트 하나(또는 컴포넌트 세트)**이며, Figma에서 이름·구조가 바뀌면 체크리스트를 갱신한다.

#### 인벤토리와 수집 절차의 짝 맞추기

- **연동·수집:** 체크리스트에서 항목을 고른 뒤 `get_design_context`, `get_variable_defs` 등으로 스펙을 읽고, 코드·토큰·`figma-variables-and-styles.md`를 업데이트한다.
- **프로그레스:** 위에서부터 순서대로 진행하며, 완료한 줄은 `- [ ]`를 `- [x]`로 바꾼다. 부분 완료·블로킹은 해당 줄 끝에 짧게 메모한다.
- **변수·스타일 통합 표**를 갱신할 때는 본 문서 §3~§5 절차를 따르고, **수집·병합 범위·순서**는 위 체크리스트와 정렬한다.
- 구조·의미·중복·대비 점검 및 권장 수정사항 운영은 `design_system_analysis_guidelines.md`를 따른다.

---

## 3. 1단계 — Figma에서 수집

### 3.1 호출 조합

| 도구 | 용도 |
|------|------|
| `get_variable_defs` | 노드 서브트리에 등장하는 **변수 정의**(색·숫자·문자열 등)를 평탄한 맵으로 수집. |
| `get_design_context` | **참조 코드**, 스크린샷, “These styles are contained in the design” 같은 **스타일 요약**, 컴포넌트 설명을 얻는다. |
| `search_design_system` | (선택) **텍스트 검색**으로 디자인 시스템 자산(변수·스타일·컴포넌트)을 찾는다. **특정 노드 사용처를 대체하지 않음** — 3.3절 참고. |

같은 `fileKey`·`nodeId`에 대해 `get_variable_defs`와 `get_design_context`를 병행하는 것을 권장한다. `search_design_system`은 `nodeId` 없이 `fileKey`만으로 호출 가능하며, **탐색·교차 확인** 단계에 쓴다.

#### `get_metadata`(XML)로 샘플 노드·variant 범위 잡기 (선택)

`get_metadata`가 XML 형태로 계층을 줄 때, **`get_design_context` / `get_variable_defs`에 넘길 `nodeId`를 고르기 전**에 아래처럼 읽으면 수집 범위를 정하기 쉽다.

- 직계 자식이 **`<frame name="…">` 이고 그 안에 `<symbol>`이 여러 개**이면, Figma에서는 보통 **컴포넌트 세트(variant 묶음)** 로 본다. 스타일·변수가 variant마다 다를 수 있으므로 **대표 variant 하나만** 볼지, **variant별로 추가 호출**할지 결정한다.
- 직계 자식이 **단일 `<symbol>`**이면 보통 **단일 컴포넌트**(또는 한 베리언트만 드러난 심볼)다.

레이아웃·클래스·“These styles are contained…” 목록은 이후 **`get_design_context`**로 이어간다. (동일 휴리스틱은 `design_to_code_guidelines.md`의 `get_metadata`·컴포넌트 세트 읽기 절차와 맞춘다.)

#### `get_design_context`의 Component descriptions

응답에 **Component descriptions**(포커스 링, transition 등)가 붙어 있으면, 토큰·스타일 표 **본문과 별도**로 짧게 적어 둔다(각주·“참고” 소절 등). 변수 맵에는 없을 수 있으나 **접근성·인터랙션 검토**에 쓰인다.

### 3.2 수집 원칙

- **텍스트, 색, 그림자, 보더, 반지름, 패딩 등** 종류를 가리지 않고, 변수 맵과 디자인 컨텍스트에 나온 바인딩·스타일을 모두 후보로 둔다.
- 생성 코드에만 있고 변수 맵에 없는 값(예: raw `box-shadow`, 숫자 리터럴 `gap`)은 **별도 행 또는 “권장 수정사항”**에 적어 둔다.
- 참고 코드에 **`gap-[12px]`·`gap-[16px]`** 처럼 **숫자만 있고 `var(--spacing/…)`**(또는 MCP가 보내는 동등한 **간격 변수 참조**)가 없으면, 오토레이아웃 **`itemSpacing` 등이 간격 토큰에 묶이지 않은 상태**로 본다. §7에 **간격 변수 미바인딩 의심**으로 기록한다. (`design_to_code_guidelines.md`의 토큰·스페이싱 원칙과 동일한 판별 기준으로 본다.)
- 아이콘·이미지 URL은 토큰 표에서 제외하고, 참고에 “자산은 별도”라고 명시한다.

### 3.3 `search_design_system` 활용 (보조)

**역할**: 연결된 디자인 라이브러리·파일 맥락에서 **검색어와 일치하는** 컴포넌트, 변수, 스타일을 반환한다. **키워드 탐색·누락 점검·이름 후보 수집**에 쓰고, **특정 프레임에 “무엇이 바인딩됐는지” 전수 목록**을 만드는 용도로는 **`get_variable_defs` + `get_design_context`를 대체할 수 없다.**

#### 인자 (스키마 기준)

| 인자 | 필수 | 설명 |
|------|------|------|
| `query` | 예 | 검색 문자열(영문 토큰명, `color`, `spacing`, `elevation` 등). |
| `fileKey` | 예 | 분석 중인 파일 키(Figma URL 경로에서 추출). |
| `includeComponents` | 아니오 (기본 `true`) | 컴포넌트 결과 포함 여부. |
| `includeVariables` | 아니오 (기본 `true`) | 변수 결과 포함 여부. |
| `includeStyles` | 아니오 (기본 `true`) | 스타일 결과 포함 여부. |
| `includeLibraryKeys` | 아니오 | 특정 라이브러리만 제한할 때 키 배열. 이전 검색 응답에서 키를 얻을 수 있다. |
| `disableCodeConnect` | 아니오 | Code Connect 비활성화 여부. |

호출 전 MCP 서버의 tool descriptor를 확인해 스키마 변경에 대응한다.

#### 권장 사용 시점

- 노드 수집 전·후에 **같은 주제의 토큰이 더 있는지** 훑을 때(예: `query`: `toggle`, `elevation`, `typography`).
- `get_variable_defs` 결과에 없는데 명명 규칙상 존재할 법한 **변수·스타일 이름을 역추적**할 때.
- 통합 표 작성 시 **컴포넌트와 연결된 DS 항목**을 빠르게 찾을 때(`includeComponents`: `true` 유지).
- **사용처 열**을 채우는 근거는 여전히 `get_design_context`의 레이어·컴포넌트 구조가 우선이다. 검색 결과만으로는 “이 화면에서 쓰였다”를 단정하지 않는다.

#### 한계·주의

- **전수 목록**: 검색어에 걸리지 않는 토큰은 결과에 안 나온다. 라이브러리 전체를 표로 옮기려면 **여러 `query`를 조합**해도 완전성은 보장되지 않는다.
- **`nodeId` 미지원**: 특정 화면에만 쓰인 변수 집합과 **자동으로 일치하지 않는다**.
- 검색 결과와 노드 수집 결과를 **병합**할 때는 중복 행·이름만 같고 값이 다른 항목을 수동으로 맞춘다.

#### `get_variable_defs` / `get_design_context`와의 관계

| 목적 | 권장 도구 |
|------|-----------|
| 한 화면·컴포넌트에 바인딩된 변수·스타일 + 사용처 추적 | `get_variable_defs`, `get_design_context` |
| 키워드로 DS 자산 찾기, 누락 의심 토큰 발견 | `search_design_system` |
| `design_tokens.json`과 Figma 명명 정합성 점검 | 노드 수집 표 + 필요 시 검색으로 교차 확인 |
| 대량·커스텀 조회, Figma 파일 내 토큰·레이아웃 **직접 수정** | (선택) `use_figma` + `figma-use` 스킬 — 2.4절 |

---

## 4. 2단계 — 마크다운 표기 규칙

### 4.1 표 열 정의 (권장)

| 열 | 설명 |
|----|------|
| **구분** | `변수` 또는 `스타일`만 사용. |
| **이름** | 변수: Figma 변수 경로(예: `color/primary`). 스타일: Figma 스타일 이름(예: `H1`, `Elevation/Medium`). 바인딩 없는 레이어 효과만 있으면 `—`. |
| **값** | 변수: 실제 수치·색(hex, px 등). 스타일: 연결된 변수 이름; 타이포는 패밀리·굵기·행간 등 **스타일 정의상 고정 속성**을 같은 셀에 병기해도 된다. |
| **사용처** | `data-name`·컴포넌트명·역할(탭, 칩, 카드 등)을 **페이지 이름 없이** 통합 서술해도 되고, 단일 화면 문서면 해당 화면 위주로 적는다. |

### 4.2 변수 vs 스타일 분류 힌트

- MCP `get_variable_defs`에는 **소문자·슬래시 경로**(`color/…`, `spacing/…`)와 **시맨틱 스타일명**(`Text/Primary`, `H1`)이 함께 올 수 있다. 표에서는 위 열 규칙에 맞게 나눈다.
- 동일 hex가 변수 경로와 스타일 이름 이중으로 잡히면, 통합 문서에서는 **한 변수 행 + 스타일 행**으로 유지하고 SSOT 검토 단계에서 정리 여부를 논의한다.

### 4.3 문서 머리말에 넣을 메타

- Figma 파일 링크, `fileKey`, 수집 시점(날짜), 사용한 MCP 도구 이름.
- “MCP 응답 기준이며, 이후 Figma 수정 시 재수집 필요” 등 한 줄 주의.
- 통합 문서·옛 초안·에이전트 산출물의 **컴포넌트 호칭**과 **Figma 파일의 실제 심볼·컴포넌트 세트 이름**이 다를 수 있다. **이름의 SSOT는 항상 Figma**이며, 병합·**사용처** 열 서술 시 옛 이름과 최종명이 **중복 행**으로 갈라지지 않도록 맞춘다(예: 문서상 `Tag` vs 파일 `FlatTag`).

---

## 5. 통합 병합 (여러 화면·노드)

- **페이지를 구분할 필요가 없을 때**: 여러 노드에서 만든 표를 **이름(변수 경로·스타일명) 기준으로 병합**한다.
- **값이 동일한 동일 토큰**: 행을 하나로 합치고, **사용처** 열만 세미콜론·쉼표로 합친다.
- **한쪽에만 있는 토큰**: 그대로 통합 표에 포함한다.
- **의미가 다른 동일 `font-size` 토큰**(예: H3 볼드 vs Card/Heading 미디엄): 숫자는 같아도 **스타일 행은 둘 다 유지**하고, 검토 단계에서 네이밍·역할을 논의한다.

---

## 6. 분석 단계 분리

수집 결과를 기반으로 한 **품질 검토(구조·의미·중복·대비)**와 **권장 수정사항 운영**은 `agent/design/guidelines/design_system_analysis_guidelines.md`로 분리한다.

---

## 7. 산출물·파일 네이밍

- **화면별 스냅샷**(선택): `figma-{기능}-{날짜}-variables-and-styles.md` 등 파일 이름 규칙을 팀에서 정한다.
- **저장소 통합본(목록)**: `agent/design/spec/figma-variables-and-styles.md`는 **변수·스타일 통합 표(목록)**만 두고, **권장 수정사항·토큰·스타일 검토·참고 노트** 등 피드백 성격의 본문은 `agent/design/temp/`에 별도 파일로 둔다(§8).
- **수집 절차 본 문서**: `agent/design/guidelines/design_system_collection_guidelines.md` — 절차·역할 분리 규칙이 바뀌면 여기를 갱신한다.

---

## 8. 변수·스타일 명세와 피드백 문서 분리

### 8.1 역할 나누기

| 산출물 | 경로(예) | 내용 |
|--------|----------|------|
| **통합 표(목록)** | `agent/design/spec/figma-variables-and-styles.md` | 메타(소스·수집 시점·주의) + **변수·스타일 표**만. 표 열·머리말 규칙은 §4. |
| **컴포넌트 프로그레스** | `agent/design/temp/figma-ds-component-progress.md` | 스테이징 UI 컴포넌트 **순차 작업 체크리스트**(§2.5). |
| **피드백·검토** | `agent/design/temp/*.md` | 권장 수정사항, 토큰·스타일 검토(이슈 표), Component descriptions 요약, 수집 노트 등 **목록이 아닌 해석·권고** |

`temp`는 **에이전트·작업자가 남기는 검토·후속 액션**을 spec 폴더의 깔끔한 목록과 분리하기 위한 위치다. Git에 포함할지·로컬만 둘지는 팀 정책으로 정한다.

### 8.2 갱신 시

- 표의 **행 추가·삭제·값 변경**은 `figma-variables-and-styles.md`에서 처리한다.
- **권장 수정사항** 항목을 쓰거나 해소할 때는 `design_system_analysis_guidelines.md` 절차에 따라 `temp`의 해당 문서를 함께 갱신한다.
- 검토 표(구조·의미·대비 등)를 확장할 때는 **spec이 아니라 `temp`**에 반영한다(체크리스트 기준은 분석 가이드를 따른다).

### 8.3 `temp` 파일 이름

- **변수·스타일 검토·권장사항**: `figma-variables-and-styles-feedback.md` — Cook 통합 표에 대한 검토를 한곳에 둘 때.
- **컴포넌트 순차 작업**: `figma-ds-component-progress.md` — §2.5와 짝(고정 파일명으로 두는 것을 권장).
- 주제별로 쪼갤 경우 `temp/figma-tokens-review-YYYY-MM.md` 등 팀 규칙에 맞게 이름을 정한다.

---

## 9. 요약 플로우

1. URL에서 `fileKey`·`nodeId` 추출 → (선택) `get_metadata`로 컴포넌트 세트·variant 범위 확인(3.1절) → MCP `get_variable_defs` + `get_design_context` 호출(Component descriptions는 3.1절 참고).  
2. (선택) 같은 `fileKey`로 `search_design_system`에 `query`를 여러 번 걸어 **DS 전반·누락 의심 항목**을 교차 확인한다 — **화면 사용처의 근거로만 쓰지 않는다**(3.3절).  
3. 표(구분·이름·값·사용처)로 정리하고, raw 값·누락을 메모한다.  
4. 여러 노드면 **이름 기준 병합**·사용처 합침.  
5. 분석이 필요하면 `design_system_analysis_guidelines.md`로 넘어가 체크리스트·권장 수정사항 절차를 수행한다.  
6. 갱신 작업에서 **실질 변경점(신규/수정/삭제 토큰·스타일, 사용처 변경)**이 없으면 해당 회차 업데이트는 생략할 수 있다.
