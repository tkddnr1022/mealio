# 개발 규약

## 이 문서로 해결할 질문

- Mealio에서 코드·문서를 맞추는 공통 규칙은 무엇인가요?
- 백엔드·프론트엔드 각각 어떤 지침을 따르나요?

## 문서·코드 정합성 (핵심)

[기여 가이드](./contributing)에서 문서·코드 정합성 원칙을 확인합니다.

| 원칙 | 설명 |
| --- | --- |
| 아키텍처 문서 기반 | 아키텍처 문서에 없는 파일·경로 생성 금지 |
| 생략 금지 | 문서에 정의된 항목 누락 금지 |
| 이름 일치 | 문서와 다른 파일명·경로 사용 금지 |
| 동기화 | 예외 작업 후 **반드시 문서 갱신** |

| 영역 | 아키텍처 문서 |
| --- | --- |
| 백엔드 | `server/producer/src/`, `server/consumer/src/`, `server/shared/src/` |
| 프론트 | [클라이언트 아키텍처](../client/architecture) · `client/src/app/` |
| 컴포넌트 | [컴포넌트 구조](../client/components) · `client/src/components/` |

## 백엔드

| 항목 | 지침 |
| --- | --- |
| 렌더링 | SSG/ISR/SSR/CSR — [클라이언트 아키텍처](../client/architecture) |
| 캐시 | `cache.policy.ts` 기준 |
| 상태 | React Query + Optimistic Update |
| 접근성 | `buildAriaLabel` 단일 진입점 |
| OAuth | 백엔드 주도, 프론트는 진입·세션만 |

상세 구조는 `server/producer/src/`, `server/consumer/src/` 문서를 참고합니다.

## 프론트엔드

| 항목 | 지침 |
| --- | --- |
| 렌더링 | SSG/ISR/SSR/CSR — [클라이언트 아키텍처](../client/architecture) |
| 캐시 | `cache.policy.ts` 기준 |
| 상태 | React Query + Optimistic Update |
| 접근성 | `buildAriaLabel` 단일 진입점 |
| OAuth | 백엔드 주도, 프론트는 진입·세션만 |

상세 내용은 [클라이언트 아키텍처](../client/architecture) 문서를 참고합니다.

## API·이벤트 계약

- REST API는 [Producer API](../producer/api)와 `server/producer/.../modules/` 구조를 따릅니다.
- BFF Route Handler는 [BFF Route Handler](../client/api-bff)와 `client/src/.../api/` 경로를 따릅니다.
- 이벤트는 [Observability](./observability)에 **사전 등록한 뒤** 코드에 반영합니다.

## Git·PR

- PR 전에 `pnpm run ci`가 통과해야 합니다.
- API 계약, 내부 문서, Docusaurus 페이지는 같은 작업 단위에서 함께 갱신합니다.
- 상세 절차는 [기여 가이드](./contributing)를 참고합니다.

## 문서 동기화

구현을 변경할 때는 아래 항목을 함께 확인·갱신합니다.

1. 아키텍처·API 계약 문서를 확인합니다.
2. `server/producer` Swagger DTO와 Client Route Handler를 맞춥니다.
3. `docs/docs/` Docusaurus 페이지를 갱신합니다.
4. (해당 시) `client/src/.../globals.css`를 동기화합니다.

## 관련 문서

- [기여 가이드](./contributing)
- [모노레포 구조](../project/monorepo)
