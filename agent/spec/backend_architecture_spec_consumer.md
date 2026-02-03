# Consumer 패키지 명세 (@cook/consumer)

백엔드 아키텍처 명세의 일부이다. 공통 규칙·경로 표기·다른 패키지 명세는 `backend_architecture_spec.md`를 참고한다.

---

**역할**: Kafka 이벤트 수신, 비동기 처리, OpenAI·저장·로그. PostgreSQL은 Prisma, MongoDB는 Mongoose.

## 2.1 파일·디렉터리 명세 (server/consumer/src/)

패키지 루트: `server/consumer/`. 아래 경로는 모두 저장소 루트 기준 절대 경로이며, 패키지 루트 경로를 포함해 표기한다.

| 경로 | 역할 |
|------|------|
| **server/consumer/src/consumers/base/** | |
| server/consumer/src/consumers/base/base.consumer.ts | 공통 컨슈머 로직 (재시도·DLQ 래핑) |
| server/consumer/src/consumers/base/retry.strategy.ts | 재시도 전략 (지수 백오프) |
| **server/consumer/src/consumers/recipe-generation/** | |
| server/consumer/src/consumers/recipe-generation/recipe-generation.consumer.ts | 레시피 생성 토픽 구독 |
| server/consumer/src/consumers/recipe-generation/handlers/GenerateRecipeHandler.ts | OpenAI API 호출 |
| server/consumer/src/consumers/recipe-generation/handlers/SaveRecipeHandler.ts | Prisma Recipe 저장 |
| server/consumer/src/consumers/recipe-generation/handlers/UploadImageHandler.ts | S3 이미지 저장 |
| server/consumer/src/consumers/recipe-generation/validators/recipe-data.validator.ts | 생성 레시피 검증 |
| **server/consumer/src/consumers/chatbot-requests/** | |
| server/consumer/src/consumers/chatbot-requests/chatbot-request.consumer.ts | CHATBOT_REQUESTS 구독 |
| server/consumer/src/consumers/chatbot-requests/handlers/ProcessChatHandler.ts | 의도 분류(LLM 프롬프트 기반)·GPT 스트리밍·Redis에 ChatbotStreamEvent 발행 |
| server/consumer/src/consumers/chatbot-requests/handlers/SaveChatLogHandler.ts | Mongoose ChatbotLog 저장 |
| server/consumer/src/consumers/chatbot-requests/handlers/UpdateContextHandler.ts | ChatbotLog, EventLog 갱신 |
| server/consumer/src/consumers/chatbot-requests/context/conversation.manager.ts | 대화 히스토리 관리 |
| server/consumer/src/consumers/chatbot-requests/context/rag-context.builder.ts | RAG 컨텍스트 조합 (도메인별 source 호출) |
| server/consumer/src/consumers/chatbot-requests/context/sources/user-context.source.ts | User, UserIngredient 조회 |
| server/consumer/src/consumers/chatbot-requests/context/sources/recipe-context.source.ts | Recipe, RecipeIngredient, Ingredient 조회 |
| server/consumer/src/consumers/chatbot-requests/context/sources/event-context.source.ts | EventLog 조회 |
| server/consumer/src/consumers/chatbot-requests/context/sources/chatbot-log-context.source.ts | ChatbotLog 조회 |
| **server/consumer/src/consumers/search-logs/** | |
| server/consumer/src/consumers/search-logs/search-log.consumer.ts | 검색 로그 토픽 구독 |
| server/consumer/src/consumers/search-logs/handlers/IndexSearchHandler.ts | 검색어 인덱싱 |
| server/consumer/src/consumers/search-logs/handlers/AnalyticsHandler.ts | 검색 패턴 분석 |
| **server/consumer/src/consumers/user-events/** | |
| server/consumer/src/consumers/user-events/user-event.consumer.ts | 유저 이벤트 토픽 구독 |
| server/consumer/src/consumers/user-events/handlers/UpdateUserProfileHandler.ts | 사용자 프로필 업데이트 |
| server/consumer/src/consumers/user-events/handlers/TrackUserActivityHandler.ts | EventLog 저장 |
| server/consumer/src/consumers/user-events/handlers/RecommendationHandler.ts | 추천 갱신 |
| **server/consumer/src/consumers/cache-invalidation/** | |
| server/consumer/src/consumers/cache-invalidation/cache-invalidation.consumer.ts | 캐시 무효화 토픽 구독 |
| server/consumer/src/consumers/cache-invalidation/handlers/RedisInvalidationHandler.ts | Redis 캐시 무효화 |
| server/consumer/src/consumers/cache-invalidation/handlers/CDNInvalidationHandler.ts | CloudFlare 퍼지 |
| **server/consumer/src/integrations/openai/** | |
| server/consumer/src/integrations/openai/openai.service.ts | GPT API 래퍼 |
| server/consumer/src/integrations/openai/prompt-templates/recipe-generation.ts | 레시피 생성 프롬프트 |
| server/consumer/src/integrations/openai/prompt-templates/chatbot-response.ts | 챗봇 응답 프롬프트 |
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
| server/consumer/src/persistence/repositories/mongodb/user-ingredient.repository.ts | UserIngredient 저장 (Mongoose) |
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

RAG 목표·흐름·도메인 확장 원칙은 `../guidelines/backend_development_guidelines.md` 참고.
