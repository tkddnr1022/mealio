# Consumer 패키지 명세 (@mealio/consumer)

백엔드 아키텍처 명세의 일부이다. 공통 규칙·경로 표기·다른 패키지 명세는 `backend_architecture_spec.md`에 정의되어 있다.

---

**역할**: Kafka 이벤트 수신, 비동기 처리, OpenAI·저장·로그. PostgreSQL은 Prisma, MongoDB는 Mongoose.

## 2.1 파일·디렉터리 명세 (server/consumer/src/)

패키지 루트: `server/consumer/`. 경로 표기 규칙은 `backend_architecture_spec.md`와 동일하다.

**구조 원칙**: `consumers/` 하위에 **consumer_name** 폴더(user-events, activity-events, cache-invalidation, chatbot-request)를 두고, 각 폴더에 `{consumer_name}.processor.ts`, `{consumer_name}.module.ts`, `{consumer_name}.consumer.ts`를 둔다.

| 경로 | 역할 |
|------|------|
| **server/consumer/src/config/** | env 검증 |
| server/consumer/src/config/env.validation.ts | 앱 시작 시 환경 변수 검증 (Joi 스키마, APP_ENV·MONGODB_URL·REDIS_URL·KAFKA_*·POSTGRESQL_URL·OPENAI_*·PUBLIC_DATA_*·OPENAI_BATCH_MODEL 등) |
| **server/consumer/src/constants/** | 불변 계약 상수 (`*.constants.ts`) |
| server/consumer/src/constants/consumer-groups.constants.ts | Kafka consumer 그룹 ID (`CONSUMER_GROUPS`, §2.2 그룹과 매핑) |
| **server/consumer/src/policy/** | 운영·제품 튜닝 정책 (`*.policy.ts`) |
| server/consumer/src/policy/mongoose-pool.policy.ts | Mongoose 커넥션 풀 (MongooseSchemasModule.forRoot 주입용) |
| server/consumer/src/policy/prisma-pool.policy.ts | Prisma 커넥션 풀 (PRISMA_POOL_CONFIG 주입용) |
| server/consumer/src/policy/openai.policy.ts | OpenAI RPM 기본값 |
| server/consumer/src/policy/chatbot-cache.policy.ts | 챗봇 Redis 캐시 TTL |
| server/consumer/src/policy/recipe-search.policy.ts | `search_recipes` ANN·Query Expansion·재랭킹 가중치·`reasonSignals` 임계값 |
| server/consumer/src/policy/monitoring.policy.ts | lag 폴링 주기 |
| **server/consumer/src/consumers/consumers.module.ts** | 그룹 모듈(ChatbotRequest, UserEvents, ActivityEvents, CacheInvalidation, RecipeIngestionSubmit, RecipeIngestionPersist) 통합 |
| **server/consumer/src/consumers/base/** | |
| server/consumer/src/consumers/base/base.processor.ts | 토픽 공통 인터페이스(ITopicProcessor)·BaseTopicProcessor(파싱·재시도·DLQ 위임) |
| server/consumer/src/consumers/base/base.consumer.ts | 단일 consumer 인스턴스 connect/subscribe/run/disconnect 공통 로직 (BaseConsumerRunner) |
| server/consumer/src/consumers/base/retry.strategy.ts | 재시도 전략 (지수 백오프) |
| **server/consumer/src/consumers/chatbot-request/** | 토픽 §2.2 chatbot-requests |
| server/consumer/src/consumers/chatbot-request/chatbot-request.processor.ts | 해당 토픽 processor |
| server/consumer/src/consumers/chatbot-request/chatbot-request.module.ts | 그룹 모듈 정의 |
| server/consumer/src/consumers/chatbot-request/chatbot-request.consumer.ts | 해당 토픽 구독. 토픽 §2.2 |
| server/consumer/src/consumers/chatbot-request/handlers/ProcessChatHandler.ts | GPT Function Calling·스트리밍, tool_calls 디스패치, Redis ChatbotStreamEvent 발행. 턴 성공 종료 직전 `ChatbotCreditService.debitForCompletedChatbotTurn`으로 멱등 크레딧 차감 후 `done` 이벤트에 `isCreditDepleted` 포함 |
| server/consumer/src/consumers/chatbot-request/services/chatbot-credit.service.ts | 챗봇 턴 완료 시 Prisma 트랜잭션으로 `chatbot_credit_deductions`(streamChannelId PK) 멱등 삽입·`User.creditBalance` 차감·차감 크레딧 기록. `@mealio/shared`의 `computeChatbotCreditCost` 사용. 신규 차감 시 `cache-invalidation`(USER_PROFILE) 토픽 발행 |
| server/consumer/src/consumers/chatbot-request/handlers/InventoryHandler.ts | get_user_inventory — Inventory 조회(`ingredients.owned`, `ingredients.favorite`, `recipes.favorite`), Ingredient id→name(Redis 캐시) 반환 |
| server/consumer/src/consumers/chatbot-request/handlers/SearchRecipesHandler.ts | search_recipes — semantic-first 후보 수집(pgvector ANN + Query Expansion) 후 hard/soft 제약 기반 재랭킹. 상세 §2.7 |
| server/consumer/src/consumers/chatbot-request/handlers/FinalizeRecipeSelectionHandler.ts | finalize_recipe_selection — 챗봇 추천 레시피 최종 선택·확정 처리 |
| server/consumer/src/consumers/chatbot-request/handlers/FoodCategoriesHandler.ts | get_food_categories — 레시피·재료 카테고리 마스터 조회(Redis 캐시 1시간) |
| server/consumer/src/consumers/chatbot-request/handlers/SaveChatLogHandler.ts | 스트림 종료 후 ChatbotLog 저장 |
| server/consumer/src/consumers/chatbot-request/handlers/SyncConversationMetaHandler.ts | 성공 턴 후 `chatbot_conversations` 동기화: `chatbot.start`면 LLM 제목·메타 생성, `chatbot.message`면 `updatedAt` 갱신 |
| server/consumer/src/consumers/chatbot-request/services/recipe-search-query.service.ts | search_recipes 핸들러용 Prisma 조회 — ANN 후보 `recipeId` 목록에 hard constraint(`isPublished`, 기피 재료) 적용 후 상세 fetch |
| server/consumer/src/consumers/chatbot-request/services/recipe-search-query-expansion.service.ts | search_recipes Query Expansion — 원질의 보존 + LLM 확장 질의 생성(실패 시 원질의 fallback) |
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
| server/consumer/src/consumers/user-events/handlers/RecommendationHandler.ts | 추천 증분 갱신 트리거. 이벤트별 가중치 계산 후 PostgreSQL 추천 SSOT(UserRecipeRecommendation) upsert |
| server/consumer/src/consumers/user-events/services/recommendation-score.service.ts | user-events 기반 추천 점수 계산·랭킹 갱신·top N 재정렬 |
| **server/consumer/src/consumers/activity-events/** | 토픽 §2.2 activity-events |
| server/consumer/src/consumers/activity-events/activity-events.processor.ts | 해당 토픽 processor, EventLog 저장 + 추천 점수 보정 트리거(recipe.view/search.click 등) |
| server/consumer/src/consumers/activity-events/activity-events.module.ts | 그룹 모듈 정의 (MongooseModule EventLog, EventLogRepository) |
| server/consumer/src/consumers/activity-events/activity-events.consumer.ts | 해당 토픽 구독. 토픽 §2.2 |
| server/consumer/src/consumers/activity-events/services/activity-recommendation.service.ts | activity-events 기반 추천 보정(조회/클릭/좋아요 가중치 반영) |
| **server/consumer/src/consumers/cache-invalidation/** | 토픽 §2.2 cache-invalidation |
| server/consumer/src/consumers/cache-invalidation/cache-invalidation.processor.ts | 해당 토픽 processor, RedisInvalidationHandler 실행 |
| server/consumer/src/consumers/cache-invalidation/cache-invalidation.module.ts | 그룹 모듈 정의 (KafkaModule, RedisModule, RequestService·RedisHandler, RequestService export) |
| server/consumer/src/consumers/cache-invalidation/cache-invalidation.consumer.ts | 해당 토픽 구독. 토픽 §2.2 |
| server/consumer/src/consumers/cache-invalidation/cache-invalidation-request.service.ts | requestUserProfileInvalidation / requestInventoryInvalidation / requestRecipeInvalidation / requestRecommendationInvalidation — 토픽 발행 |
| server/consumer/src/consumers/cache-invalidation/redis-invalidation.handler.ts | Redis 키 삭제 (user:{userId}, inventory:{userId}, recipe:{id}, recommendation:{userId}) + recipe:list/search 패턴 삭제 |
| **server/consumer/src/integrations/kafka/** | |
| server/consumer/src/integrations/kafka/kafka.module.ts | KafkaModule (KafkaService·KafkaProducerService 묶음) |
| server/consumer/src/integrations/kafka/kafka.service.ts | Consumer 인스턴스 생성 (getConsumer) |
| server/consumer/src/integrations/kafka/kafka-producer.service.ts | Consumer 내부 토픽 발행 (connect/disconnect, emit). 토픽 §2.2 |
| **server/consumer/src/integrations/openai/** | |
| server/consumer/src/integrations/openai/openai.module.ts | OpenAI 통합 모듈 |
| server/consumer/src/integrations/openai/openai.service.ts | GPT API 래퍼 |
| server/consumer/src/integrations/openai/response-parser.ts | JSON 파싱·검증 |
| server/consumer/src/integrations/openai/rate-limiter.ts | API 호출 제한 |
| server/consumer/src/integrations/openai/openai-batch.service.ts | OpenAI Batch API 래퍼 (recipe ingestion submit/retrieve) |
| **server/consumer/src/integrations/public-data/** | 공공데이터(식품안전) API |
| server/consumer/src/integrations/public-data/public-data.module.ts | PublicData 통합 모듈 |
| server/consumer/src/integrations/public-data/public-data-api.client.ts | 공공데이터 API HTTP 클라이언트 |
| server/consumer/src/integrations/public-data/foodsafety-image-url.util.ts | LLM 이미지 URL 정규화 (persist) |
| **server/consumer/src/integrations/storage/** | ⚠️ 미구현 |
| server/consumer/src/integrations/storage/s3-uploader.service.ts | ⚠️ 미구현 · 대용량 이미지 업로드 |
| server/consumer/src/integrations/storage/image-optimizer.ts | ⚠️ 미구현 · 이미지 리사이징/압축 |
| **server/consumer/src/integrations/analytics/** | |
| server/consumer/src/integrations/analytics/analytics.module.ts | Analytics 통합 모듈 |
| server/consumer/src/integrations/analytics/google-analytics.service.ts | ⚠️ 미구현 · GA 연동 |
| server/consumer/src/integrations/analytics/sentry.service.ts | 에러 리포팅 |
| **server/consumer/src/processing/validation/** | |
| server/consumer/src/processing/validation/schema.validator.ts | 이벤트 스키마 검증 |
| server/consumer/src/processing/validation/business-rule.validator.ts | 비즈니스 규칙 검증 |
| **server/consumer/src/processing/transformation/** | |
| server/consumer/src/processing/transformation/event.transformer.ts | 이벤트 변환 |
| server/consumer/src/processing/transformation/data.normalizer.ts | 데이터 정규화 |
| **server/consumer/src/persistence/repositories/postgresql/** | |
| server/consumer/src/persistence/repositories/postgresql/recipe.repository.ts | Recipe 쓰기 (Prisma) |
| server/consumer/src/persistence/repositories/postgresql/ingredient.repository.ts | Ingredient 조회 (persist·매칭) |
| server/consumer/src/persistence/repositories/postgresql/user.repository.ts | User 업데이트 (Prisma) |
| server/consumer/src/persistence/repositories/postgresql/recipe-ingredient.repository.ts | ⚠️ 미구현 · RecipeIngredient 쓰기 |
| server/consumer/src/persistence/repositories/postgresql/recommendation.repository.ts | UserRecipeRecommendation upsert·랭크 재정렬·top N 조회 |
| server/consumer/src/persistence/repositories/postgresql/recipe-embedding.repository.ts | RecipeEmbedding(pgvector) raw query — 업서트·전체 코퍼스 ANN `searchTopK`(published·기피 재료 ID hard exclude) |
| **server/consumer/src/persistence/repositories/mongodb/** | |
| server/consumer/src/persistence/repositories/mongodb/event-log.repository.ts | EventLog 저장 (Mongoose) |
| server/consumer/src/persistence/repositories/mongodb/chatbot-log.repository.ts | ChatbotLog 저장 (Mongoose) |
| server/consumer/src/persistence/repositories/mongodb/inventory.repository.ts | Inventory 저장 (Mongoose) |
| server/consumer/src/persistence/repositories/mongodb/recipe-ingestion-job.repository.ts | Recipe ingestion job CRUD·상태 전환 (Mongoose) |
| server/consumer/src/persistence/repositories/mongodb/recipe-ingestion-state.repository.ts | Recipe ingestion API 커서 singleton (Mongoose) |
| **server/consumer/src/persistence/transactions/** | |
| server/consumer/src/persistence/transactions/mongodb-session.transaction.ts | ⚠️ 미구현 · Mongoose session (필요 시) |
| server/consumer/src/persistence/transactions/saga.coordinator.ts | ⚠️ 미구현 · 분산 트랜잭션 (RDB↔NoSQL) |
| **server/consumer/src/persistence/bulk-operations/postgresql/** | ⚠️ 미구현 |
| server/consumer/src/persistence/bulk-operations/postgresql/batch-create.service.ts | ⚠️ 미구현 · Prisma createMany |
| server/consumer/src/persistence/bulk-operations/postgresql/batch-update.service.ts | ⚠️ 미구현 · Prisma updateMany |
| server/consumer/src/persistence/bulk-operations/postgresql/upsert.service.ts | ⚠️ 미구현 · Prisma upsert |
| **server/consumer/src/persistence/bulk-operations/mongodb/** | ⚠️ 미구현 |
| server/consumer/src/persistence/bulk-operations/mongodb/bulk-write.service.ts | ⚠️ 미구현 · bulkWrite/insertMany |
| server/consumer/src/persistence/bulk-operations/mongodb/update-many.service.ts | ⚠️ 미구현 · updateMany/updateOne |
| server/consumer/src/persistence/bulk-operations/mongodb/findOneAndUpdate.service.ts | ⚠️ 미구현 · findOneAndUpdate(upsert) |
| **server/consumer/src/reliability/retry/** | |
| server/consumer/src/reliability/retry/exponential-backoff.ts | 지수 백오프 |
| server/consumer/src/reliability/retry/circuit-breaker.ts | ⚠️ 미구현 · OpenAI 서킷 브레이커 |
| **server/consumer/src/reliability/idempotency/** | ⚠️ 미구현 |
| server/consumer/src/reliability/idempotency/idempotent.decorator.ts | ⚠️ 미구현 · 멱등성 보장 |
| server/consumer/src/reliability/idempotency/deduplication.service.ts | ⚠️ 미구현 · 중복 이벤트 필터링 |
| **server/consumer/src/reliability/monitoring/** | |
| server/consumer/src/reliability/monitoring/monitoring.module.ts | 모니터링 통합 모듈 |
| server/consumer/src/reliability/monitoring/consumer-metrics.service.ts | 처리량·에러율·처리 지연 Prometheus 메트릭 |
| server/consumer/src/reliability/monitoring/consumer-lag.monitor.ts | Kafka lag |
| server/consumer/src/reliability/monitoring/metrics-exporter.service.ts | 워커용 GET /metrics (METRICS_PORT) |
| server/consumer/src/reliability/monitoring/topic-consumer-group.map.ts | 토픽 → Consumer Group 매핑 상수 (lag 모니터링용) |
| **server/consumer/src/reliability/dead-letter/** | |
| server/consumer/src/reliability/dead-letter/dlq.handler.ts | DLQ 처리 |
| server/consumer/src/reliability/dead-letter/manual-replay.service.ts | ⚠️ 미구현 · 수동 재처리 |
| **server/consumer/src/jobs/** | 배치 잡 공통 |
| server/consumer/src/jobs/cli-args.util.ts | CLI 인자 검증 (`findUnknownCliArgs`) — 알려진 플래그·위치 인자 소비 후 미인식 토큰 반환. 각 잡 `run-*.ts`에서 `recipe_ingestion_cli_unknown_args` 구조화 로그 후 early return |
| **server/consumer/src/jobs/recipe-ingestion/** | recipe ingestion 공통 (Kafka payload·run scope·CLI·로깅) |
| server/consumer/src/jobs/recipe-ingestion/recipe-ingestion-logger.ts | 구조화 로깅 래퍼 (`logIngestion`, event taxonomy) |
| server/consumer/src/jobs/recipe-ingestion/recipe-ingestion-range-trigger.payload.ts | parse-submit-triggered·persist-triggered Kafka 트리거 공통 payload 타입·검증·key 헬퍼 (Consumer SSOT) |
| server/consumer/src/jobs/recipe-ingestion/recipe-ingestion-run.scope.ts | submit/retrieve/persist run scope 해석 (`runId` vs `runIdCount`; submit/persist는 `jobId` 추가) |
| server/consumer/src/jobs/recipe-ingestion/recipe-ingestion-run.target.ts | submit/persist 작업 대상 job 조회 · retrieve batchId 조회 |
| server/consumer/src/jobs/recipe-ingestion/recipe-ingestion-run.cli.ts | run scope CLI (`--run-id`, `--run-id-count`) · submit/persist용 `--job-id` 파서 |
| **server/consumer/src/jobs/kpi-rollup/** | KPI 롤업 배치 잡 |
| server/consumer/src/jobs/kpi-rollup/kpi-rollup.module.ts | KPI 롤업 모듈 |
| server/consumer/src/jobs/kpi-rollup/kpi-rollup.service.ts | KPI 집계 서비스 (MongoDB EventLog → 롤업 문서) |
| server/consumer/src/jobs/kpi-rollup/run-kpi-rollup.ts | KPI 롤업 실행 엔트리포인트 (CLI/스케줄러) |
| **server/consumer/src/jobs/recipe-ingestion-fetch/** | fetch standalone job |
| server/consumer/src/jobs/recipe-ingestion-fetch/recipe-ingestion-fetch.module.ts | fetch 잡 모듈 |
| server/consumer/src/jobs/recipe-ingestion-fetch/run-recipe-ingestion-fetch.ts | fetch CLI 엔트리포인트 |
| server/consumer/src/jobs/recipe-ingestion-fetch/services/fetch.service.ts | 공공데이터 API 페이징·job 생성 |
| **server/consumer/src/jobs/recipe-ingestion-parse-submit/** | submit standalone job |
| server/consumer/src/jobs/recipe-ingestion-parse-submit/recipe-ingestion-parse-submit.module.ts | submit 잡 모듈 |
| server/consumer/src/jobs/recipe-ingestion-parse-submit/run-recipe-ingestion-parse-submit.ts | submit CLI (`--run-id`, `--run-id-count`, `--job-id`, `--retry-failed`, `--retry-failed-limit`) |
| server/consumer/src/jobs/recipe-ingestion-parse-submit/prompts/recipe-ingestion.system-prompt.ts | OpenAI Batch용 시스템 프롬프트 |
| server/consumer/src/jobs/recipe-ingestion-parse-submit/services/category-context.service.ts | submit용 카테고리 컨텍스트 조립 |
| server/consumer/src/jobs/recipe-ingestion-parse-submit/services/parse-submit.service.ts | OpenAI Batch 제출·job 상태 갱신 |
| **server/consumer/src/jobs/recipe-ingestion-parse-retrieve/** | retrieve standalone job |
| server/consumer/src/jobs/recipe-ingestion-parse-retrieve/recipe-ingestion-parse-retrieve.module.ts | retrieve 잡 모듈 |
| server/consumer/src/jobs/recipe-ingestion-parse-retrieve/run-recipe-ingestion-parse-retrieve.ts | retrieve CLI (`--run-id`, `--run-id-count`) |
| server/consumer/src/jobs/recipe-ingestion-parse-retrieve/services/parse-retrieve.service.ts | Batch 결과 수신·`recipe-ingestion-persist-triggered` 토픽 발행 |
| **server/consumer/src/jobs/recipe-ingestion-persist/** | persist standalone job (`--run-id`, `--run-id-count`, `--job-id`) |
| server/consumer/src/jobs/recipe-ingestion-persist/recipe-ingestion-persist.module.ts | persist 잡 모듈 (standalone) |
| server/consumer/src/jobs/recipe-ingestion-persist/run-recipe-ingestion-persist.ts | persist CLI (`--run-id`, `--run-id-count`, `--job-id`) |
| server/consumer/src/jobs/recipe-ingestion-persist/services/persist.service.ts | job 단위 persist 오케스트레이션 (검증·상태 전이·도메인 persist·메트릭) |
| server/consumer/src/jobs/recipe-ingestion-persist/domains/recipe-creation.domain.ts | Recipe + RecipeIngredient Prisma `$transaction` upsert (ingestion persist) |
| server/consumer/src/jobs/recipe-ingestion-persist/domains/ingredient-matcher.domain.ts | persist 재료 매칭 |
| server/consumer/src/jobs/recipe-ingestion-persist/domains/category-resolver.domain.ts | persist 카테고리 해석 |
| server/consumer/src/jobs/recipe-ingestion-embed-submit/integrations/recipe-embedding-document.integration.ts | 임베딩 요청용 레시피 문서(document_text) 생성 |
| **server/consumer/src/consumers/recipe-ingestion-parse-submit/** | Kafka submit consumer (토픽 §2.2 recipe-ingestion-parse-submit-triggered) |
| server/consumer/src/consumers/recipe-ingestion-parse-submit/recipe-ingestion-parse-submit.module.ts | submit consumer 모듈 |
| server/consumer/src/consumers/recipe-ingestion-parse-submit/recipe-ingestion-parse-submit.consumer.ts | submit consumer 구독 |
| server/consumer/src/consumers/recipe-ingestion-parse-submit/recipe-ingestion-parse-submit.processor.ts | submit processor |
| server/consumer/src/consumers/recipe-ingestion-parse-submit/handlers/ParseSubmitRecipeIngestionHandler.ts | fetch 완료 트리거 → ParseSubmitService.submit |
| **server/consumer/src/consumers/recipe-ingestion-persist/** | Kafka persist consumer (토픽 §2.2 recipe-ingestion-persist-triggered) |
| server/consumer/src/consumers/recipe-ingestion-persist/recipe-ingestion-persist.module.ts | persist consumer 모듈 |
| server/consumer/src/consumers/recipe-ingestion-persist/recipe-ingestion-persist.consumer.ts | persist consumer 구독 |
| server/consumer/src/consumers/recipe-ingestion-persist/recipe-ingestion-persist.processor.ts | persist processor |
| server/consumer/src/consumers/recipe-ingestion-persist/handlers/PersistRecipeHandler.ts | Kafka 트리거 → PersistService 위임 |
| server/consumer/src/jobs/recipe-ingestion-persist/validators/parse_retrieved-data.validator.ts | retrieved_data 스키마·비즈니스 검증 |

---

## 2.2 Kafka 토픽 명세

토픽·DLQ 상수는 `@mealio/shared`의 `KAFKA_TOPICS`, `KAFKA_DLQ_TOPICS`에 정의되어 있으며, Producer의 KafkaAdminService가 로컬 환경에서 메인·DLQ 토픽을 생성한다.

| 토픽 (메인) | DLQ 토픽 | Consumer 그룹 | 발행 주체 | 용도·페이로드 개요 |
|-------------|-----------|----------------|-----------|---------------------|
| **chatbot-requests** | chatbot-requests-dlq | chatbot-group | Producer (POST /api/v1/chatbot/messages 등) | 챗봇 메시지 요청. payload: userId, message, conversationId?, streamChannelId. Consumer: ProcessChatHandler(GPT·tool call), SaveChatLogHandler(ChatbotLog 저장), `chatbot.start`·`chatbot.message` 성공 후 SyncConversationMetaHandler(대화 메타 동기화), Redis 스트림 이벤트 발행. 성공 턴 완료 시 ChatbotCreditService로 멱등 크레딧 차감·`done.data.isCreditDepleted` 반영, 차감 시 내부적으로 **cache-invalidation**(USER_PROFILE) 발행. |
| **activity-events** | activity-events-dlq | activity-events-group | Producer (레시피 조회수 기록 API/공유, `POST /api/v1/recipes/search-queries`·search-clicks 등) | 비로그인 포함 활동 이벤트. payload: type(`recipe.view` \| `recipe.share` \| `search.query` \| `search.click`), actor(type, userId?, ipAddress?, userAgent?), entity?, payload?, metadata?. Consumer: EventLog 저장, `recipe.view` 시 viewCount 증가, `ActivityRecommendationService`로 추천 보정. `recipe.view`는 `POST /api/v1/recipes/:recipeId/views`에서 발행되며, Producer에서 dedupe key를 `user:{id}` 우선/비로그인 `ip:{ip}`(`unknown-ip` fallback) 기준으로 제어한다. `search.query`는 `POST /api/v1/recipes/search-queries`에서 발행한다. |
| **user-events** | user-events-dlq | analytics-group | Producer (닉네임 변경, 재료 CRUD, 관심 레시피 추가/삭제 등) | 로그인 유저 도메인 이벤트. payload: UserEvent \| InventoryEvent. Consumer: UpdateUserProfileHandler, UpdateInventoryHandler, TrackUserActivityHandler(EventLog), RecommendationHandler, 캐시 무효화 요청(CacheInvalidationRequestService). |
| **cache-invalidation** | cache-invalidation-dlq | cache-invalidation-group | Consumer 내부 (CacheInvalidationRequestService) | 캐시 무효화 지시. payload: type(USER_PROFILE \| INVENTORY \| RECIPE \| RECOMMENDATION), userId 또는 recipeIds[]. Handler가 직접 발행하지 않고 RequestService가 발행. Consumer: RedisInvalidationHandler로 Redis 키/패턴 삭제. |
| **recipe-ingestion-parse-submit-triggered** | recipe-ingestion-parse-submit-triggered-dlq | recipe-ingestion-parse-submit-group | Consumer (fetch job) | Recipe ingestion submit 트리거. payload: `{ runId, fetchedCount, triggeredAt }`, key = `runId`. Consumer: recipe-ingestion-parse-submit. submit은 payload를 트리거 신호로 사용하고 Mongo `status: fetched` + `runId`를 재조회해 OpenAI Batch 제출(수동 CLI는 `--run-id` 또는 `--run-id-count`로 실행 단위 지정, 상호 배타). |
| **recipe-ingestion-persist-triggered** | recipe-ingestion-persist-triggered-dlq | recipe-ingestion-persist-group | Consumer (retrieve job) | Recipe ingestion persist 트리거. payload: `{ runId, fetchedCount, triggeredAt }`, key = `runId`. Consumer: recipe-ingestion-persist. persist는 payload를 트리거 신호로 사용하고 Mongo `status: parse_retrieved` + `runId` 재조회 후 검증된 `retrieved_data`(LLM)를 PostgreSQL에 반영한다. Mongo `recipe_ingestion_jobs`가 SSOT. |

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

- **모델·정책**: `@mealio/shared` Prisma `User.creditBalance` / `User.creditMonthlyLimit`, `ChatbotCreditDeduction`(테이블 `chatbot_credit_deductions`, PK `stream_channel_id`). 비용 계산·기본값은 `server/shared/src/policy/user-credits.policy.ts`(`computeChatbotCreditCost`, `DEFAULT_USER_CREDIT_*` 등).
- **ChatbotCreditService** (`consumers/chatbot-request/services/chatbot-credit.service.ts`): 동일 `streamChannelId`에 대해 `createMany` + `skipDuplicates`로 멱등 슬롯 확보 후, `usage.totalTokens` 기반 비용만큼 `creditBalance`를 감소(잔액 상한 클램프). 재처리 시 이중 차감 없음. 신규 차감이 발생한 경우에만 `KafkaProducerService`로 **cache-invalidation** 토픽(USER_PROFILE)을 발행해 Producer 캐시와 정합을 맞춘다.
- **ProcessChatHandler**: Redis `done` 이벤트(`@mealio/shared` 타입 `ChatbotStreamDoneEvent`)의 `data.isCreditDepleted`에 차감 결과를 넣어 클라이언트가 잔액 소진 여부를 알 수 있게 한다.

---

## 2.5 캐시 무효화 흐름 (user-events → cache-invalidation)

- 토픽·발행 주체·수신·Redis 삭제 동작은 §2.2 표의 **cache-invalidation** 행과 동일하다.
- **모듈 의존성**: UserEventsModule이 CacheInvalidationModule을 import하여 Handler에서 CacheInvalidationRequestService를 주입받는다.
- **챗봇 크레딧 차감**: UserEvents 경로 외에, `ChatbotCreditService`가 크레딧이 실제로 차감된 경우 동일 토픽으로 USER_PROFILE 무효화를 발행할 수 있다(§2.4).
- **일관성**: Producer의 Cache-Aside 캐시와 동일 Redis를 사용하므로, 무효화 후 다음 조회 시 DB 폴백이 이루어진다.
- **추천 무효화**: `requestRecommendationInvalidation(userId)` — Redis `recommendation:{userId}` 삭제. 상세 §2.6.

---

## 2.6 맞춤형 레시피 추천 (Consumer)

크로스 패키지 개요·E2E·KPI는 `backend_architecture_spec.md` §4, Producer API·캐시는 `backend_architecture_spec_producer.md` §1.4를 따른다.

### 2.6.1 진입점·책임 분리

| 구성 요소 | 경로 | 역할 |
|----------|------|------|
| **트리거( user-events )** | `server/consumer/src/consumers/user-events/handlers/RecommendationHandler.ts` | 모든 `user-events` 도메인 처리 후 실행. 점수 갱신 + `requestRecommendationInvalidation` |
| **점수 정책( user-events )** | `server/consumer/src/consumers/user-events/services/recommendation-score.service.ts` | 이벤트 타입별 delta·reason 매핑 |
| **행동 보정( activity-events )** | `server/consumer/src/consumers/activity-events/services/activity-recommendation.service.ts` | `recipe.view` 등 활동 신호 반영 + 캐시 무효화 |
| **저장소** | `server/consumer/src/persistence/repositories/postgresql/recommendation.repository.ts` | upsert·Top N 재정렬·트랜잭션 |

- Handler는 Kafka를 직접 발행하지 않는다. 캐시 무효화는 **CacheInvalidationRequestService**만 호출한다(§2.5).
- `activity-events.processor`에서 추천 보정 실패는 **warn 로그 후 swallow**하여 EventLog·조회수 처리를 막지 않는다.

### 2.6.2 이벤트별 점수 가중치 (현행)

**user-events (`RecommendationScoreService`)**

| 이벤트 | delta | 비고 |
|--------|-------|------|
| `recipe.favorites_add` | +1.8 (레시피당) | 강한 선호 |
| `recipe.favorites_remove` | -1.8 | |
| `ingredient.favorites_add` | +0.8 (연관 레시피) | 재료→레시피 전파 |
| `ingredient.favorites_remove` | -0.8 | |
| `ingredient.favorites_update` | +0.5 | |
| `ingredient.add` | +0.25 | |
| `ingredient.update` | +0.15 | |
| `ingredient.remove` | -0.2 | |
| `signup`, `login`, `nickname.update` | 0 | 추천 미반영 |

**activity-events (`ActivityRecommendationService`, 로그인 유저·recipe 엔티티 필요)**

| 이벤트 | delta |
|--------|-------|
| `recipe.view` | +0.1 |
| `recipe.share` | +0.4 |
| `search.click` | +0.25 |
| `search.query` | 0 (추천 미반영) |

가중치 변경 시 **서비스 상수·본 절**을 함께 갱신한다.

### 2.6.3 Top N 재정렬 알고리즘 (`RecommendationRepository`)

1. 이벤트에서 전달된 `recipeId`별 delta를 **동일 트랜잭션**에서 upsert(`score` increment).
2. `score > 0`인 행을 `score DESC`, `updatedAt DESC`, `recipeId ASC`로 정렬해 상위 N건 선택(`MAX_RECOMMENDATION_ROWS` = 10, `@mealio/shared` `recommendation.policy.ts`).
3. 해당 유저의 기존 추천 행을 **deleteMany** 후 rank 1..N으로 **createMany** 재삽입.
4. 재료 기반 이벤트는 `RecipeIngredient`로 연관 `recipeId`를 조회(최대 200건)한 뒤 동일 delta를 레시피에 전파한다.

- Kafka **at-least-once** 전제: upsert·unique 제약으로 중복 이벤트에도 점수가 안정적으로 누적되도록 한다.
- rank 전체 재작성 방식이므로 동시 이벤트가 많을 때 트랜잭션 경합을 모니터링한다(§2.2 `user-events`·`activity-events` KPI 연계).

**확장**: 협업 필터·콘텐츠 기반 배치는 별도 job으로 SSOT를 갱신하고, 완료 후 `requestRecommendationInvalidation`을 호출한다.

---

Function Calling 기반 챗봇 흐름·설계 원칙은 `../guidelines/backend_development_guidelines.md` §5에 정의되어 있다.
