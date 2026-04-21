# 디자인 토큰 변환 가이드라인

이 문서는 디자인 시스템 워크플로우의 2단계인  
**`agent/design/spec/figma-variables-and-styles.md` -> `agent/design/spec/design_tokens.json`**  
반영 절차를 정의한다.

---

## 1. 목적

- 변수/스타일 목록 문서를 에이전트 친화적인 구조화 JSON으로 반영한다.
- 기존 `design_tokens.json`의 시스템 규칙을 보존한 채, 변수/스타일 영역만 최신화한다.

---

## 2. 입력과 출력

- 입력
  - `agent/design/spec/figma-variables-and-styles.md`
  - 기존 `agent/design/spec/design_tokens.json`
- 출력
  - 업데이트된 `agent/design/spec/design_tokens.json`

---

## 3. 핵심 원칙 (중요)

- `design_tokens.json`은 Variable/Style 외에 시스템 규칙을 포함한다.
- 변환 작업은 **덮어쓰기 생성이 아니라 선택적 병합 업데이트**다.
- 아래 영역은 원칙적으로 보존한다.
  - `component`
  - `system`
  - 기타 변수/스타일 외 운영 메타
- 변경 대상은 기본적으로 아래로 한정한다.
  - `variables`
  - `styles`
  - `version`, `lastReviewed` 등 최소 메타

---

## 4. 반영 절차

## 4.1 사전 비교

- `figma-variables-and-styles.md`의 변수/스타일 표 변경분을 추출한다.
- 기존 `design_tokens.json`에서 동일 토큰 경로를 찾는다.

## 4.2 변수 반영 (`variables`)

- 변수 이름(예: `color/background/primary`)을 현재 JSON 트리에 맞게 매핑한다.
- 값 변경 시 기존 타입을 유지한다.
  - 색상: HEX 문자열
  - 수치: number
  - 문자열: string
- alias 관계가 있으면 함께 갱신한다.
  - `variables.figmaVariableAliases`
  - `variables.tokenAliasMap`
  - 리프의 `aliasOf`

## 4.3 스타일 반영 (`styles`)

- 스타일 이름은 `figma` 원문을 유지한다.
- 스타일 타입에 맞는 필드만 갱신한다.
  - 컬러: `variable-token`/`color-token`
  - 타이포: `font-size-token`, `line-height`, `font-weight-token`
  - 보더/그림자: 기존 스키마 필드 유지

## 4.4 보존 검증

- `component`, `system`에 의도치 않은 변경이 없는지 확인한다.
- 변수/스타일 경로 변경으로 참조가 깨지지 않았는지 확인한다.

---

## 5. 업데이트 체크리스트

- 변수 표 변경분이 `variables`에 반영됐는가
- 스타일 표 변경분이 `styles`에 반영됐는가
- alias 3종(`figmaVariableAliases`/`tokenAliasMap`/`aliasOf`)이 일관적인가
- `component`, `system`이 보존됐는가
- `lastReviewed`가 갱신됐는가

---

## 6. 다음 단계

변환이 끝나면 3단계 문서인  
`agent/design/guidelines/design_system_integration_guidelines.md`에 따라  
`design_tokens.json`의 변수/스타일을 코드(`globals.css`)로 반영한다.
