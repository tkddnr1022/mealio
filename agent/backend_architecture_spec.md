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
│   ├── controllers/     # GET /users/:id, PATCH /users/:id
│   ├── services/        # 캐시 조회 우선, RDS 폴백
│   └── dto/             # 요청/응답 DTO
├── recipes/
│   ├── controllers/     
│   │   ├── GET /recipes (검색, 필터링)
│   │   ├── GET /recipes/:id
│   │   └── POST /recipes/generate (이벤트 발행만)
│   ├── services/
│   │   ├── RecipeQueryService    # 읽기 전용, 캐시 활용
│   │   └── RecipeEventService    # Kafka 이벤트 발행
│   └── queries/         # GraphQL 쿼리 리졸버
├── ingredients/
│   ├── controllers/     # GET /ingredients (자동완성)
│   └── services/        # 캐시 우선 조회
└── chatbot/
    ├── controllers/     # POST /chatbot/message
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
│   │   ├── prisma-mysql.service.ts     # MySQL 전용 클라이언트
│   │   ├── prisma-mongo.service.ts     # MongoDB 전용 클라이언트
│   │   ├── schema.prisma               # 통합 스키마 정의
│   │   └── migrations/                 # MySQL 마이그레이션 파일
│   └── repositories/
│       ├── mysql/
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
│   ├── mysql/
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
├── migrations/                    # MySQL 마이그레이션
│   └── YYYYMMDDHHMMSS_init/
└── seed/
    ├── seed.ts                    # 시드 데이터 스크립트
    └── data/
        ├── ingredients.json       # 기본 재료 데이터
        └── sample-recipes.json    # 샘플 레시피
```

### 3.2 Schema.prisma 예시
```prisma
// MySQL 데이터소스
datasource mysql {
  provider = "mysql"
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

// MySQL 모델
model User {
  id           BigInt   @id @default(autoincrement())
  email        String   @unique @db.VarChar(100)
  nickname     String   @db.VarChar(20)
  platformName String   @map("platform_name") @db.VarChar(10)
  platformId   String   @map("platform_id") @db.VarChar(100)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("User")
  @@schema("mysql")
}

model Recipe {
  id           BigInt   @id @default(autoincrement())
  title        String   @db.VarChar(100)
  description  String?  @db.Text
  instructions Json
  difficulty   Int      @db.TinyInt
  cookTime     Int      @map("cook_time")
  imageUrl     String?  @map("image_url") @db.Text
  createdAt    DateTime @default(now()) @map("created_at")

  recipeIngredients RecipeIngredient[]

  @@map("Recipe")
  @@index([difficulty, cookTime])
  @@schema("mysql")
}

model Ingredient {
  id        BigInt   @id @default(autoincrement())
  name      String   @db.VarChar(100)
  category  Int
  createdAt DateTime @default(now()) @map("created_at")

  recipeIngredients RecipeIngredient[]

  @@map("Ingredient")
  @@index([category, name])
  @@schema("mysql")
}

model RecipeIngredient {
  id           BigInt   @id @default(autoincrement())
  recipeId     BigInt   @map("recipe_id")
  ingredientId BigInt   @map("ingredient_id")
  amount       Float?
  unit         String?  @db.VarChar(10)
  isOptional   Boolean  @default(false) @map("is_optional")

  recipe     Recipe     @relation(fields: [recipeId], references: [id])
  ingredient Ingredient @relation(fields: [ingredientId], references: [id])

  @@map("RecipeIngredient")
  @@index([recipeId])
  @@index([ingredientId])
  @@schema("mysql")
}

// MongoDB 모델
model EventLog {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  type        Int
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
  userId    BigInt
  role      Int
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
  id                    String @id @default(auto()) @map("_id") @db.ObjectId
  userId                BigInt @unique
  ingredients           Json?
  favoriteIngredientIds Json?

  @@map("UserIngredient")
  @@schema("mongodb")
}
```

### 3.3 Prisma Service 구현
```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as PrismaMySQLClient } from '@prisma/client/mysql';
import { PrismaClient as PrismaMongoClient } from '@prisma/client/mongodb';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  mysql: PrismaMySQLClient;
  mongo: PrismaMongoClient;

  constructor() {
    // MySQL 클라이언트
    this.mysql = new PrismaMySQLClient({
      log: ['query', 'error', 'warn'],
      datasources: {
        mysql: {
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
    await this.mysql.$connect();
    await this.mongo.$connect();
  }

  async onModuleDestroy() {
    await this.mysql.$disconnect();
    await this.mongo.$disconnect();
  }

  // 읽기 전용 복제본 연결 (선택적)
  async getReadReplica() {
    return new PrismaMySQLClient({
      datasources: {
        mysql: {
          url: process.env.DATABASE_READ_REPLICA_URL,
        },
      },
    });
  }
}
```

### 3.4 Repository 패턴 구현
```typescript
// repositories/mysql/recipe.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { Prisma, Recipe } from '@prisma/client';

@Injectable()
export class RecipeRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: bigint, useReplica = true): Promise<Recipe | null> {
    const client = useReplica 
      ? await this.prisma.getReadReplica() 
      : this.prisma.mysql;

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
    return this.prisma.mysql.recipe.create({
      data,
    });
  }

  async createWithIngredients(
    recipeData: Prisma.RecipeCreateInput,
    ingredients: Array<{ ingredientId: bigint; amount?: number; unit?: string }>
  ): Promise<Recipe> {
    return this.prisma.mysql.$transaction(async (tx) => {
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
    ingredientIds?: bigint[];
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
- **MySQL (via Prisma)**: 정규화된 관계형 데이터, ACID 보장 필요 데이터
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
   - MySQL, MongoDB 스키마 정의
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
- `@@schema("mysql")`, `@@schema("mongodb")` 디렉티브로 구분
- 각 모델에 명시적으로 스키마 지정 필요

### 7.2 타입 안정성
- Prisma Client는 TypeScript 타입을 자동 생성
- `Prisma.RecipeCreateInput` 등의 타입을 DTO에 재사용 가능
- 컴파일 타임에 스키마 변경 감지

### 7.3 마이그레이션
- MongoDB는 마이그레이션 미지원 (스키마리스)
- MySQL만 `prisma migrate` 사용
- Production에서는 `prisma migrate deploy` 사용

### 7.4 성능 모니터링
```typescript
// Prisma 쿼리 로깅 및 메트릭
this.mysql.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
  
  return result;
});
```

---

이 명세서를 기반으로 Prisma를 활용한 타입 안전하고 성능 최적화된 백엔드를 구현하세요. 테스트 커버리지 80% 이상을 유지하고, 모든 외부 의존성에 대해 서킷 브레이커를 적용하세요.