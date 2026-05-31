# Shared 패키지 명세 (@mealio/shared)

백엔드 아키텍처 명세의 일부이다. 공통 규칙·경로 표기·다른 패키지 명세는 `backend_architecture_spec.md`에 정의되어 있다.

---

**패키지명**: `@mealio/shared`. **위치**: `server/shared`. **역할**: Producer/Consumer 공통 설정·상수·DB(Prisma/Mongoose)·Redis·타입 제공.

## 3.1 파일·디렉터리 명세 (server/shared/)

패키지 루트: `server/shared/`. 경로 표기 규칙은 `backend_architecture_spec.md`와 동일하다.

| 경로 | 역할 |
|------|------|
| server/shared/package.json | name: "@mealio/shared", exports: ".", "./prisma-client" |
| server/shared/src/index.ts | 공개 API re-export |
| server/shared/src/configs/kafka.config.ts | createKafkaConfig, LOCAL_TOPIC_CONFIG |
| server/shared/src/configs/redis.config.ts | createRedisConfig |
| server/shared/src/constants/kafka-topics.ts | KAFKA_TOPICS, KafkaTopic |
| server/shared/src/constants/redis-channels.ts | getChatbotStreamChannel, CHATBOT_STREAM_CHANNEL_PREFIX |
| server/shared/src/constants/cache-keys.ts | CACHE_KEY_PREFIX. Producer 캐시 전략·Consumer 캐시 무효화에서 공통 사용 (`recommendation:{userId}` 키 포함) |
| server/shared/src/constants/asset-url-prefixes.ts | ASSET_URL_PREFIX (RECIPE_IMAGE, INGREDIENT_CATEGORY_ICON). 레시피 이미지/재료 카테고리 아이콘 URL prefix 공통 사용 |
| server/shared/src/constants/user-credits.ts | 챗봇 크레딧 정책: `DEFAULT_USER_CREDIT_BALANCE`, `DEFAULT_USER_CREDIT_MONTHLY_LIMIT`, `TOKENS_PER_CREDIT`, `computeChatbotCreditCost`. 신규 `User` 초기 잔액·시드·Producer `UserRepository.create`와 동일 기준. `@mealio/shared`의 `index.ts`에서 re-export |
| server/shared/src/database/prisma/schema.prisma | PostgreSQL 스키마 (User·크레딧 필드·ChatbotCreditDeduction, RecipeCategory, Recipe, RecipeStats, IngredientCategory, Ingredient, RecipeIngredient, UserRecipeRecommendation) |
| server/shared/src/database/prisma/seed.ts | 로컬/개발용 시드 스크립트. `User` 삽입 시 `user-credits` 상수로 `credit_balance`·`credit_monthly_limit` 설정 |
| server/shared/src/database/prisma/prisma-pool.config.ts | PrismaPoolConfig 타입, PRISMA_POOL_CONFIG DI 토큰 (커넥션 풀 설정용). PrismaService·PrismaModule에서 참조 |
| server/shared/src/database/prisma/prisma.service.ts | PrismaService (NestJS, OnModuleInit/OnModuleDestroy, PrismaPg 어댑터. PRISMA_POOL_CONFIG 주입) |
| server/shared/src/database/prisma/prisma.module.ts | PrismaModule. forRoot(config) / forRootAsync({ useFactory }) 로 connection pool config 주입. Producer/Consumer에서 import 시 config 전달 |
| server/shared/src/database/prisma/generated/ | prisma generate 결과 (커밋 제외) |
| server/shared/src/database/prisma/migrations/ | PostgreSQL 마이그레이션 |
| server/shared/src/database/mongoose/mongoose-pool.config.ts | MongoosePoolConfig 타입 (커넥션 풀 설정). 앱에서는 풀만 정의, URI·retry·readPreference 등은 shared 공용 |
| server/shared/src/database/mongoose/mongoose.module.ts | MongooseSchemasModule. forRoot(poolConfig) / forRootAsync 로 풀 config 주입. URI·스키마(EventLog, ChatbotLog, Inventory)는 shared에서 공용 관리 |
| server/shared/src/database/mongoose/schemas/index.ts | Mongoose 스키마 배럴 export |
| server/shared/src/database/mongoose/schemas/chatbot-log.schema.ts | ChatbotLog 스키마 |
| server/shared/src/database/mongoose/schemas/chatbot-conversation.schema.ts | ChatbotConversation 스키마 |
| server/shared/src/database/mongoose/schemas/event-log.schema.ts | EventLog 스키마 |
| server/shared/src/database/mongoose/schemas/inventory.schema.ts | Inventory 스키마 (`ingredients.ownedIds`, `ingredients.favoriteIds`, `recipes.favoriteIds` 포함) |
| server/shared/src/database/mongoose/schemas/kpi-rollup.schema.ts | KPI 롤업 집계 문서 스키마 |
| server/shared/src/database/mongoose/schemas/recipe-ingestion-job.schema.ts | Recipe ingestion job 파이프라인 SSOT 스키마 |
| server/shared/src/database/mongoose/schemas/recipe-ingestion-state.schema.ts | Recipe ingestion API 페이징 커서 singleton 스키마 |
| server/shared/src/constants/recipe-ingestion.ts | Recipe ingestion status enum·재시도 상한·state key 상수 |
| server/shared/src/redis/redis.service.ts | RedisService (NestJS). get/set/setex/del/exists/expire/ttl, 구독 채널 관리 |
| server/shared/src/redis/redis.module.ts | RedisModule |
| server/shared/src/types/events/index.ts | 이벤트 타입 배럴 export |
| server/shared/src/types/events/chatbot-request.event.ts | ChatbotRequestEvent |
| server/shared/src/types/events/chatbot-stream-event.event.ts | ChatbotStreamEvent (`done`에 `isCreditDepleted` 포함) |
| server/shared/src/types/events/user-event.event.ts | UserEvent |
| server/shared/src/types/events/inventory-event.event.ts | InventoryEvent (ingredient/recipe favorites 포함) |
| server/shared/src/types/events/activity-event.event.ts | ActivityEvent (recipe.view, recipe.like, search.click 등) |
| server/shared/src/types/events/cache-invalidation.event.ts | CacheInvalidationPayload·CacheInvalidationEventType (`RECOMMENDATION` 포함) |

## 3.2 Prisma 스키마 (schema.prisma) — 모델·필드 명세

**디렉터리**: `server/shared/src/database/prisma/`. **파일**: `server/shared/src/database/prisma/schema.prisma`, `server/shared/src/database/prisma/migrations/`.

| 모델 | 필드 | 비고 |
|------|------|------|
| User | id, email, nickname, platformName, platformId, creditBalance(@map credit_balance), creditMonthlyLimit(@map credit_monthly_limit), createdAt, updatedAt | Prisma/DB 기본값은 0(보조). 비즈니스 초기 잔액·한도는 행 생성 시 `DEFAULT_USER_CREDIT_*`로 주입(Producer `UserRepository.create`, 시드). @@index(platformName, platformId), (email), (createdAt) |
| ChatbotCreditDeduction | streamChannelId(@map stream_channel_id, PK), userId, credits, createdAt | 테이블 `chatbot_credit_deductions`. 스트림(요청)당 1행으로 Consumer에서 멱등 차감. `user` 관계(onDelete: Cascade), @@index(userId) |
| RecipeCategory | id, key, name, displayOrder, isActive, createdAt, updatedAt | recipes 관계. @@index(isActive, displayOrder), @unique(key) |
| Recipe | id, categoryId(@map category), title, description?, instructions(Json), difficulty, cookTime, imageUrl?, servings, isPublished, createdAt, updatedAt | categoryMeta(RecipeCategory), recipeIngredients, stats(RecipeStats, 1:1 optional) 관계. @@index(categoryId, difficulty, cookTime, createdAt), @@index(difficulty, cookTime, createdAt), (createdAt Desc) |
| RecipeStats | recipeId(@map recipe_id, PK), viewCount(@map view_count), likeCount(@map like_count), updatedAt(@map updated_at) | recipe(Recipe, onDelete: Cascade). @@index(viewCount desc, recipeId desc), @@index(likeCount desc, recipeId desc) |
| IngredientCategory | id, key, name, displayOrder, isActive, createdAt, updatedAt | ingredients 관계. @@index(isActive, displayOrder), @unique(key) |
| Ingredient | id, name, categoryId(@map category), createdAt | categoryMeta(IngredientCategory), recipeIngredients 관계. @@index(categoryId, name) |
| RecipeIngredient | id, recipeId, ingredientId, amount?, unit?, isOptional | recipe, ingredient 관계. @@unique(recipeId, ingredientId), @@index(recipeId), (ingredientId) |
| UserRecipeRecommendation | id, userId, recipeId, rank, score, reason?, calculatedAt, createdAt, updatedAt | 사용자 추천 SSOT 테이블. user/recipe 관계, @@unique(userId, recipeId), @@unique(userId, rank), @@index(userId, score), @@index(updatedAt) |

datasource: `postgresql`. generator: `prisma-client`, output `generated`.

## 3.3 사용 방식 (정형)

- **Producer/Consumer import**: `import { PrismaModule, MongooseSchemasModule, RedisService, KAFKA_TOPICS, computeChatbotCreditCost, DEFAULT_USER_CREDIT_BALANCE, ... } from '@mealio/shared'`
- **Prisma 타입/클라이언트**: `import { Recipe, Prisma } from '@mealio/shared/prisma-client'`
- **빌드 순서**: shared 빌드(`prisma generate` + `tsc`) → Producer/Consumer 빌드
- **환경 변수·모노레포·빌드·데이터소스 주의사항**: `../guidelines/backend_development_guidelines.md` §7(환경 변수), §9(모노레포·빌드), §10(데이터베이스별 주의사항)에 정의되어 있다.

## 3.4 공유 라이브러리 확장

| 경로 | 역할 |
|------|------------|
| server/shared/src/utils/ | logger, error-handler, prisma-helpers, mongoose-helpers, validator |
| server/shared/src/utils/structured-logger.ts | 구조화 로거 (JSON 출력, 레벨·컨텍스트·Correlation-ID) |
| server/shared/src/utils/correlation-id.ts | Correlation-ID 생성 유틸 |
| server/shared/src/utils/correlation-context.ts | AsyncLocalStorage 기반 Correlation Context 전파 |
| server/shared/src/constants/ | cache-keys.ts, asset-url-prefixes.ts, **user-credits.ts**(챗봇 크레딧 기본값·비용 계산), ⚠️ 미구현: error-codes.ts (3.1의 kafka-topics, redis-channels 외 추가) |
| server/shared/src/configs/ | observability.config.ts, observability.env-validation.ts (3.1의 kafka, redis 외 추가) |
| server/shared/src/configs/observability.config.ts | Sentry DSN·환경·샘플링 등 관측성 설정 |
| server/shared/src/configs/observability.env-validation.ts | 관측성 관련 환경 변수 Joi 스키마 검증 |
| **server/shared/src/observability/** | Sentry 초기화·유틸 묶음 |
| server/shared/src/observability/sentry.ts | Sentry `init` 래퍼 (Producer/Consumer 공용) |
| server/shared/src/observability/sentry-scrub.ts | Sentry 이벤트 전송 전 PII·비밀 스크러빙 |
| server/shared/src/observability/sentry-feature.ts | Sentry 피처 플래그 (환경별 기능 토글) |
| server/shared/src/observability/sentry.constants.ts | Sentry 태그·컨텍스트 키 상수 |

## 3.5 추천 캐시·무효화 계약

맞춤형 레시피 추천 SSOT·E2E는 `backend_architecture_spec.md` §4를 따른다.

| 항목 | 명세 |
|------|------|
| **캐시 키** | `CACHE_KEY_PREFIX.RECOMMENDATION` = `recommendation`. `cacheKeyRecommendation(userId)` → `recommendation:{userId}` (`server/shared/src/constants/cache-keys.ts`) |
| **무효화 타입** | `CacheInvalidationEventType.RECOMMENDATION` (`server/shared/src/types/events/cache-invalidation.event.ts`). payload에 `userId` |
| **Producer TTL** | 3600초 — `recommendation-cache-strategy.ts` (`backend_architecture_spec_producer.md` §1.4) |
| **Consumer 발행** | `CacheInvalidationRequestService.requestRecommendationInvalidation(userId)` → `cache-invalidation` 토픽 |
