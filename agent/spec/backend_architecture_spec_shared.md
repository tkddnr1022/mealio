# Shared 패키지 명세 (@cook/shared)

백엔드 아키텍처 명세의 일부이다. 공통 규칙·경로 표기·다른 패키지 명세는 `backend_architecture_spec.md`에 정의되어 있다.

---

**패키지명**: `@cook/shared`. **위치**: `server/shared`. **역할**: Producer/Consumer 공통 설정·상수·DB(Prisma/Mongoose)·Redis·타입 제공.

## 3.1 파일·디렉터리 명세 (server/shared/)

패키지 루트: `server/shared/`. 경로 표기 규칙은 `backend_architecture_spec.md`와 동일하다.

| 경로 | 역할 |
|------|------|
| server/shared/package.json | name: "@cook/shared", exports: ".", "./prisma-client" |
| server/shared/src/index.ts | 공개 API re-export |
| server/shared/src/configs/kafka.config.ts | createKafkaConfig, LOCAL_TOPIC_CONFIG |
| server/shared/src/configs/mongoose.config.ts | mongooseConfig (MongoDB 연결) |
| server/shared/src/configs/redis.config.ts | createRedisConfig |
| server/shared/src/constants/kafka-topics.ts | KAFKA_TOPICS, KafkaTopic |
| server/shared/src/constants/redis-channels.ts | getChatbotStreamChannel, CHATBOT_STREAM_CHANNEL_PREFIX |
| server/shared/src/constants/cache-keys.ts | CACHE_KEY_PREFIX (USER, USER_INGREDIENT). Producer 캐시 전략·Consumer 캐시 무효화에서 공통 사용 |
| server/shared/src/database/prisma/schema.prisma | PostgreSQL 스키마 (User, Recipe, Ingredient, RecipeIngredient) |
| server/shared/src/database/prisma/prisma.service.ts | PrismaService (NestJS, OnModuleInit/OnModuleDestroy) |
| server/shared/src/database/prisma/prisma.module.ts | PrismaModule |
| server/shared/src/database/prisma/generated/ | prisma generate 결과 (커밋 제외) |
| server/shared/src/database/prisma/migrations/ | PostgreSQL 마이그레이션 |
| server/shared/src/database/mongoose/schemas/* | ChatbotLog, EventLog, UserIngredient 스키마 |
| server/shared/src/redis/redis.service.ts | RedisService (NestJS). get/set/setex/del/exists/expire/ttl, 구독 채널 관리 |
| server/shared/src/redis/redis.module.ts | RedisModule |
| server/shared/src/types/events/* | ChatbotRequestEvent, ChatbotStreamEvent, UserEvent, UserIngredientEvent, CacheInvalidationPayload·CacheInvalidationEventType 등 |

## 3.2 Prisma 스키마 (schema.prisma) — 모델·필드 명세

**디렉터리**: `server/shared/src/database/prisma/`. **파일**: `server/shared/src/database/prisma/schema.prisma`, `server/shared/src/database/prisma/migrations/`.

| 모델 | 필드 | 비고 |
|------|------|------|
| User | id, email, nickname, platformName, platformId, createdAt, updatedAt | @@index(platformName, platformId), (email), (createdAt) |
| Recipe | id, title, description?, instructions(Json), difficulty, cookTime, imageUrl?, servings, viewCount, isPublished, createdAt, updatedAt | recipeIngredients 관계. @@index(difficulty, cookTime, createdAt), (createdAt Desc) |
| Ingredient | id, name, category, createdAt | recipeIngredients 관계. @@index(category, name) |
| RecipeIngredient | id, recipeId, ingredientId, amount?, unit?, isOptional | recipe, ingredient 관계. @@unique(recipeId, ingredientId), @@index(recipeId), (ingredientId) |

datasource: `postgresql`. generator: `prisma-client`, output `generated`.

## 3.3 사용 방식 (정형)

- **Producer/Consumer import**: `import { PrismaModule, RedisService, KAFKA_TOPICS, ... } from '@cook/shared'`
- **Prisma 타입/클라이언트**: `import { Recipe, Prisma } from '@cook/shared/prisma-client'`
- **빌드 순서**: shared 빌드(`prisma generate` + `tsc`) → Producer/Consumer 빌드
- **환경 변수·모노레포·빌드·데이터소스 주의사항**: `../guidelines/backend_development_guidelines.md` §6(환경 변수), §8(모노레포·빌드), §9(데이터베이스별 주의사항)에 정의되어 있다.

## 3.4 공유 라이브러리 확장

| 경로 | 역할 |
|------|------------|
| server/shared/src/utils/ | logger, error-handler, prisma-helpers, mongoose-helpers, validator |
| server/shared/src/constants/ | cache-keys.ts (CACHE_KEY_PREFIX), error-codes.ts (3.1의 kafka-topics, redis-channels 외 추가) |
| server/shared/src/configs/ | observability.config.ts (3.1의 kafka, mongoose, redis 외 추가) |
