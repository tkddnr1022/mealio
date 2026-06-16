---
title: 기여 가이드
---

# 기여 가이드

## 이 문서로 해결할 질문

- 코드·명서·문서를 어떤 순서로 맞춰야 하는가?
- PR 전에 무엇을 실행해야 하는가?

## 스펙 주도 개발

**명세에 없는 파일·경로를 임의로 추가·생략·이름 변경하지 않습니다.**

| 영역 | 명세 |
| --- | --- |
| 백엔드 | `agent/backend/spec/backend_architecture_spec*.md` |
| 프론트 | `agent/frontend/spec/frontend_architecture_spec.md` |
| 컴포넌트 | `agent/frontend/spec/frontend_components_structure_spec.md` |

예외 작업 후 **반드시 명세 동기화**.

→ `agent/common/spec_driven_development_guidelines.md`

## 개발 워크플로

```text
1. agent 명세·OpenAPI 확인
2. 구현 (TDD 권장 — 백엔드)
3. 명세·OpenAPI·Docusaurus 갱신
4. pnpm run ci
5. PR
```

## 로컬 검증

```bash
pnpm install
# 인프라 Compose 기동 (README 참고)
pnpm run start:producer
pnpm run start:consumer
pnpm run start:client
pnpm run ci          # docs 빌드(ci:build:docs) 포함
pnpm run ci:build:docs   # 문서만 검증할 때
```

## 패키지별 가이드

| 패키지 | 지침 |
| --- | --- |
| 백엔드 | `agent/backend/guidelines/backend_development_guidelines.md` |
| 프론트 | `agent/frontend/guidelines/frontend_development_guidelines.md` |
| 컴포넌트 | `agent/frontend/guidelines/frontend_component_conventions_guidelines.md` |
| 디자인 | `agent/design/guidelines/design_to_code_guidelines.md` |

## 이벤트·KPI 추가 시

1. `agent/observability/event_dictionary.md` 등록
2. 코드 계측
3. `frontend_event_instrumentation.md` 갱신 (GA 연동 시)
4. PR 리뷰에서 미등록 이벤트 차단

## 문서 기여

- Docusaurus: `docs/docs/` — 계획서 `agent/docusaurus_documentation_plan.md` 따름
- 스텁 페이지 본문 작성 시 SSOT 링크·관련 문서 교차 링크 포함

## 관련 문서

- [개발 규약](./development-conventions)
- [모노레포 구조](../project/monorepo)
- [데이터/계약 인덱스](../project/contracts-index)

## SSOT

- `agent/common/spec_driven_development_guidelines.md`
