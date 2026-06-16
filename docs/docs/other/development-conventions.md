---
title: 개발 규약
---

# 개발 규약

## 이 문서로 해결할 질문

- Mealio에서 코드·명세·문서를 맞추는 공통 규칙은?
- 백엔드·프론트엔드 각각 어떤 지침을 따르는가?

## 스펙 주도 개발 (핵심)

`agent/common/spec_driven_development_guidelines.md`

| 원칙 | 설명 |
| --- | --- |
| 명세 기반 | 명세에 없는 파일·경로 생성 금지 |
| 생략 금지 | 명세에 있는 항목 누락 금지 |
| 이름 일치 | 명세와 다른 파일명·경로 사용 금지 |
| 동기화 | 예외 작업 후 **반드시 명세 갱신** |

| 영역 | 명세 |
| --- | --- |
| 백엔드 | `agent/backend/spec/backend_architecture_spec*.md` |
| 프론트 | `agent/frontend/spec/frontend_architecture_spec.md` |
| 컴포넌트 | `frontend_components_structure_spec.md` |

## 백엔드

| 항목 | 지침 |
| --- | --- |
| 구조 | Producer / Consumer / Shared 분리 |
| 테스트 | TDD 권장, consumer spec 필수 |
| 이벤트 | Handler가 Kafka 직접 발행 금지 (무효화는 RequestService) |
| 환경 변수 | `env.validation.ts` Joi 검증 |

문서: `agent/backend/guidelines/backend_development_guidelines.md`

## 프론트엔드

| 항목 | 지침 |
| --- | --- |
| 렌더링 | SSG/ISR/SSR/CSR — 명세 §1 |
| 캐시 | `cache.policy.ts` SSOT |
| 상태 | React Query + Optimistic Update |
| 접근성 | `buildAriaLabel` 단일 진입점 |
| OAuth | 백엔드 주도, 프론트는 진입·세션만 |

문서: `agent/frontend/guidelines/frontend_development_guidelines.md`

## API·이벤트 계약

- REST: `agent/common/openapi_spec_backend.yaml`
- BFF: `openapi_spec_frontend.yaml`
- 이벤트: `agent/observability/event_dictionary.md` — **신규 이벤트는 사전 등록 후 코드**

## Git·PR

- `pnpm run ci` 통과 후 PR
- 명세·OpenAPI·Docusaurus 동시 갱신
- 상세: [기여 가이드](./contributing)

## 문서 동기화

구현 변경 시 동기화 대상:

1. `agent/` 명세·가이드
2. OpenAPI YAML
3. `docs/docs/` Docusaurus 페이지
4. (해당 시) `design_tokens.json` / `globals.css`

## 관련 문서

- [기여 가이드](./contributing)
- [데이터/계약 인덱스](../project/contracts-index)
- [모노레포 구조](../project/monorepo)

## SSOT

- `agent/common/spec_driven_development_guidelines.md`
