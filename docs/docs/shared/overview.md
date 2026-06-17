# 개요

## 이 문서로 해결할 질문

- `@mealio/shared`는 무엇을 제공하나요?
- Producer/Consumer가 어떻게 import하나요?
- 빌드 순서는 무엇인가요?

## 패키지 정보

| 항목 | 값 |
| --- | --- |
| 이름 | `@mealio/shared` |
| 경로 | `server/shared` |
| 역할 | Producer·Consumer 공통 설정·DB·타입·상수 |

`client` 패키지는 `@mealio/shared`를 직접 import하지 않습니다.

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

스키마를 변경한 뒤에는 루트에서 `pnpm run db:prisma:generate`를 반드시 실행해야 합니다.

## DB 모듈

| 모듈 | 용도 |
| --- | --- |
| `PrismaModule` | PostgreSQL — connection pool config 주입 |
| `MongooseSchemasModule` | MongoDB — 스키마·풀 config |
| `RedisModule` | Redis 클라이언트 |

Producer와 Consumer의 `app.module`에서 `forRoot` 또는 `forRootAsync`로 pool 설정을 전달합니다.

## 확장 원칙

- Producer와 Consumer **양쪽에서 쓰는** 상수·타입·스키마만 shared에 추가합니다.
- 패키지 전용 로직은 producer 또는 consumer에 유지합니다.
- Kafka 토픽·캐시 키를 변경할 때는 **Producer·Consumer 문서와 [Observability](../other/observability)** 를 함께 갱신해야 합니다.

## 관련 문서

- [데이터 모델/스키마](./data-models)
- [공유 계약](./contracts)
- [Redis 키/캐시 계약](./redis-cache-contract)
- [환경 변수](./environment-variables)
- [모노레포 구조](../project/monorepo)
