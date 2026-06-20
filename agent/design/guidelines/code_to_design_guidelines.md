# Code to Design 가이드 (Figma MCP)

코드·웹 UI를 Figma로 옮기거나, Figma MCP로 디자인을 다룰 때 **어떤 MCP를 쓰는지**, **`generate_figma_design`(HTML 캡처)과 `use_figma`(Plugin API 쓰기·동기화) 구분**, **HTML → Figma 캡처 파이프에서 에이전트와 사용자의 역할**, **호출 제한 시 재시도**를 정리한다.

**Figma에서 코드로 구현하는 절차**는 `design_to_code_guidelines.md`를 본다.

---

## 1. MCP 선택 기준

- **코드·스펙을 Figma에 반영하는 경로**는 대략 둘로 나뉜다.
  - **웹 페이지·뷰를 Figma에 처음 옮김**: 아래 **§2**의 **`generate_figma_design`** + 사용자 캡처.
  - **이미 파일에 있는 프레임·컴포넌트를 고치거나**, 변수·스타일·오토레이아웃을 **Plugin API로 동기화**: 아래 **§3**의 **`use_figma`**.

---

## 2. HTML → Figma 캡처 (`generate_figma_design`)

에이전트가 **웹 페이지·뷰를 Figma에 반영**하기 위해 캡처 파이프를 쓸 때는 **`generate_figma_design`** 을 사용한다.

### 2.1 에이전트 역할

- 에이전트는 캡처 준비 단계에서 **`captureId` 생성과 전달**을 담당한다.
- 캡처 실행·완료 확인은 사용자 실행 단계와 연결해 운영한다.

### 2.2 캡처 실행 (사용자 책임)

캡처는 사용자가 **`figma-capture-activator`** 확장 프로그램으로 **반드시 직접** 실행한다.

1. 캡처할 HTML/페이지를 브라우저에서 **미리 연다.**
2. `figma-capture-activator` 팝업에 **`captureId`** 를 입력한다.
3. 필요하면 **`endpoint`** 및 **`selector`** 를 설정한다.
4. **현재 탭 캡처 활성화**를 클릭한다.

이후 단계(완료 확인, 반영 완료 대기, 폴링)는 사용자 실행 단계에서 진행한다.

---

## 3. Figma 파일에서 직접 생성·수정 (`use_figma`)

**`use_figma`**는 지정한 **`fileKey`** 아래에서 **Plugin API용 JavaScript(`code`)**를 실행한다. 필수 인자는 MCP tool descriptor 기준으로 **`fileKey`**, **`code`**, **`description`**(무엇을 할지 한 줄 설명)이다.

### 3.1 언제 쓰는가 (Code → Design 관점)

| 상황 | 권장 도구 |
|------|-----------|
| 브라우저에 띄운 **페이지를 Figma로 처음 가져오기** | **§2** `generate_figma_design` + 사용자 `figma-capture-activator` |
| 캡처 **이후** 레이아웃·간격·토큰 바인딩을 파일 안에서 맞추기 | **`use_figma`** |
| 코드베이스·`design_tokens.json`과 **변수·스타일·컴포넌트 세트**를 맞추기 | **`use_figma`** (필요 시 `get_design_context` / `get_variable_defs`로 읽고, 수정은 스크립트) |
| 노드 속성을 **프로그램 방식으로 조회**만 하기 | 읽기 전용이면 `get_metadata` 등이 우선이나, **커스텀 덤프**는 `use_figma`로도 가능 |

MCP 설명상 **Figma 쪽 일반적인 쓰기**와 **이미 캡처된 뷰 갱신**은 기본적으로 **`use_figma`**에 가깝고, **최초 HTML 캡처**만 `generate_figma_design` 예외로 두는 것이 맞다. 애매하면 **`use_figma`**를 택한다.

### 3.2 호출 전·공통 권장

- 사용 가능하면 **`figma-use` 스킬**을 로드한 뒤 `use_figma`를 호출한다.
- Figma에 **컴포넌트를 새로 만들기 전**에는 **`search_design_system`**으로 기존 DS를 찾고, Plugin API에서는 **`importComponentByKeyAsync` / `importComponentSetByKeyAsync`**로 가져와 **중복 생성을 피한다**.

### 3.3 Plugin API 주의 (요약)

- **`figma.currentPage`에 직접 대입**하는 패턴은 지원되지 않을 수 있다. **`await figma.setCurrentPageAsync(page)`** 등 공식 API를 따른다.
- 폰트 **스타일 문자열**은 Figma에 표시되는 이름과 **정확히 일치**해야 한다(예: Inter는 `Semi Bold`처럼 공백 포함). 본 제품은 Noto Sans KR 위주이나, 스크립트에 다른 패밀리를 쓸 때 동일하게 확인한다.

### 3.4 다른 문서와의 역할 나눔

- **`design_to_code_guidelines.md`**: Figma → 코드 시 **토큰·전역 타이포·variant 매핑**과 읽기용 **`get_metadata` / `get_design_context`** 활용. **`use_figma`·캡처·도구 선택**은 본 문서가 단일 근거다.
- **`design_system_collection_guidelines.md` §2.4**: 동일 MCP를 **DS 문서화·수집** 관점에서 “표준 수집은 `get_*` 우선”과 함께 정리한다.

---

## 4. 도구 호출 제한 (tool call limit)

**tool call limit 초과** 응답이 오면 **1분(60초) 대기**한 뒤 **동일 호출을 재시도**한다.

필요하면 사용자에게 *「Figma API 호출 제한으로 1분 후 재시도합니다」* 를 안내한다.
