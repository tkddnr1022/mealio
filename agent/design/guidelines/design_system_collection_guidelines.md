# 디자인 시스템 수집 가이드라인

이 문서는 디자인 시스템 워크플로우의 1단계인  
**Figma -> `agent/design/spec/figma-variables-and-styles.md`** 수집 절차를 정의한다.

---

## 1. 목적

- Figma의 Variable/Style을 MCP로 읽어 표 형태 목록으로 정리한다.
- 산출물은 사람이 검토 가능한 단일 목록 문서로 유지한다.

---

## 2. 입력과 출력

- 입력
  - Figma 파일(또는 스테이징 섹션) URL
  - 수집 대상 노드(`fileKey`, `nodeId`)
- 출력
  - `agent/design/spec/figma-variables-and-styles.md` (변수/스타일 목록)
  - `agent/design/temp/figma-ds-component-progress.md` (선택: 진행 체크)

---

## 3. 범위

- 포함
  - Variable 값 수집(색상/수치/문자열 등)
  - Style 이름 및 연결된 변수 정보 수집
  - 사용처 메모(컴포넌트/레이어 기준)
- 제외
  - JSON 변환 규칙(`design_tokens.json`) 작성
  - 코드(`globals.css`) 반영

---

## 4. 수집 절차

## 4.1 대상 고정

- Figma URL에서 `fileKey`와 `nodeId`를 추출한다.
- 대량 수집 시 `agent/design/temp/figma-ds-component-progress.md` 체크리스트로 순서를 고정한다.

## 4.2 MCP 호출

- 기본 호출
  - `get_variable_defs`: 변수 정의 수집
  - `get_design_context`: 스타일 목록/구조 보조 정보 수집
- 선택 호출
  - `search_design_system`: 누락 의심 항목 검색
  - `get_metadata`: 범위/계층 확인

원칙:

- 표의 1차 근거는 `get_variable_defs` 결과다.
- `search_design_system` 결과는 보조 근거로만 사용한다.

## 4.3 목록 작성

`figma-variables-and-styles.md`에 아래 형식으로 정리한다.

- 변수 표: `구분 | 이름 | 값 | 사용처`
- 스타일 표: `구분 | 이름 | 값 | 사용처`

작성 규칙:

- 구분은 `변수` 또는 `스타일`만 사용한다.
- 이름은 Figma 원문 이름을 유지한다.
- 값은 가능한 원자값(HEX, number, 문자열)으로 기록한다.
- 사용처는 화면명이 아니라 컴포넌트/역할 중심으로 간결히 기록한다.

## 4.4 병합

여러 노드를 수집했으면 이름 기준으로 병합한다.

- 동일 이름 + 동일 값: 행 병합, 사용처만 합침
- 동일 이름 + 상이 값: 행 분리 후 비고 추가

---

## 5. 검증 체크리스트

- 변수/스타일이 문서에 누락 없이 반영됐는가
- 값 표기가 일관적인가(HEX 대소문자, number 단위 제거 등)
- 동일 토큰 중복 행이 불필요하게 남아있지 않은가
- 문서 상단 메타(소스 URL, 수집 시점)가 최신인가

---

## 6. 다음 단계

수집이 끝나면 2단계 문서인  
`agent/design/guidelines/design_tokens_conversion_guidelines.md`에 따라  
`figma-variables-and-styles.md`를 `design_tokens.json`에 반영한다.
