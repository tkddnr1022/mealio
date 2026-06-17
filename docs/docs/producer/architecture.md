# 아키텍처

## 이 문서로 해결할 질문

- NestJS 모듈 구조와 책임 경계는 무엇인가요?
- 인프라 레이어는 어떻게 구성되나요?
- Kafka 발행·캐시·인증이 어디에 위치하나요?

## 역할

클라이언트 요청 **실시간 처리**, **읽기·캐시 우선 조회**, **Kafka 이벤트 발행**, 챗봇 **SSE 중계**.

GPT 호출·추천 점수 갱신·ETL은 **Consumer** 책임.

## 모듈 구조

```text
server/producer/src/
├── main.ts / app.module.ts
├── config/           # env 검증, Swagger
├── policy/           # cache, rate-limit, chatbot TTL
├── modules/
│   ├── auth/         # OAuth, JWT, refresh
│   ├── users/        # 프로필, 활동
│   ├── recipes/      # 조회, 검색, 추천 API
│   ├── ingredients/  # 재료 검색
│   ├── inventory/    # 보관함 CRUD
│   ├── chatbot/      # 메시지, SSE
│   ├── health/       # /health, /ready
│   └── middleware/   # rate-limit, logging, correlation-id
└── infrastructure/
    ├── cache/        # Cache-Aside 전략
    ├── database/     # Prisma/Mongoose repositories
    └── kafka/        # Producer service
```

## 도메인 모듈 패턴

| 레이어 | 역할 |
| --- | --- |
| `*.controller.ts` | HTTP 라우팅, Guard, DTO 검증 |
| `*.service.ts` | 비즈니스 로직, 캐시, Kafka 발행 |
| `dto/` | 요청·응답 계약 |
| `infrastructure/.../repository` | DB 접근 |

## 인프라

| 인프라 | 용도 |
| --- | --- |
| PostgreSQL (Prisma) | User, Recipe, Ingredient, 추천 원본 테이블 |
| MongoDB (Mongoose) | Inventory 조회 연동 |
| Redis | Cache-Aside, rate limit, refresh 세션 캐시 |
| Kafka | user-events, activity-events, chatbot-requests |

## 쓰기 API 패턴

```text
1. JWT 검증
2. (선택) 캐시 조회
3. DB 읽기/쓰기 또는 이벤트 페이로드 구성
4. Kafka publish
5. HTTP 200/204 (Consumer 반영은 비동기)
```

클라이언트는 Optimistic UI로 즉시 UX 반영.

## 관측성

- `correlation-id.middleware.ts` — 요청 추적
- `metrics.service.ts` — Prometheus `/metrics`
- Sentry — `@mealio/shared/observability`

## 정책 파일

| 파일 | 내용 |
| --- | --- |
| `policy/cache.policy.ts` | Redis TTL(초) |
| `policy/rate-limit.policy.ts` | 윈도우·최대 요청 |
| `policy/chatbot.policy.ts` | SSE 타임아웃 |

## 관련 문서

- [도메인 API 가이드](./domain-api)
- [인증/인가](./auth)
- [캐시](./cache)
- [이벤트 발행](./event-publishing)
