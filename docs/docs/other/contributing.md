---
title: 기여 가이드
---

# 기여 가이드

## 이 문서로 해결할 질문

- 코드·문서를 어떤 순서로 맞춰야 하는가?
- PR 전에 무엇을 실행해야 하는가?

## 문서·코드 정합성

**아키텍처 문서에 없는 파일·경로를 임의로 추가·생략·이름 변경하지 않습니다.**

| 영역 | 아키텍처 문서 |
| --- | --- |
| 백엔드 | server/producer/src/, server/consumer/src/, server/shared/src/ |
| 프론트 | [클라이언트 아키텍처](../client/architecture) · client/src/app/ |
| 컴포넌트 | [컴포넌트 구조](../client/components) · client/src/components/ |

예외 작업 후 **반드시 문서 동기화**.

→ [기여 가이드](../other/contributing), [개발 규약](../other/development-conventions)

## 개발 워크플로

```text
1. API 계약·아키텍처 문서 확인
2. 구현 (TDD 권장 — 백엔드)
3. API 계약·문서·Docusaurus 갱신
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
| 백엔드 | [개발 규약](../other/development-conventions) |
| 프론트 | [클라이언트 아키텍처](../client/architecture) |
| 컴포넌트 | [컴포넌트 구조](../client/components) |
| 디자인 | [디자인 시스템](../other/design-system) |

## 이벤트·KPI 추가 시

1. [Observability](../other/observability) 등록
2. 코드 계측
3. `frontend_event_instrumentation.md` 갱신 (GA 연동 시)
4. PR 리뷰에서 미등록 이벤트 차단

## 문서 기여

- Docusaurus: `docs/docs/` — `docs/sidebars.ts` 목차와 본 사이트 구조를 따름
- 스텁 페이지 본문 작성 시 코드·계약 링크·관련 문서 교차 링크 포함

## 관련 문서

- [개발 규약](./development-conventions)
- [모노레포 구조](../project/monorepo)
- [데이터/계약 인덱스](../project/contracts-index)

## 참고 코드·계약

- [개발 규약](./development-conventions)
- [데이터/계약 인덱스](../project/contracts-index)
