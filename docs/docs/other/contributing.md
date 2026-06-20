# 기여 가이드

## 이 문서로 해결할 질문

- PR 전에 무엇을 실행해야 하나요?
- 이벤트·KPI를 추가할 때 어떤 절차를 따르나요?

## 개발 워크플로

```text
1. 내부 명세·OpenAPI에서 계약·아키텍처 변경 범위 확인
2. 구현 (백엔드는 TDD 권장)
3. 내부 명세·OpenAPI·Docusaurus 해당 페이지 갱신
4. pnpm run ci
5. PR
```

코드 변경과 문서 갱신은 **같은 커밋**에 포함합니다.

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
| 백엔드 | [개발 규약](./development-conventions) · [Producer 아키텍처](../producer/architecture) |
| 프론트 | [클라이언트 아키텍처](../client/architecture) |
| 컴포넌트 | [컴포넌트 구조](../client/components) |
| 디자인 | [디자인 시스템](./design-system) |

## 이벤트·KPI 추가 시

1. [Observability](./observability)에 이벤트·KPI를 등록합니다.
2. shared event enum 또는 `client/src/.../analytics-events.ts`에 계측을 추가합니다.
3. GA 연동 시 내부 프론트 이벤트 계측 체크리스트를 갱신합니다.
4. PR 리뷰에서 등록 여부와 계측 구현을 확인합니다.

상세 파이프라인은 [이벤트/분석 파이프라인](../consumer/analytics-pipeline) 문서를 참고합니다.

## 문서 기여

- Docusaurus 문서는 `docs/docs/`에 두며, `docs/sidebars.ts` 목차와 본 사이트 구조를 따릅니다.
- 페이지는 「이 문서로 해결할 질문」과 「관련 문서」를 포함하고, 필요 시 코드·계약 링크를 본문에 연결합니다.

## 관련 문서

- [개발 규약](./development-conventions)
- [모노레포 구조](../project/monorepo)
- [Observability](./observability)
