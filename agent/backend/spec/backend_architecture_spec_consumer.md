# Consumer 패키지 명세 (@mealio/consumer)

백엔드 아키텍처 명세의 일부이다. 공통 규칙·경로 표기·다른 패키지 명세는 `backend_architecture_spec.md`에 정의되어 있다.

---

**역할**: Kafka 이벤트 수신, 비동기 처리, OpenAI·저장·로그. PostgreSQL은 Prisma, MongoDB는 Mongoose.

## 2.1 파일·디렉터리 명세 (server/consumer/src/)

패키지 루트: `server/consumer/`. 경로 표기 규칙은 `backend_architecture_spec.md`와 동일하다.

**구조 원칙**: `consumers/` 하위에 **consumer_name** 폴더(user-events, activity-events, cache-invalidation, chatbot-request, recipe-generation)를 두고, 각 폴더에 `{consumer_name}.processor.ts`, `{consumer_name}.module.ts`, `{consumer_name}.consumer.ts`를 둔다.

| 경로 | 역할 |
|------|------|
| **server/consumer/src/config/** | 설정 모듈 디렉터리 |
| server/consumer/src/config/consumer-groups.ts | Kafka consumer 그룹 ID 상수 (CONSUMER_GROUPS, §2.2 그룹과 매핑) |
| server/consumer/src/config/env.validation.ts | 앱 시작 시 환경 변수 검증 (Joi 스키마, NODE_ENV·MONGODB_URL·REDIS_URL·KAFKA_*·POSTGRESQL_URL·OPENAI_* 등) |
| server/consumer/src/config/mongoose-pool.config.ts | Mongoose 커넥션 풀 설정 (MongooseSchemasModule.forRoot 주입용) |
| server/consumer/src/config/prisma-pool.config.ts | Prisma 커넥션 풀 설정 (PRISMA_POOL_CONFIG 주입용) |
| **server/consumer/src/consumers/consumers.module.ts** | 그룹 모듈(RecipeGeneration, ChatbotRequest, UserEvents, ActivityEvents, CacheInvalidation) 통합 |
| **server/consumer/src/consumers/base/** | |
| server/consumer/src/consumers/base/base.processor.ts | 토픽 공통 인터페이스(ITopicProcessor)·BaseTopicProcessor(파싱·재시도·DLQ 위임) |
| server/consumer/src/consumers/base/base.consumer.ts | 단일 consumer 인스턴스 connect/subscribe/run/disconnect 공통 로직 (BaseConsumerRunner) |
| server/consumer/src/consumers/base/retry.strategy.ts | 재시도 전략 (지수 백오프) |
| **server/consumer/src/consumers/recipe-generation/** | |
| server/consumer/src/consumers/recipe-generation/recipe-generation.processor.ts | 레시피 생성 processor (파싱·비즈니스·DLQ). 토픽 §2.2 |
| server/consumer/src/consumers/recipe-generation/recipe-generation.module.ts | 그룹 모듈 정의 |
| server/consumer/src/consumers/recipe-generation/recipe-generation.consumer.ts | 해당 토픽 구독·디스패치. 토픽 §2.2 |
| **server/consumer/src/consumers/chatbot-request/** | 토픽 §2.2 chatbot-requests |
| server/consumer/src/consumers/chatbot-request/chatbot-request.processor.ts | 해당 토픽 processor |
| server/consumer/src/consumers/chatbot-request/chatbot-request.module.ts | 그룹 모듈 정의 |
| server/consumer/src/consumers/chatbot-request/chatbot-request.consumer.ts | 해당 토픽 구독. 토픽 §2.2 |
| server/consumer/src/consumers/chatbot-request/handlers/ProcessChatHandler.ts | GPT Function Calling·스트리밍, tool_calls 디스패치, Redis ChatbotStreamEvent 발행. 턴 성공 종료 직전 `ChatbotCreditService.debitForCompletedChatbotTurn`으로 멱등 크레딧 차감 후 `done` 이벤트에 `isCreditDepleted` 포함 |
| server/consumer/src/consumers/chatbot-request/services/chatbot-credit.service.ts | 챗봇 턴 완료 시 Prisma 트랜잭션으로 `chatbot_credit_deductions`(streamChannelId PK) 멱등 삽입·`User.creditBalance` 차감·차감 크레딧 기록. `@mealio/shared`의 `computeChatbotCreditCost` 사용. 신규 차감 시 `cache-invalidation`(USER_PROFILE) 토픽 발행 |
| server/consumer/src/consumers/chatbot-request/services/chatbot-credit.service.spec.ts | ChatbotCreditService 단위 테스트 |
| server/consumer/src/consumers/chatbot-request/handlers/InventoryHandler.ts | get_user_inventory — Inventory 조회(`ingredients.owned`, `ingredients.favorite`, `recipes.favorite`), Ingredient id→name(Redis 캐시) 반환 |
| server/consumer/src/consumers/chatbot-request/handlers/SearchRecipesHandler.ts | search_recipes — Prisma 레시피 검색, ingredientIds optional, RecipeSummary[] 반환 |
| server/consumer/src/consumers/chatbot-request/handlers/SaveChatLogHandler.ts | 스트림 종료 후 ChatbotLog 저장 |
| server/consumer/src/consumers/chatbot-request/handlers/SyncConversationMetaHandler.ts | 성공 턴 후 `chatbot_conversations` 동기화: `chatbot.start`면 LLM 제목·메타 생성, `chatbot.message`면 `updatedAt` 갱신 |
| server/consumer/src/persistence/repositories/mongodb/chatbot-conversation.repository.ts | ChatbotConversation 메타 (`createWithTitle` 생성·제목 없는 스텁 보정, `chatbot.message` 시 `touchUpdatedAt`) |
| server/consumer/src/consumers/chatbot-request/tools/chatbot-tools.definition.ts | OpenAI tools 배열 (search_recipes, get_user_inventory 등) |
| server/consumer/src/consumers/chatbot-request/tools/tool-dispatcher.ts | function name → Handler 매핑·실행 |
| server/consumer/src/consumers/chatbot-request/context/conversation.manager.ts | 대화 히스토리 — buildMessagesForGpt, PreviousTurn, 시스템 프롬프트. 상세 §2.3 |
| **server/consumer/src/consumers/user-events/** | 토픽 §2.2 user-events |
| server/consumer/src/consumers/user-events/user-events.processor.ts | 해당 토픽 processor |
| server/consumer/src/consumers/user-events/user-events.module.ts | 그룹 모듈 정의 (CacheInvalidationModule import) |
| server/consumer/src/consumers/user-events/user-events.consumer.ts | 해당 토픽 구독. 토픽 §2.2 |
| server/consumer/src/consumers/user-events/handlers/UpdateUserProfileHandler.ts | 프로필 업데이트 (User.nickname), 캐시 무효화 요청 |
| server/consumer/src/consumers/user-events/handlers/UpdateInventoryHandler.ts | Inventory 갱신(보유/관심 재료 + 관심 레시피), RecipeStats 좋아요 반영, 캐시 무효화 요청 |
| server/consumer/src/consumers/user-events/services/recipe-stats-updater.service.ts | RECIPE_FAVORITES_ADD/REMOVE 이벤트를 RecipeStats upsert·증감으로 반영 |
| server/consumer/src/consumers/user-events/handlers/TrackUserActivityHandler.ts | EventLog 저장 |
| server/consumer/src/consumers/user-events/handlers/RecommendationHandler.ts | 추천 갱신 |
| **server/consumer/src/consumers/activity-events/** | 토픽 §2.2 activity-events |
| server/consumer/src/consumers/activity-events/activity-events.processor.ts | 해당 토픽 processor, EventLog 저장 |
| server/consumer/src/consumers/activity-events/activity-events.module.ts | 그룹 모듈 정의 (MongooseModule EventLog, EventLogRepository) |
| server/consumer/src/consumers/activity-events/activity-events.consumer.ts | 해당 토픽 구독. 토픽 §2.2 |
| **server/consumer/src/consumers/cache-invalidation/** | 토픽 §2.2 cache-invalidation |
| server/consumer/src/consumers/cache-invalidation/cache-invalidation.processor.ts | 해당 토픽 processor, RedisInvalidationHandler 실행 |
| server/consumer/src/consumers/cache-invalidation/cache-invalidation.module.ts | 그룹 모듈 정의 (KafkaModule, RedisModule, RequestService·RedisHandler, RequestService export) |
| server/consumer/src/consumers/cache-invalidation/cache-invalidation.consumer.ts | 해당 토픽 구독. 토픽 §2.2 |
| server/consumer/src/consumers/cache-invalidation/cache-invalidation-request.service.ts | requestUserProfileInvalidation / requestInventoryInvalidation / requestRecipeInvalidation — 토픽 발행 |
| server/consumer/src/consumers/cache-invalidation/redis-invalidation.handler.ts | Redis 키 삭제 (user:{userId}, inventory:{userId}, recipe:{id}) + recipe:list/search 패턴 삭제 |
| **server/consumer/src/integrations/kafka/** | |
| server/consumer/src/integrations/kafka/kafka.service.ts | Consumer 인스턴스 생성 (getConsumer) |
| server/consumer/src/integrations/kafka/kafka-producer.service.ts | Consumer 내부 토픽 발행 (connect/disconnect, emit). 토픽 §2.2 |
| **server/consumer/src/integrations/openai/** | |
| server/consumer/src/integrations/openai/openai.service.ts | GPT API 래퍼 |
| server/consumer/src/integrations/openai/response-parser.ts | JSON 파싱·검증 |
| server/consumer/src/integrations/openai/rate-limiter.ts | API 호출 제한 |
| **server/consumer/src/integrations/storage/** | |
| server/consumer/src/integrations/storage/s3-uploader.service.ts | 대용량 이미지 업로드 |
| server/consumer/src/integrations/storage/image-optimizer.ts | 이미지 리사이징/압축 |
| **server/consumer/src/integrations/analytics/** | |
| server/consumer/src/integrations/analytics/google-analytics.service.ts | GA 연동 |
| server/consumer/src/integrations/analytics/sentry.service.ts | 에러 리포팅 |
| **server/consumer/src/processing/batch/** | |
| server/consumer/src/processing/batch/recipe-enrichment/nutrition.calculator.ts | 영양 계산 |
| server/consumer/src/processing/batch/recipe-enrichment/tag.generator.ts | 태그 생성 |
| server/consumer/src/processing/batch/user-analytics/preference.analyzer.ts | 선호도 분석 |
| server/consumer/src/processing/batch/user-analytics/activity.aggregator.ts | 활동 집계 |
| server/consumer/src/processing/batch/recommendation/collaborative-filter.ts | 협업 필터 |
| server/consumer/src/processing/batch/recommendation/content-based-filter.ts | 콘텐츠 기반 필터 |
| **server/consumer/src/processing/validation/** | |
| server/consumer/src/processing/validation/schema.validator.ts | 이벤트 스키마 검증 |
| server/consumer/src/processing/validation/business-rule.validator.ts | 비즈니스 규칙 검증 |
| **server/consumer/src/processing/transformation/** | |
| server/consumer/src/processing/transformation/event.transformer.ts | 이벤트 변환 |
| server/consumer/src/processing/transformation/data.normalizer.ts | 데이터 정규화 |
| **server/consumer/src/persistence/repositories/postgresql/** | |
| server/consumer/src/persistence/repositories/postgresql/recipe.repository.ts | Recipe 쓰기 (Prisma) |
| server/consumer/src/persistence/repositories/postgresql/user.repository.ts | User 업데이트 (Prisma) |
| server/consumer/src/persistence/repositories/postgresql/recipe-ingredient.repository.ts | RecipeIngredient 쓰기 |
| **server/consumer/src/persistence/repositories/mongodb/** | |
| server/consumer/src/persistence/repositories/mongodb/event-log.repository.ts | EventLog 저장 (Mongoose) |
| server/consumer/src/persistence/repositories/mongodb/chatbot-log.repository.ts | ChatbotLog 저장 (Mongoose) |
| server/consumer/src/persistence/repositories/mongodb/inventory.repository.ts | Inventory 저장 (Mongoose) |
| **server/consumer/src/persistence/transactions/** | |
| server/consumer/src/persistence/transactions/recipe-creation.transaction.ts | Prisma $transaction |
| server/consumer/src/persistence/transactions/mongodb-session.transaction.ts | Mongoose session (필요 시) |
| server/consumer/src/persistence/transactions/saga.coordinator.ts | 분산 트랜잭션 (RDB↔NoSQL) |
| **server/consumer/src/persistence/bulk-operations/postgresql/** | |
| server/consumer/src/persistence/bulk-operations/postgresql/batch-create.service.ts | Prisma createMany |
| server/consumer/src/persistence/bulk-operations/postgresql/batch-update.service.ts | Prisma updateMany |
| server/consumer/src/persistence/bulk-operations/postgresql/upsert.service.ts | Prisma upsert |
| **server/consumer/src/persistence/bulk-operations/mongodb/** | |
| server/consumer/src/persistence/bulk-operations/mongodb/bulk-write.service.ts | bulkWrite/insertMany |
| server/consumer/src/persistence/bulk-operations/mongodb/update-many.service.ts | updateMany/updateOne |
| server/consumer/src/persistence/bulk-operations/mongodb/findOneAndUpdate.service.ts | findOneAndUpdate(upsert) |
| **server/consumer/src/reliability/retry/** | |
| server/consumer/src/reliability/retry/exponential-backoff.ts | 지수 백오프 |
| server/consumer/src/reliability/retry/circuit-breaker.ts | OpenAI 서킷 브레이커 |
| **server/consumer/src/reliability/idempotency/** | |
| server/consumer/src/reliability/idempotency/idempotent.decorator.ts | 멱등성 보장 |
| server/consumer/src/reliability/idempotency/deduplication.service.ts | 중복 이벤트 필터링 |
| **server/consumer/src/reliability/monitoring/** | |
| server/consumer/src/reliability/monitoring/consumer-lag.monitor.ts | Kafka lag |
| server/consumer/src/reliability/monitoring/error-rate.monitor.ts | 에러율 |
| server/consumer/src/reliability/monitoring/throughput.monitor.ts | 처리량 |
| **server/consumer/src/reliability/dead-letter/** | |
| server/consumer/src/reliability/dead-letter/dlq.handler.ts | DLQ 처리 |
| server/consumer/src/reliability/dead-letter/manual-replay.service.ts | 수동 재처리 |

---

## 2.2 Kafka 토픽 명세

토픽·DLQ 상수는 `@mealio/shared`의 `KAFKA_TOPICS`, `KAFKA_DLQ_TOPICS`에 정의되어 있으며, Producer의 KafkaAdminService가 로컬 환경에서 메인·DLQ 토픽을 생성한다.

| 토픽 (메인) | DLQ 토픽 | Consumer 그룹 | 발행 주체 | 용도·페이로드 개요 |
|-------------|-----------|----------------|-----------|---------------------|
| **recipe-generation** | recipe-generation-dlq | recipe-generation-group | Producer (API 연동 시) | 레시피 생성 요청. 추후 이미지·재료 기반 생성 요청 payload. Processor: stub → GenerateRecipeHandler 등 연동 예정. |
| **chatbot-requests** | chatbot-requests-dlq | chatbot-group | Producer (POST /api/v1/chatbot/messages 등) | 챗봇 메시지 요청. payload: userId, message, conversationId?, streamChannelId. Consumer: ProcessChatHandler(GPT·tool call), SaveChatLogHandler(ChatbotLog 저장), `chatbot.start`·`chatbot.message` 성공 후 SyncConversationMetaHandler(대화 메타 동기화), Redis 스트림 이벤트 발행. 성공 턴 완료 시 ChatbotCreditService로 멱등 크레딧 차감·`done.data.isCreditDepleted` 반영, 차감 시 내부적으로 **cache-invalidation**(USER_PROFILE) 발행. |
| **activity-events** | activity-events-dlq | activity-events-group | Producer (레시피 조회/좋아요/공유, 검색 API 등) | 비로그인 포함 활동 이벤트. payload: type(recipe.view \| recipe.like \| recipe.share \| search.query \| search.click), actor(type, userId?, ipAddress?, userAgent?), entity?, payload?, metadata?. Consumer: EventLog 저장. |
| **user-events** | user-events-dlq | analytics-group | Producer (닉네임 변경, 재료 CRUD, 관심 레시피 추가/삭제 등) | 로그인 유저 도메인 이벤트. payload: UserEvent \| InventoryEvent. Consumer: UpdateUserProfileHandler, UpdateInventoryHandler, TrackUserActivityHandler(EventLog), RecommendationHandler, 캐시 무효화 요청(CacheInvalidationRequestService). |
| **cache-invalidation** | cache-invalidation-dlq | cache-invalidation-group | Consumer 내부 (CacheInvalidationRequestService) | 캐시 무효화 지시. payload: type(USER_PROFILE \| INVENTORY \| RECIPE), userId 또는 recipeIds[]. Handler가 직접 발행하지 않고 RequestService가 발행. Consumer: RedisInvalidationHandler로 Redis 키/패턴 삭제. |

**공통**

- **재시도·DLQ**: 각 Processor는 BaseTopicProcessor를 상속하며, 처리 실패 시 재시도 후 실패 메시지는 해당 토픽의 DLQ로 전달한다.
- **파티션 키**: 순서 보장이 필요한 토픽(예: chatbot-requests의 conversationId, cache-invalidation의 userId)은 발행 시 key를 지정하여 동일 키가 같은 파티션으로 가도록 한다.

---

## 2.3 챗봇 모듈: 대화 히스토리 컨텍스트 처리

- **conversation.manager**: `consumers/chatbot-request/context/conversation.manager.ts` — `buildMessagesForGpt(previousTurns, newUserMessage)`로 GPT용 메시지 배열 생성(시스템 프롬프트 + 이전 턴 + 새 사용자 메시지).
- **ProcessChatHandler**: `consumers/chatbot-request/handlers/ProcessChatHandler.ts` — GPT 호출 전 위 함수를 호출해 `messages`를 얻어 OpenAI API에 전달. 이전 턴은 ChatbotLog에서 `conversationId`(context.conversationId) 기준으로 조회해 공급할 수 있음(확장 시).
- 대화 히스토리 규칙·저장소·조회 설계·토큰 제한은 `../guidelines/backend_development_guidelines.md` §5.4에 정의되어 있다.

---

## 2.4 챗봇 크레딧 멱등 차감 및 스트림 `done` 계약

- **모델·상수**: `@mealio/shared` Prisma `User.creditBalance` / `User.creditMonthlyLimit`, `ChatbotCreditDeduction`(테이블 `chatbot_credit_deductions`, PK `stream_channel_id`). 비용 계산·기본 정책 상수는 `server/shared/src/constants/user-credits.ts`(`computeChatbotCreditCost`, `DEFAULT_USER_CREDIT_*` 등).
- **ChatbotCreditService** (`consumers/chatbot-request/services/chatbot-credit.service.ts`): 동일 `streamChannelId`에 대해 `createMany` + `skipDuplicates`로 멱등 슬롯 확보 후, `usage.totalTokens` 기반 비용만큼 `creditBalance`를 감소(잔액 상한 클램프). 재처리 시 이중 차감 없음. 신규 차감이 발생한 경우에만 `KafkaProducerService`로 **cache-invalidation** 토픽(USER_PROFILE)을 발행해 Producer 캐시와 정합을 맞춘다.
- **ProcessChatHandler**: Redis `done` 이벤트(`@mealio/shared` 타입 `ChatbotStreamDoneEvent`)의 `data.isCreditDepleted`에 차감 결과를 넣어 클라이언트가 잔액 소진 여부를 알 수 있게 한다.

---

## 2.5 캐시 무효화 흐름 (user-events → cache-invalidation)

- 토픽·발행 주체·수신·Redis 삭제 동작은 §2.2 표의 **cache-invalidation** 행과 동일하다.
- **모듈 의존성**: UserEventsModule이 CacheInvalidationModule을 import하여 Handler에서 CacheInvalidationRequestService를 주입받는다.
- **챗봇 크레딧 차감**: UserEvents 경로 외에, `ChatbotCreditService`가 크레딧이 실제로 차감된 경우 동일 토픽으로 USER_PROFILE 무효화를 발행할 수 있다(§2.4).
- **일관성**: Producer의 Cache-Aside 캐시와 동일 Redis를 사용하므로, 무효화 후 다음 조회 시 DB 폴백이 이루어진다.

---

Function Calling 기반 챗봇 흐름·설계 원칙은 `../guidelines/backend_development_guidelines.md` §5에 정의되어 있다.
