# 백엔드 아키텍처 모듈 명세서

## 1. Producer 서버 (NestJS API)

### 1.1 핵심 책임
- 클라이언트 요청의 실시간 처리 및 즉각적인 응답
- 비즈니스 로직 검증 및 빠른 읽기 작업
- 이벤트 발행 (Kafka Producer)
- 캐시 우선 조회 및 응답 최적화

### 1.2 구현 모듈

#### A. API Gateway 레이어
```
modules/
├── auth/
│   ├── guards/          # JWT, OAuth 인증 가드
│   ├── strategies/      # Passport 전략 (Google, Kakao 등)
│   └── decorators/      # @CurrentUser, @Public 등
├── health/
│   └── controllers/     # 헬스체크 엔드포인트 (/health, /ready)
└── middleware/
    ├── rate-limit/      # API 요청 제한 (Redis 기반)
    ├── logging/         # 요청/응답 로깅
    └── correlation-id/  # 분산 추적용 ID 생성
```

#### B. Domain 모듈
```
modules/
├── users/
│   ├── controllers/ 
│   │   ├── GET /api/v1/users/me
│   │   └── PATCH /api/v1/users/me/nickname
│   ├── services/        # 캐시 조회 우선, RDS 폴백
│   └── dto/             # 요청/응답 DTO
├── recipes/
│   ├── controllers/     
│   │   ├── GET /api/v1/recipes (페이지네이션, 필터링, 정렬)
│   │   ├── GET /api/v1/recipes/:recipeId
│   │   └── GET /api/v1/recipes/search (키워드 검색)
│   ├── services/
│   │   └── RecipeQueryService    # 읽기 전용, 캐시 활용
│   └── dto/             # 요청/응답 DTO
├── ingredients/
│   ├── controllers/
│   │   ├── GET /api/v1/ingredients (카테고리별 조회, 페이지네이션)
│   │   └── GET /api/v1/ingredients/search (키워드 검색)
│   └── services/        # 캐시 우선 조회
├── user-ingredients/
│   ├── controllers/
│   │   ├── GET /api/v1/users/me/ingredients
│   │   ├── PUT /api/v1/users/me/ingredients (bulk update)
│   │   ├── POST /api/v1/users/me/ingredients (재료 추가/수정)
│   │   ├── DELETE /api/v1/users/me/ingredients/:ingredientId
│   │   └── PUT /api/v1/users/me/ingredients/favorites
│   ├── services/
│   │   └── UserIngredientService  # MongoDB 저장, 캐시 관리
│   └── dto/             # 요청/응답 DTO
└── chatbot/
    ├── controllers/
    │   ├── POST /api/v1/chatbot/messages
    │   └── GET /api/v1/chatbot/conversations/:conversationId
    ├── services/        
    │   └── ChatbotEventService   # Kafka로 요청 전달
    └── dto/             # 메시지 DTO
```

#### C. Infrastructure 레이어
```
infrastructure/
├── database/
│   ├── prisma/
│   │   ├── prisma.service.ts           # Prisma Client 싱글톤
│   │   ├── prisma-postgresql.service.ts     # PostgreSQL 전용 클라이언트
│   │   ├── prisma-mongo.service.ts     # MongoDB 전용 클라이언트
│   │   ├── schema.prisma               # 통합 스키마 정의
│   │   └── migrations/                 # PostgreSQL 마이그레이션 파일
│   └── repositories/
│       ├── postgresql/
│       │   ├── user.repository.ts
│       │   ├── recipe.repository.ts
│       │   ├── ingredient.repository.ts
│       │   └── recipe-ingredient.repository.ts
│       └── mongodb/
│           ├── event-log.repository.ts
│           ├── chatbot-log.repository.ts
│           └── user-ingredient.repository.ts
├── cache/
│   ├── redis.service.ts      # Redis 커넥션 관리
│   ├── cache.decorator.ts    # @Cacheable 데코레이터
│   └── strategies/
│       ├── RecipeCacheStrategy      # TTL: 1시간
│       ├── IngredientCacheStrategy  # TTL: 24시간
│       └── UserCacheStrategy        # TTL: 30분
├── kafka/
│   ├── producer.service.ts   # Kafka 메시지 발행
│   ├── topics/               # 토픽 상수 정의
│   └── serializers/          # Avro/JSON 직렬화
└── storage/
    ├── s3.service.ts         # 이미지 업로드용 Presigned URL 생성
    └── cdn.service.ts        # CloudFlare 캐시 무효화 트리거
```

#### D. 성능 최적화 모듈
```
optimization/
├── caching/
│   ├── query-result.cache.ts      # Prisma 쿼리 결과 캐싱
│   ├── http-response.cache.ts     # HTTP 응답 캐싱
│   └── cache-warming.service.ts   # 인기 레시피 사전 캐싱
├── database/
│   ├── connection-pool.config.ts  # Prisma 커넥션 풀 설정
│   ├── read-replica.config.ts     # 읽기 복제본 URL 관리
│   └── query-optimizer/
│       ├── select-optimizer.ts    # Prisma select 최적화
│       └── include-optimizer.ts   # 불필요한 include 제거
└── monitoring/
    ├── metrics.service.ts         # Prometheus 메트릭 수집
    ├── slow-query.interceptor.ts  # 느린 쿼리 자동 로깅
    └── prisma-metrics.ts          # Prisma 쿼리 메트릭
```

---

## 2. Consumer 서버 (Kafka Event Processor)

### 2.1 핵심 책임
- 비동기 작업의 백그라운드 처리
- 무거운 연산 및 외부 API 호출 (OpenAI)
- 데이터 쓰기 작업 (Prisma를 통한 INSERT/UPDATE)
- 이벤트 로깅 및 분석 데이터 축적

### 2.2 구현 모듈

#### A. Event Consumer 레이어
```
consumers/
├── base/
│   ├── base.consumer.ts           # 공통 컨슈머 로직
│   ├── retry.strategy.ts          # 재시도 전략 (지수 백오프)
│   └── dead-letter.handler.ts     # DLQ 처리
├── recipe-generation/
│   ├── recipe-generation.consumer.ts
│   ├── handlers/
│   │   ├── GenerateRecipeHandler      # OpenAI API 호출
│   │   ├── SaveRecipeHandler          # Prisma로 Recipe 저장
│   │   └── UploadImageHandler         # S3 이미지 저장
│   └── validators/
│       └── recipe-data.validator.ts   # 생성된 레시피 검증
├── chatbot-requests/
│   ├── chatbot-request.consumer.ts
│   ├── handlers/
│   │   ├── ProcessChatHandler         # GPT-4 호출
│   │   ├── SaveChatLogHandler         # Prisma로 MongoDB 로깅
│   │   └── UpdateContextHandler       # 대화 컨텍스트 갱신
│   └── context/
│       └── conversation.manager.ts    # 대화 히스토리 관리
├── search-logs/
│   ├── search-log.consumer.ts
│   └── handlers/
│       ├── IndexSearchHandler         # 검색어 인덱싱
│       └── AnalyticsHandler           # 검색 패턴 분석
├── user-events/
│   ├── user-event.consumer.ts
│   └── handlers/
│       ├── UpdateUserProfileHandler   # 사용자 프로필 업데이트
│       ├── TrackUserActivityHandler   # EventLog 저장
│       └── RecommendationHandler      # 추천 알고리즘 갱신
└── cache-invalidation/
    ├── cache-invalidation.consumer.ts
    └── handlers/
        ├── RedisInvalidationHandler   # Redis 캐시 무효화
        └── CDNInvalidationHandler     # CloudFlare 캐시 퍼지
```

#### B. External Integration 레이어
```
integrations/
├── openai/
│   ├── openai.service.ts          # GPT-4 API 래퍼
│   ├── prompt-templates/
│   │   ├── recipe-generation.ts   # 레시피 생성 프롬프트
│   │   └── chatbot-response.ts    # 챗봇 응답 프롬프트
│   ├── response-parser.ts         # JSON 파싱 및 검증
│   └── rate-limiter.ts            # API 호출 제한 관리
├── storage/
│   ├── s3-uploader.service.ts     # 대용량 이미지 업로드
│   └── image-optimizer.ts         # 이미지 리사이징/압축
└── analytics/
    ├── google-analytics.service.ts
    └── sentry.service.ts          # 에러 리포팅
```

#### C. Data Processing 레이어
```
processing/
├── batch/
│   ├── recipe-enrichment/         # 레시피 데이터 보강
│   │   ├── nutrition.calculator.ts
│   │   └── tag.generator.ts
│   ├── user-analytics/            # 사용자 행동 분석
│   │   ├── preference.analyzer.ts
│   │   └── activity.aggregator.ts
│   └── recommendation/            # 추천 시스템
│       ├── collaborative-filter.ts
│       └── content-based-filter.ts
├── validation/
│   ├── schema.validator.ts        # 이벤트 스키마 검증
│   └── business-rule.validator.ts # 비즈니스 규칙 검증
└── transformation/
    ├── event.transformer.ts       # 이벤트 데이터 변환
    └── data.normalizer.ts         # 데이터 정규화
```

#### D. Persistence 레이어
```
persistence/
├── repositories/
│   ├── postgresql/
│   │   ├── recipe.repository.ts       # Recipe 쓰기 작업
│   │   ├── user.repository.ts         # User 업데이트
│   │   └── recipe-ingredient.repository.ts
│   └── mongodb/
│       ├── event-log.repository.ts    # EventLog 저장
│       ├── chatbot-log.repository.ts  # ChatbotLog 저장
│       └── user-ingredient.repository.ts
├── transactions/
│   ├── recipe-creation.transaction.ts  # Prisma 트랜잭션
│   │   # prisma.$transaction([...])으로 원자성 보장
│   └── saga.coordinator.ts        # 분산 트랜잭션 관리
└── bulk-operations/
    ├── batch-create.service.ts    # createMany() 활용
    ├── batch-update.service.ts    # updateMany() 활용
    └── upsert.service.ts          # upsert() 활용
```

#### E. 신뢰성 보장 모듈
```
reliability/
├── retry/
│   ├── exponential-backoff.ts     # 지수 백오프 재시도
│   └── circuit-breaker.ts         # OpenAI API 서킷 브레이커
├── idempotency/
│   ├── idempotent.decorator.ts    # 멱등성 보장
│   └── deduplication.service.ts   # 중복 이벤트 필터링
├── monitoring/
│   ├── consumer-lag.monitor.ts    # Kafka lag 모니터링
│   ├── error-rate.monitor.ts      # 에러율 추적
│   └── throughput.monitor.ts      # 처리량 측정
└── dead-letter/
    ├── dlq.handler.ts             # DLQ 처리 로직
    └── manual-replay.service.ts   # 수동 재처리 도구
```

---

## 3. Prisma 설정 및 구조

### 3.1 Prisma Schema 구조
```
prisma/
├── schema.prisma                  # 메인 스키마 파일
├── migrations/                    # PostgreSQL 마이그레이션
│   └── YYYYMMDDHHMMSS_init/
└── seed/
    ├── seed.ts                    # 시드 데이터 스크립트
    └── data/
        ├── ingredients.json       # 기본 재료 데이터
        └── sample-recipes.json    # 샘플 레시피
```

### 3.2 Schema.prisma 예시
```prisma
// PostgreSQL 데이터소스
datasource postgresql {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// MongoDB 데이터소스
datasource mongodb {
  provider = "mongodb"
  url      = env("MONGODB_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
  previewFeatures = ["multiSchema", "mongodb"]
}

// PostgreSQL 모델
model User {
  id           Int   @id @default(autoincrement())
  email        String   @unique @db.VarChar(100)
  nickname     String   @db.VarChar(20)
  platformName String   @map("platform_name") @db.VarChar(10)
  platformId   String   @map("platform_id") @db.VarChar(100)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("User")
  @@schema("postgresql")
}

model Recipe {
  id           Int      @id @default(autoincrement())
  title        String   @db.VarChar(100)
  description  String?  @db.Text
  instructions Json
  difficulty   Int      @db.SmallInt
  cookTime     Int      @map("cook_time")
  imageUrl     String?  @map("image_url") @db.VarChar(512)
  createdAt    DateTime @default(now()) @map("created_at")

  recipeIngredients RecipeIngredient[]

  @@map("Recipe")
  @@index([difficulty, cookTime])
  @@schema("postgresql")
}

model Ingredient {
  id        Int   @id @default(autoincrement())
  name      String   @db.VarChar(100)
  category  Int
  createdAt DateTime @default(now()) @map("created_at")

  recipeIngredients RecipeIngredient[]

  @@map("Ingredient")
  @@index([category, name])
  @@schema("postgresql")
}

model RecipeIngredient {
  id           Int      @id @default(autoincrement())
  recipeId     Int      @map("recipe_id")
  ingredientId Int      @map("ingredient_id")
  amount       Decimal? @db.Decimal(10, 2)
  unit         String?  @db.VarChar(20)
  isOptional   Boolean  @default(false) @map("is_optional")

  recipe     Recipe     @relation(fields: [recipeId], references: [id])
  ingredient Ingredient @relation(fields: [ingredientId], references: [id])

  @@map("RecipeIngredient")
  @@index([recipeId])
  @@index([ingredientId])
  @@schema("postgresql")
}

// MongoDB 모델
model EventLog {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  type        String
  actor       Json
  entity      Json?
  payload     Json?
  metadata    Json?
  occurredAt  DateTime @default(now())
  processedAt DateTime?

  @@map("EventLog")
  @@schema("mongodb")
}

model ChatbotLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    Int
  role      String
  message   String?
  context   Json?
  llm       Json?
  latency   Int?
  success   Boolean
  error     String?
  createdAt DateTime @default(now())

  @@map("ChatbotLog")
  @@index([userId, createdAt])
  @@schema("mongodb")
}

model UserIngredient {
  id                    String  @id @default(auto()) @map("_id") @db.ObjectId
  userId                Int     @unique
  ingredientsIds        Int[]
  favoriteIngredientIds Int[]
  lastSyncedAt          DateTime?

  @@map("UserIngredient")
  @@schema("mongodb")
}
```

### 3.3 Prisma Service 구현
```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as PrismaPostgreSQLClient } from '@prisma/client/postgresql';
import { PrismaClient as PrismaMongoClient } from '@prisma/client/mongodb';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  postgresql: PrismaPostgreSQLClient;
  mongo: PrismaMongoClient;

  constructor() {
    // PostgreSQL 클라이언트
    this.postgresql = new PrismaPostgreSQLClient({
      log: ['query', 'error', 'warn'],
      datasources: {
        postgresql: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // MongoDB 클라이언트
    this.mongo = new PrismaMongoClient({
      log: ['query', 'error', 'warn'],
      datasources: {
        mongodb: {
          url: process.env.MONGODB_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.postgresql.$connect();
    await this.mongo.$connect();
  }

  async onModuleDestroy() {
    await this.postgresql.$disconnect();
    await this.mongo.$disconnect();
  }

  // 읽기 전용 복제본 연결 (선택적)
  async getReadReplica() {
    return new PrismaPostgreSQLClient({
      datasources: {
        postgresql: {
          url: process.env.DATABASE_READ_REPLICA_URL,
        },
      },
    });
  }
}
```

### 3.4 Repository 패턴 구현
```typescript
// repositories/postgresql/recipe.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { Prisma, Recipe } from '@prisma/client';

@Injectable()
export class RecipeRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: number, useReplica = true): Promise<Recipe | null> {
    const client = useReplica 
      ? await this.prisma.getReadReplica() 
      : this.prisma.postgresql;

    return client.recipe.findUnique({
      where: { id },
      include: {
        recipeIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.RecipeCreateInput): Promise<Recipe> {
    return this.prisma.postgresql.recipe.create({
      data,
    });
  }

  async createWithIngredients(
    recipeData: Prisma.RecipeCreateInput,
    ingredients: Array<{ ingredientId: number; amount?: number; unit?: string }>
  ): Promise<Recipe> {
    return this.prisma.postgresql.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: recipeData,
      });

      await tx.recipeIngredient.createMany({
        data: ingredients.map((ing) => ({
          recipeId: recipe.id,
          ingredientId: ing.ingredientId,
          amount: ing.amount,
          unit: ing.unit,
        })),
      });

      return recipe;
    });
  }

  async searchRecipes(params: {
    difficulty?: number;
    maxCookTime?: number;
    ingredientIds?: number[];
    skip?: number;
    take?: number;
  }): Promise<Recipe[]> {
    const client = await this.prisma.getReadReplica();

    return client.recipe.findMany({
      where: {
        difficulty: params.difficulty,
        cookTime: params.maxCookTime ? { lte: params.maxCookTime } : undefined,
        recipeIngredients: params.ingredientIds
          ? {
              some: {
                ingredientId: {
                  in: params.ingredientIds,
                },
              },
            }
          : undefined,
      },
      skip: params.skip,
      take: params.take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
```

---

## 4. 공통 모듈 (Shared)

### 4.1 공유 라이브러리
```
shared/
├── constants/
│   ├── kafka-topics.ts            # 토픽 이름 상수
│   ├── cache-keys.ts              # 캐시 키 패턴
│   └── error-codes.ts             # 에러 코드 정의
├── types/
│   ├── events/                    # 이벤트 타입 정의
│   │   ├── recipe-generation.event.ts
│   │   ├── chatbot-request.event.ts
│   │   └── user-event.event.ts
│   └── dtos/                      # 공통 DTO
├── utils/
│   ├── logger.ts                  # 구조화된 로깅
│   ├── error-handler.ts           # 전역 에러 핸들러
│   ├── prisma-helpers.ts          # Prisma 유틸리티 함수
│   └── validator.ts               # 공통 검증 로직
└── configs/
    ├── prisma.config.ts           # Prisma 설정
    ├── kafka.config.ts
    ├── redis.config.ts
    └── observability.config.ts
```

---

## 5. 아키텍처 설계 원칙

### 5.1 Producer 설계 원칙
1. **Fast Response First**: 모든 API는 200ms 이내 응답 목표
2. **Cache-Aside Pattern**: Redis 조회 → Prisma 폴백 → Redis 캐시 갱신
3. **Event Sourcing**: 쓰기 작업은 이벤트 발행으로 대체
4. **Read Replica 활용**: 읽기 작업은 복제본으로 라우팅
5. **Prisma Connection Pool**: `pool_timeout`, `connection_limit` 최적화

### 5.2 Consumer 설계 원칙
1. **At-Least-Once Delivery**: 멱등성 보장으로 중복 처리 방지
2. **Graceful Degradation**: OpenAI API 장애 시 재시도 후 DLQ 전송
3. **Batch Processing**: Prisma `createMany()`, `updateMany()` 활용
4. **Partitioned Processing**: Kafka 파티션별 병렬 처리
5. **Observability**: Prisma 쿼리 메트릭 수집 및 추적

### 5.3 Prisma 최적화 전략
1. **Select 최적화**: 필요한 필드만 조회 (`select: { id: true, title: true }`)
2. **Include 제한**: N+1 방지를 위해 필요한 관계만 포함
3. **Batch Operations**: `createMany()`, `updateMany()` 사용
4. **Transaction 최소화**: 트랜잭션 범위를 최소화하여 락 경합 감소
5. **Index 활용**: `@@index`, `@@unique` 적극 활용

### 5.4 데이터베이스 분리 전략
- **PostgreSQL (via Prisma)**: 정규화된 관계형 데이터, ACID 보장 필요 데이터
- **MongoDB (via Prisma)**: 비정규화된 로그성 데이터, 스키마 유연성 필요 데이터

### 5.5 확장성 전략
1. **Horizontal Scaling**: Producer/Consumer 모두 인스턴스 증설 가능
2. **Kafka Partitioning**: 토픽당 파티션 수 = Consumer 인스턴스 수
3. **Redis Cluster**: 캐시 데이터 샤딩
4. **Database Sharding**: User ID 기반 샤딩 준비 (향후)
5. **Prisma Connection Pooling**: 인스턴스당 최적 커넥션 수 설정

---

## 6. 구현 우선순위

### Phase 1: MVP (핵심 기능)
1. **Prisma 설정**
   - PostgreSQL, MongoDB 스키마 정의
   - 마이그레이션 생성 및 적용
   - Seed 데이터 준비
2. **Producer**: Auth, Users, Recipes (조회), Kafka 발행
3. **Consumer**: Recipe Generation, ChatbotLog 저장
4. **Infrastructure**: Prisma Client, Kafka, Redis 연결

### Phase 2: 최적화
1. Cache-Aside 패턴 구현
2. Read Replica 라우팅 (Prisma)
3. Prisma Select/Include 최적화
4. 재시도 및 DLQ 처리

### Phase 3: 관찰성
1. Prisma 쿼리 메트릭 수집
2. 분산 추적 (Correlation ID)
3. 에러 모니터링 (Sentry)
4. 슬로우 쿼리 알림

---

## 7. Prisma 관련 주의사항

### 7.1 Multi-Schema 지원
- Prisma는 하나의 스키마 파일에서 여러 데이터소스를 지원
- `@@schema("postgresql")`, `@@schema("mongodb")` 디렉티브로 구분
- 각 모델에 명시적으로 스키마 지정 필요

### 7.2 타입 안정성
- Prisma Client는 TypeScript 타입을 자동 생성
- `Prisma.RecipeCreateInput` 등의 타입을 DTO에 재사용 가능
- 컴파일 타임에 스키마 변경 감지

### 7.3 마이그레이션
- MongoDB는 마이그레이션 미지원 (스키마리스)
- PostgreSQL에 `prisma migrate` 사용
- Production에서는 `prisma migrate deploy` 사용

### 7.4 성능 모니터링
```typescript
// Prisma 쿼리 로깅 및 메트릭
this.postgresql.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
  
  return result;
});
```

---

## 8. 모듈 단위 TDD 지침

모듈을 작성할 때 **Controller**와 **Service**에 대한 테스트 코드는 **해당 모듈 내 `__tests__` 폴더**에 **역할별 하위 폴더**로 분리하여 작성한다. 테스트는 소스 파일과 같은 디렉터리에 두지 않고, `__tests__/controllers`, `__tests__/services` 등으로 세분화한다.

### 8.1 공통 원칙

- **테스트 폴더 구조**: 각 모듈 루트에 `__tests__`를 두고, `controllers/`, `services/`(또는 consumer의 경우 `handlers/`, `consumers/`)로 구분한다.
- **파일 명명**: `{대상}.spec.ts` (예: `users.controller.spec.ts`, `users.service.spec.ts`).
- **의존성**: Controller/Service/Handler는 Repository, 외부 클라이언트 등을 전부 Mock하여 단위 테스트로 실행한다.
- **TDD 순서**: **Red-Green-Refactor** 사이클을 따른다. 새 API/핸들러 추가 시 해당 spec을 먼저 확장한 뒤, 실패(Red) → 통과(Green) → 개선(Refactor) 순으로 진행한다.

#### Red-Green-Refactor 사이클

모든 테스트·구현은 다음 세 단계를 **한 번에 한 동작(예: 하나의 API, 하나의 핸들러 메서드)** 단위로 반복한다.

| 단계 | 목표 | 수행 내용 |
|------|------|-----------|
| **Red** | 실패하는 테스트를 먼저 만든다 | `it('...', ...)`를 작성하고, 아직 구현되지 않은 메서드·엔드포인트를 호출한다. `npm run test` 시 해당 spec이 **실패**하는 것을 확인한다. |
| **Green** | 최소한의 코드로 테스트를 통과시킨다 | Controller/Service/Handler에 **통과에 필요한 최소 구현**만 추가한다. 중복·예쁜 코드는 신경 쓰지 않는다. `npm run test`로 **전부 통과**할 때까지 수정한다. |
| **Refactor** | 구현을 정리한다 | 중복 제거, 네이밍·구조 개선, 상수/유틸 분리 등 **동작은 그대로 두고** 코드 품질만 높인다. 매 수정 후 `npm run test`로 회귀 여부를 확인한다. |

**흐름 예시** (Producer `PATCH /api/v1/users/me/nickname` 추가 시):

1. **Red**: `users.controller.spec.ts`에 `it('닉네임을 수정하고 { id, nickname }을 반환한다', ...)`와 `users.service.spec.ts`에 `it('닉네임을 갱신하고 { id, nickname }을 반환한다', ...)`를 작성 후 `npm run test` → **실패** (아직 `updateNickname` 미구현).
2. **Green**: `UsersController.updateNickname`, `UsersService.updateNickname`, `UserRepository.update`를 **통과할 만큼만** 구현 → `npm run test` → **전부 통과**.
3. **Refactor**: `UsersService` 내부에 중복된 `findById` 호출을 private 메서드로 뽑거나, DTO 검증 로직을 정리한 뒤, `npm run test`로 **계속 통과**하는지 확인.

**주의**: Green 단계에서 “일단 통과”만 목표로 하고, Refactor 단계까지 가기 전에 다른 기능을 추가하지 않는다. 사이클이 작을수록 버그와 복잡도 증가를 줄일 수 있다.

### 8.2 Producer: 디렉토리 구조 및 예제

Producer는 **HTTP 요청 처리**가 중심이므로, **Controller**(라우팅·인증·DTO 변환)와 **Service**(캐시·비즈니스 로직·이벤트 발행)를 각각 테스트한다.

#### 디렉토리 구조

```
modules/
└── users/
    ├── __tests__/
    │   ├── controllers/
    │   │   └── users.controller.spec.ts
    │   └── services/
    │       └── users.service.spec.ts
    ├── dto/
    │   ├── update-nickname.dto.ts
    │   └── user-profile.dto.ts
    ├── users.controller.ts
    ├── users.service.ts
    └── users.module.ts
```

#### Controller 테스트 예제 (Producer)

- **초점**: HTTP 메서드·경로·인증 가드·Service 호출·예외→HTTP 상태 매핑.
- **Mock**: `UsersService` 전체를 Mock. `@CurrentUser()` 등 커스텀 데코레이터는 `jest.spyOn` 또는 테스트용 오버라이드로 처리.

```typescript
// modules/users/__tests__/controllers/users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from '../../users.controller';
import { UsersService } from '../../users.service';
import { UserProfileDto } from '../../dto/user-profile.dto';
import type { AuthUser } from '../../../auth/types/request.types';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockAuthUser: AuthUser = { id: 1, email: 'test@example.com', platformName: 'local' };
  const mockProfile: UserProfileDto = {
    id: 1,
    email: 'test@example.com',
    nickname: 'TestUser',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockService = {
      getProfile: jest.fn().mockResolvedValue(mockProfile),
      updateNickname: jest.fn().mockResolvedValue({ id: 1, nickname: 'NewNick' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService);
  });

  describe('getProfile', () => {
    it('인증 사용자일 때 프로필을 반환한다', async () => {
      const result = await controller.getProfile(mockAuthUser);
      expect(usersService.getProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProfile);
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      usersService.getProfile.mockRejectedValue(new NotFoundException('User not found'));
      await expect(controller.getProfile(mockAuthUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateNickname', () => {
    it('닉네임을 수정하고 { id, nickname }을 반환한다', async () => {
      const dto = { nickname: 'NewNick' };
      const result = await controller.updateNickname(mockAuthUser, dto);
      expect(usersService.updateNickname).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ id: 1, nickname: 'NewNick' });
    });
  });
});
```

#### Service 테스트 예제 (Producer)

- **초점**: 비즈니스 로직, 캐시 조회/갱신, Repository·Kafka·Redis 등 외부 의존성 호출 여부 및 예외 처리.
- **Mock**: `UserRepository`, `CacheService`, `KafkaProducerService` 등 해당 모듈이 사용하는 모든 의존성.

```typescript
// modules/users/__tests__/services/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../users.service';
import { UserRepository } from '../../../../infrastructure/database/repositories/postgresql/user.repository';
import { UpdateNicknameDto } from '../../dto/update-nickname.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<UserRepository>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    nickname: 'TestUser',
    platformName: 'local',
    platformId: 'id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue({ ...mockUser, nickname: 'NewNick' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(UsersService);
    userRepository = module.get(UserRepository);
  });

  describe('getProfile', () => {
    it('userId로 조회하여 UserProfileDto를 반환한다', async () => {
      const result = await service.getProfile(1);
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
      expect(result.nickname).toBe('TestUser');
    });

    it('사용자가 없으면 NotFoundException을 던진다', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateNickname', () => {
    it('닉네임을 갱신하고 { id, nickname }을 반환한다', async () => {
      const dto: UpdateNicknameDto = { nickname: 'NewNick' };
      const result = await service.updateNickname(1, dto);
      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.update).toHaveBeenCalledWith(1, { nickname: 'NewNick' });
      expect(result).toEqual({ id: 1, nickname: 'NewNick' });
    });
  });
});
```

### 8.3 Consumer: 디렉토리 구조 및 예제

Consumer는 **이벤트(메시지) 수신·라우팅**과 **핸들러(비즈니스 로직·DB·외부 API)**가 분리된다.  
- **Consumer** ≈ Producer의 Controller: 토픽 구독, 역직렬화, 파티션/오프셋, 핸들러 호출, 재시도/DLQ 위임.  
- **Handler** ≈ Producer의 Service: 이벤트 페이로드 기반 비즈니스 로직, DB 쓰기, OpenAI·S3 등 외부 호출.

#### 디렉토리 구조

```
consumers/
└── recipe-generation/
    ├── __tests__/
    │   ├── consumers/
    │   │   └── recipe-generation.consumer.spec.ts
    │   └── handlers/
    │       ├── GenerateRecipeHandler.spec.ts
    │       ├── SaveRecipeHandler.spec.ts
    │       └── UploadImageHandler.spec.ts
    ├── recipe-generation.consumer.ts
    ├── handlers/
    │   ├── GenerateRecipeHandler.ts
    │   ├── SaveRecipeHandler.ts
    │   └── UploadImageHandler.ts
    └── validators/
        └── recipe-data.validator.ts
```

#### Consumer 테스트 예제 (라우팅·재시도·DLQ)

- **초점**: 메시지 수신 시 적절한 핸들러 호출, 에러 시 재시도/DLQ 위임, 역직렬화 예외 처리.
- **Mock**: `GenerateRecipeHandler`, `SaveRecipeHandler`, `UploadImageHandler`, Kafka Consumer 인스턴스, `RetryStrategy`, `DeadLetterHandler`.

```typescript
// consumers/recipe-generation/__tests__/consumers/recipe-generation.consumer.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RecipeGenerationConsumer } from '../../recipe-generation.consumer';
import { GenerateRecipeHandler } from '../../handlers/GenerateRecipeHandler';
import { SaveRecipeHandler } from '../../handlers/SaveRecipeHandler';

describe('RecipeGenerationConsumer', () => {
  let consumer: RecipeGenerationConsumer;
  let generateHandler: jest.Mocked<GenerateRecipeHandler>;
  let saveHandler: jest.Mocked<SaveRecipeHandler>;

  const mockMessage = {
    key: Buffer.from('req-1'),
    value: Buffer.from(JSON.stringify({ userId: 1, ingredientIds: [1, 2] })),
    partition: 0,
    offset: '0',
  };

  beforeEach(async () => {
    const mockGen = { execute: jest.fn().mockResolvedValue({ recipe: { id: 1, title: 'A' } }) };
    const mockSave = { execute: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeGenerationConsumer,
        { provide: GenerateRecipeHandler, useValue: mockGen },
        { provide: SaveRecipeHandler, useValue: mockSave },
        // RetryStrategy, DeadLetterHandler, Kafka Consumer 등 Mock
      ],
    }).compile();

    consumer = module.get(RecipeGenerationConsumer);
    generateHandler = module.get(GenerateRecipeHandler);
    saveHandler = module.get(SaveRecipeHandler);
  });

  it('유효한 메시지 수신 시 GenerateRecipeHandler → SaveRecipeHandler 순으로 실행한다', async () => {
    await consumer.handleMessage(mockMessage);
    expect(generateHandler.execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 1 }));
    expect(saveHandler.execute).toHaveBeenCalledWith(expect.any(Object));
  });

  it('Handler에서 예외 발생 시 재시도 후 DLQ로 전달한다', async () => {
    generateHandler.execute.mockRejectedValue(new Error('OpenAI timeout'));
    await expect(consumer.handleMessage(mockMessage)).rejects.toThrow();
    // RetryStrategy.increment, DeadLetterHandler.send 호출 검증
  });
});
```

#### Handler 테스트 예제 (Consumer)

- **초점**: 이벤트 페이로드 기반 로직, Repository·OpenAI·S3 등 호출 및 반환값/예외.
- **Mock**: `OpenAIService`, `RecipeRepository`, `S3UploaderService` 등 해당 핸들러가 사용하는 모든 의존성.

```typescript
// consumers/recipe-generation/__tests__/handlers/GenerateRecipeHandler.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GenerateRecipeHandler } from '../../handlers/GenerateRecipeHandler';
import { OpenAIService } from '@/integrations/openai/openai.service';

describe('GenerateRecipeHandler', () => {
  let handler: GenerateRecipeHandler;
  let openAI: jest.Mocked<OpenAIService>;

  const payload = { userId: 1, ingredientIds: [1, 2], difficulty: 1 };

  beforeEach(async () => {
    const mockOpenAI = {
      generateRecipe: jest.fn().mockResolvedValue({
        title: 'Generated Recipe',
        instructions: [],
        cookTime: 30,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateRecipeHandler,
        { provide: OpenAIService, useValue: mockOpenAI },
      ],
    }).compile();

    handler = module.get(GenerateRecipeHandler);
    openAI = module.get(OpenAIService);
  });

  it('payload를 받아 OpenAIService.generateRecipe를 호출하고 레시피 객체를 반환한다', async () => {
    const result = await handler.execute(payload);
    expect(openAI.generateRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ ingredientIds: [1, 2] }),
    );
    expect(result.recipe.title).toBe('Generated Recipe');
  });

  it('OpenAI API 실패 시 예외를 그대로 전파한다', async () => {
    openAI.generateRecipe.mockRejectedValue(new Error('Rate limit'));
    await expect(handler.execute(payload)).rejects.toThrow('Rate limit');
  });
});
```

### 8.4 Producer / Consumer 테스트 세분화 요약

| 구분       | Producer                          | Consumer                                      |
|-----------|------------------------------------|-----------------------------------------------|
| **진입점** | Controller (HTTP)                 | Consumer (Kafka 메시지)                        |
| **비즈니스** | Service                           | Handler                                       |
| **테스트 폴더** | `__tests__/controllers/`, `__tests__/services/` | `__tests__/consumers/`, `__tests__/handlers/` |
| **Controller/Consumer 테스트** | 라우팅, 인증, DTO, Service 호출, HTTP 상태 | 메시지 파싱, 핸들러 순서, 재시도, DLQ          |
| **Service/Handler 테스트** | 캐시, Repository, 이벤트 발행, 도메인 로직 | Repository, OpenAI, S3 등 외부 연동, 도메인 로직 |
| **공통**   | 외부 의존성 Mock, `Test.createTestingModule` | 동일                                          |

### 8.5 Jest 설정

`__tests__` 폴더를 인식하려면 `testRegex`에 `__tests__` 내 `*.spec.ts`를 포함한다. 이미 `.*\\.spec\\.ts$`를 사용 중이면 `src` 이하의 `__tests__`도 기본으로 매칭된다. `rootDir`이 `src`인 경우, `modules/users/__tests__/controllers/users.controller.spec.ts` 같은 경로가 그대로 포함된다.

```json
// package.json (jest 설정)
{
  "jest": {
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "moduleNameMapper": {
      "@/(.*)": "<rootDir>/$1"
    }
  }
}
```

---

이 명세서를 기반으로 대용량 트래픽 처리에 최적화된 백엔드를 구현하세요. 테스트 커버리지 80% 이상을 유지하고, 모든 외부 의존성에 대해 서킷 브레이커를 적용하세요.
