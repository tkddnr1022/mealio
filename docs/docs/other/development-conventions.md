# 개발 규약

## 이 문서로 해결할 질문

- Mealio에서 코드·문서를 맞추는 공통 규칙은 무엇인가요?
- 백엔드·프론트엔드 각각 어떤 지침을 따르나요?

## 문서·코드 정합성 (핵심)

[기여 가이드](../other/contributing)

| 원칙 | 설명 |
| --- | --- |
| 아키텍처 문서 기반 | 아키텍처 문서에 없는 파일·경로 생성 금지 |
| 생략 금지 | 문서에 정의된 항목 누락 금지 |
| 이름 일치 | 문서와 다른 파일명·경로 사용 금지 |
| 동기화 | 예외 작업 후 **반드시 문서 갱신** |

| 영역 | 아키텍처 문서 |
| --- | --- |
| 백엔드 | server/producer/src/, server/consumer/src/, server/shared/src/ |
| 프론트 | [클라이언트 아키텍처](../client/architecture) · client/src/app/ |
| 컴포넌트 | [컴포넌트 구조](../client/components) · client/src/components/ |

## 백엔드

| 항목 | 지침 |
| --- | --- |
| 구조 | Producer / Consumer / Shared 분리 |
| 테스트 | TDD 권장, consumer spec 필수 |
| 이벤트 | Handler가 Kafka 직접 발행 금지 (무효화는 RequestService) |
| 환경 변수 | `env.validation.ts` Joi 검증 |

문서: server/producer/src/, server/consumer/src/

## 프론트엔드

| 항목 | 지침 |
| --- | --- |
| 렌더링 | SSG/ISR/SSR/CSR — [클라이언트 아키텍처](../client/architecture) |
| 캐시 | `cache.policy.ts` 기준 |
| 상태 | React Query + Optimistic Update |
| 접근성 | `buildAriaLabel` 단일 진입점 |
| OAuth | 백엔드 주도, 프론트는 진입·세션만 |

문서: [클라이언트 아키텍처](../client/architecture)

## API·이벤트 계약

- REST: [Producer API](../producer/api) · server/producer/src/modules/
- BFF: [BFF Route Handler](../client/api-bff) · client/src/app/api/
- 이벤트: [Observability](../other/observability) — **신규 이벤트는 사전 등록 후 코드**

## Git·PR

- `pnpm run ci` 통과 후 PR
- API 계약·문서·Docusaurus 동시 갱신
- 상세: [기여 가이드](./contributing)

## 문서 동기화

구현 변경 시 동기화 대상:

1. 아키텍처·API 계약 문서 확인
2. server/producer Swagger DTO 및 client Route Handler
3. `docs/docs/` Docusaurus 페이지
4. (해당 시) client/src/app/globals.css

## 관련 문서

- [기여 가이드](./contributing)
- [모노레포 구조](../project/monorepo)
