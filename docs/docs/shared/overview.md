---
title: Shared 패키지 개요
---

# Shared 패키지 개요

## 이 문서로 해결할 질문

- `@mealio/shared`는 무엇을 제공하는가?
- Producer/Consumer가 어떻게 import하는가?
- 빌드 순서는?

## 패키지 정보

| 항목 | 값 |
| --- | --- |
| 이름 | `@mealio/shared` |
| 경로 | `server/shared` |
| 역할 | Producer·Consumer 공통 설정·DB·타입·상수 |

`client`는 shared를 **직접 import하지 않습니다**.

## 제공 범위

```text
server/shared/src/
├── config/           # kafka, redis, observability, sentry
├── constants/        # kafka-topics, cache-keys, redis-channels
├── policy/           # user-credits, recipe-ingestion
├── database/
│   ├── prisma/       # schema, migrations, PrismaService
│   └── mongoose/     # schemas (Inventory, EventLog, ...)
├── redis/            # RedisService, RedisModule
├── types/events/     # Kafka·SSE 이벤트 타입
├── observability/    # Sentry 래퍼
└── utils/            # logger, correlation-id, recipe-nutrition
```

## import 예

```typescript
import {
  PrismaModule,
  KAFKA_TOPICS,
  cacheKeyRecommendation,
  computeChatbotCreditCost,
} from '@mealio/shared';

import { Recipe, Prisma } from '@mealio/shared/prisma-client';
```

## 빌드 순서

```bash
pnpm run build:shared    # prisma generate + tsc
pnpm run build:producer
pnpm run build:consumer
```

루트: `pnpm run db:prisma:generate` — 스키마 변경 후 필수.

## DB 모듈

| 모듈 | 용도 |
| --- | --- |
| `PrismaModule` | PostgreSQL — connection pool config 주입 |
| `MongooseSchemasModule` | MongoDB — 스키마·풀 config |
| `RedisModule` | Redis 클라이언트 |

Producer/Consumer `app.module`에서 `forRoot` / `forRootAsync`로 pool 설정 전달.

## 확장 원칙

- **양쪽 패키지에서 쓰는** 상수·타입·스키마만 shared에 추가
- 패키지 전용 로직은 producer/consumer에 유지
- Kafka 토픽·캐시 키 변경 시 **양쪽 명세 + event_dictionary** 동기화

## 관련 문서

- [데이터 모델/스키마](./data-models)
- [Redis 키/캐시 계약](./redis-cache-contract)
- [공유 계약](./contracts)

## SSOT

- `agent/backend/spec/backend_architecture_spec_shared.md`
