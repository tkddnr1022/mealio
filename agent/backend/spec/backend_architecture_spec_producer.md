# Producer 패키지 명세 (@mealio/producer)

백엔드 아키텍처 명세의 일부이다. 공통 규칙·경로 표기·다른 패키지 명세는 `backend_architecture_spec.md`에 정의되어 있다.

---

**역할**: 클라이언트 요청 실시간 처리, 읽기·캐시 우선 조회, Kafka 이벤트 발행.

## 1.1 파일·디렉터리 명세 (server/producer/src/)

패키지 루트: `server/producer/`. 경로 표기 규칙은 `backend_architecture_spec.md`와 동일하다.

| 경로 | 역할 |
|------|------|
| **server/producer/src/main.ts** | Nest 애플리케이션 부트스트랩 |
| **server/producer/src/app.module.ts** | 루트 모듈(AppModule). 각 도메인 모듈·인프라 모듈 import |
| server/producer/src/app.controller.ts | 헬스체크·기본 엔드포인트(필요 시) |
| server/producer/src/app.service.ts | App 수준 공용 서비스(필요 시) |
| **server/producer/src/config/** | 설정 모듈 디렉터리 |
| server/producer/src/config/env.validation.ts | 환경 변수 스키마 검증 |
| server/producer/src/config/mongoose-pool.config.ts | Mongoose 커넥션 풀 설정 (MongooseSchemasModule.forRoot 주입용) |
| server/producer/src/config/prisma-pool.config.ts | Prisma 커넥션 풀 설정 (PRISMA_POOL_CONFIG 주입용) |
| server/producer/src/config/swagger.config.ts | Swagger(OpenAPI) 설정, 문서 빌더 |
| **server/producer/src/modules/auth/** | OAuth·JWT 인증 모듈 |
| server/producer/src/modules/auth/auth.module.ts | AuthModule 정의, 전략·가드·컨트롤러 묶음 |
| server/producer/src/modules/auth/auth.service.ts | OAuth 로그인 처리, 사용자 생성/조회, JWT 발급 |
| server/producer/src/modules/auth/constants/auth-providers.ts | Provider enum·설정 키 상수 |
| server/producer/src/modules/auth/controllers/auth.controller.ts | OAuth 진입·콜백: GET /api/v1/auth/{provider}, GET /api/v1/auth/{provider}/callback |
| server/producer/src/modules/auth/decorators/current-user.decorator.ts | `@CurrentUser()` 데코레이터, 요청 유저 정보 주입 |
| server/producer/src/modules/auth/decorators/current-user-optional.decorator.ts | `@CurrentUserOptional()` 데코레이터, 선택 인증 요청의 유저 정보 주입(없을 수 있음) |
| server/producer/src/modules/auth/guards/jwt-auth.guard.ts | JWT 인증 가드 (Access Token 검증) |
| server/producer/src/modules/auth/guards/optional-jwt-auth.guard.ts | 선택 인증 가드 (토큰 없음은 익명 통과, 토큰 유효 시 사용자 주입, 무효/만료는 401) |
| server/producer/src/modules/auth/guards/oauth-callback.guard.ts | OAuth 콜백 보안 검증(state 등) |
| server/producer/src/modules/auth/strategies/index.ts | Passport 전략 export |
| server/producer/src/modules/auth/strategies/google.strategy.ts | Google OAuth 전략 |
| server/producer/src/modules/auth/strategies/kakao.strategy.ts | Kakao OAuth 전략 |
| server/producer/src/modules/auth/strategies/naver.strategy.ts | Naver OAuth 전략 |
| server/producer/src/modules/auth/types/oauth.types.ts | OAuth 관련 타입 정의 |
| server/producer/src/modules/auth/types/request.types.ts | 인증 관련 Request 확장 타입 |
| server/producer/src/modules/auth/filters/oauth-callback-exception.filter.ts | OAuth 콜백 예외 필터 (Provider 에러·state 불일치 → 프론트 `/oauth/error`로 302) |
| **server/producer/src/modules/health/** | 헬스체크 모듈 |
| server/producer/src/modules/health/health.module.ts | HealthModule 정의 (Service·Controller 묶음) |
| server/producer/src/modules/health/health.service.ts | DB·캐시·외부 연동 상태 체크 로직 |
| server/producer/src/modules/health/health.controller.ts | GET /health, /ready 엔드포인트 |
| **server/producer/src/modules/middleware/** | 전역/라우트 미들웨어 |
| server/producer/src/modules/middleware/rate-limit.middleware.ts | API 요청 제한 (Redis 기반 Rate Limiting) |
| server/producer/src/modules/middleware/logging.middleware.ts | 요청/응답 로깅 |
| server/producer/src/modules/middleware/correlation-id.middleware.ts | 분산 추적용 Correlation ID 부여·전파 |
| server/producer/src/modules/middleware/observability-http-paths.ts | HTTP 경로 정규화 (메트릭·로그용 path grouping) |
| server/producer/src/modules/middleware/request.types.ts | 미들웨어 Request 확장 타입 정의 |
| **server/producer/src/modules/users/** | 사용자 프로필 모듈 |
| server/producer/src/modules/users/users.module.ts | UsersModule 정의 |
| server/producer/src/modules/users/users.service.ts | 유저 프로필 조회·수정, 캐시 우선 조회 후 RDS 폴백 |
| server/producer/src/modules/users/users.controller.ts | GET /api/v1/users/me, PATCH /api/v1/users/me/nickname, GET /api/v1/users/me/activities |
| server/producer/src/modules/users/dto/update-nickname.dto.ts | 닉네임 변경 요청 DTO |
| server/producer/src/modules/users/dto/user-profile.dto.ts | 유저 프로필 응답 DTO |
| server/producer/src/modules/users/dto/user-activity-query.dto.ts | 활동 내역 조회 쿼리 DTO (`limit`, `cursor`, `types`) |
| server/producer/src/modules/users/dto/user-activity-item.dto.ts | 활동 내역 단건 DTO (`type`, `occurredAt`, `summary`) |
| server/producer/src/modules/users/dto/user-activity-list.dto.ts | 활동 내역 응답 DTO (`items`, `nextCursor`) |
| **server/producer/src/modules/recipes/** | 레시피 조회 모듈 |
| server/producer/src/modules/recipes/recipes.module.ts | RecipesModule 정의 |
| server/producer/src/modules/recipes/recipes.service.ts | RecipeQueryService. 상세 조회(read-only)·캐시 활용 + 조회수 이벤트 기록 API(record view, dedupe key: `user:{id}` 우선, 비로그인은 `ip:{ip}` / 미확인 `ip:unknown-ip`) |
| server/producer/src/modules/recipes/recipes.controller.ts | GET /api/v1/recipes, GET /api/v1/recipes/recommended, GET /api/v1/recipes/static-ids, GET /api/v1/recipes/:recipeId, POST /api/v1/recipes/:recipeId/views, GET /api/v1/recipes/search, POST /api/v1/recipes/summaries |
| server/producer/src/modules/recipes/dto/pagination.dto.ts | 페이지네이션 공통 DTO |
| server/producer/src/modules/recipes/dto/recipe-detail.dto.ts | 레시피 상세 응답 DTO |
| server/producer/src/modules/recipes/dto/recipe-ids.dto.ts | 레시피 ID 리스트 DTO |
| server/producer/src/modules/recipes/dto/recipe-list-query.dto.ts | 리스트 조회 쿼리 DTO |
| server/producer/src/modules/recipes/dto/recommended-recipes-query.dto.ts | 개인화 추천 조회 쿼리 DTO (`limit`) |
| server/producer/src/modules/recipes/dto/recommended-recipe-item.dto.ts | 추천 아이템 DTO (`recipe`, `rank`, `score`, `reason`, `calculatedAt`) |
| server/producer/src/modules/recipes/dto/recipe-search-query.dto.ts | 검색 쿼리 DTO |
| server/producer/src/modules/recipes/dto/recipe-static-ids-query.dto.ts | 정적 경로 생성용 ID 목록 조회 쿼리 DTO |
| server/producer/src/modules/recipes/dto/recipe-summary.dto.ts | 레시피 요약 응답 DTO |
| server/producer/src/modules/recipes/policies/recipe-sort.policy.ts | 레시피 정렬 정책 (latest/cookTime/difficulty/viewCount/likeCount) 및 Prisma orderBy 규칙 |
| **server/producer/src/modules/ingredients/** | 재료 조회 모듈 |
| server/producer/src/modules/ingredients/ingredients.module.ts | IngredientsModule 정의 |
| server/producer/src/modules/ingredients/ingredients.service.ts | 재료 검색·카테고리, 캐시 우선 조회 |
| server/producer/src/modules/ingredients/ingredients.controller.ts | GET /api/v1/ingredients/search, GET /api/v1/ingredients/categories |
| server/producer/src/modules/ingredients/dto/ingredient-search-query.dto.ts | 재료 검색 쿼리 DTO |
| server/producer/src/modules/ingredients/dto/ingredient.dto.ts | 재료 단건 응답 DTO |
| server/producer/src/modules/ingredients/dto/ingredient-category.dto.ts | 재료 카테고리 응답 DTO |
| server/producer/src/modules/ingredients/dto/pagination.dto.ts | 페이지네이션 DTO(재료 전용) |
| **server/producer/src/modules/inventory/** | 유저 보관함 모듈 |
| server/producer/src/modules/inventory/inventory.module.ts | InventoryModule 정의 |
| server/producer/src/modules/inventory/inventory.service.ts | InventoryService (MongoDB 저장, 캐시 관리) |
| server/producer/src/modules/inventory/inventory.controller.ts | `GET /api/v1/users/me/inventory`, `GET /api/v1/users/me/favorite-recipes/ids`, `PUT/POST/DELETE /api/v1/users/me/inventory/ingredients/{owned\|favorites}`, `POST/DELETE /api/v1/users/me/inventory/recipes/favorites` |
| server/producer/src/modules/inventory/dto/owned-ingredient-ids.dto.ts | 보유 재료 ID 리스트 DTO (`ownedIngredientIds`) |
| server/producer/src/modules/inventory/dto/favorite-ingredient-ids.dto.ts | 관심 재료 ID 리스트 DTO (`favoriteIngredientIds`) |
| server/producer/src/modules/inventory/dto/favorite-recipe-ids.dto.ts | 관심 레시피 ID 리스트 DTO (`favoriteRecipeIds`) |
| server/producer/src/modules/inventory/dto/favorite-recipe-ids-response.dto.ts | 관심 레시피 ID 목록 응답 DTO (`favoriteRecipeIds`) |
| server/producer/src/modules/inventory/dto/inventory-list.dto.ts | 보관함 조회 응답 DTO (`ownedIngredients`, `favoriteIngredients`) |
| **server/producer/src/modules/chatbot/** | 챗봇 SSE·대화 모듈 |
| server/producer/src/modules/chatbot/chatbot.module.ts | ChatbotModule 정의 |
| server/producer/src/modules/chatbot/chatbot.service.ts | ChatbotService (Kafka 발행, Redis 구독, SSE 전달) |
| server/producer/src/modules/chatbot/chatbot.controller.ts | POST /api/v1/chatbot/messages (SSE), GET /api/v1/chatbot/conversations, GET /api/v1/chatbot/conversations/:id |
| server/producer/src/modules/chatbot/dto/send-message.dto.ts | 챗봇 메시지 전송 요청 DTO |
| server/producer/src/modules/chatbot/dto/chatbot-message-item.dto.ts | 스트림 단위 메시지 아이템 DTO |
| server/producer/src/modules/chatbot/dto/chatbot-response.dto.ts | SSE 응답 DTO |
| server/producer/src/modules/chatbot/dto/conversation-history.dto.ts | 대화 상세 조회 DTO |
| server/producer/src/modules/chatbot/dto/conversation-list-item.dto.ts | 대화 리스트 아이템 DTO |
| server/producer/src/modules/chatbot/dto/conversation-list-query.dto.ts | 대화 리스트 조회 쿼리 DTO |
| server/producer/src/modules/chatbot/dto/conversation-list.dto.ts | 대화 리스트 응답 DTO |
| server/producer/src/modules/chatbot/dto/is-conversation-list-cursor.validator.ts | 커서 문자열 유효성 검증 커스텀 밸리데이터 |
| server/producer/src/modules/chatbot/dto/suggested-recipe.dto.ts | 챗봇이 제안하는 레시피 DTO |
| **server/producer/src/infrastructure/database/repositories/postgresql/** | |
| server/producer/src/infrastructure/database/repositories/postgresql/user.repository.ts | User 조회·생성(OAuth 로그인용)·갱신 (PrismaService, @mealio/shared/prisma-client) |
| server/producer/src/infrastructure/database/repositories/postgresql/recipe.repository.ts | Recipe 조회/검색 리포지토리. RecipeStats 조인(attach) 및 통계 기반 정렬(viewCount/likeCount) 지원 |
| server/producer/src/infrastructure/database/repositories/postgresql/ingredient.repository.ts | Ingredient 조회 |
| server/producer/src/infrastructure/database/repositories/postgresql/recipe-ingredient.repository.ts | RecipeIngredient 조회/생성 |
| server/producer/src/infrastructure/database/repositories/postgresql/auth-refresh-session.repository.ts | Refresh Token 세션 CRUD (SSOT=PostgreSQL `auth_refresh_sessions`) |
| **server/producer/src/infrastructure/database/repositories/mongodb/** | |
| server/producer/src/infrastructure/database/repositories/mongodb/event-log.repository.ts | EventLog (스키마·타입 @mealio/shared) |
| server/producer/src/infrastructure/database/repositories/mongodb/chatbot-log.repository.ts | ChatbotLog (스키마·타입 @mealio/shared) |
| server/producer/src/infrastructure/database/repositories/mongodb/chatbot-conversation.repository.ts | ChatbotConversation 메타 목록·제목 조회 (`updatedAt` 정렬·커서) (스키마·타입 @mealio/shared) |
| server/producer/src/infrastructure/database/repositories/mongodb/conversation-list-cursor.ts | 대화 목록 커서 기반 페이지네이션 유틸 (커서 인코딩/디코딩) |
| server/producer/src/infrastructure/database/repositories/mongodb/inventory.repository.ts | Inventory (스키마·타입 @mealio/shared) |
| **server/producer/src/infrastructure/cache/** | |
| server/producer/src/infrastructure/cache/cache.service.ts | 캐시 서비스 (Redis는 @mealio/shared 사용) |
| server/producer/src/infrastructure/cache/cache.module.ts | 캐시 모듈 |
| server/producer/src/infrastructure/cache/cache.decorator.ts | @Cacheable 데코레이터 |
| server/producer/src/infrastructure/cache/strategies/cache-strategy.interface.ts | 캐시 전략 인터페이스 |
| server/producer/src/infrastructure/cache/strategies/index.ts | 전략 export |
| server/producer/src/infrastructure/cache/strategies/recipe-cache-strategy.ts | 상세 TTL 15분(`recipe:{id}`), 목록·검색·카테고리·static-ids TTL 5분 |
| server/producer/src/infrastructure/cache/strategies/ingredient-cache-strategy.ts | TTL 24시간. 마스터 변경 시 Consumer `CacheInvalidationEventType.INGREDIENT` 무효화(인프라 준비됨, 런타임 발행 경로 TODO) |
| server/producer/src/infrastructure/cache/strategies/user-cache-strategy.ts | TTL 5분. 캐시 키 prefix는 @mealio/shared CACHE_KEY_PREFIX.USER 사용 |
| server/producer/src/infrastructure/cache/strategies/inventory-cache-strategy.ts | TTL 5분. 캐시 키 prefix는 @mealio/shared CACHE_KEY_PREFIX.INVENTORY 사용 |
| server/producer/src/infrastructure/cache/strategies/recommendation-cache-strategy.ts | TTL 1시간. 키 `recommendation:{userId}` (@mealio/shared `cacheKeyRecommendation`). §1.4 |
| **server/producer/src/infrastructure/kafka/** | |
| server/producer/src/infrastructure/kafka/kafka.module.ts | Kafka 모듈 |
| server/producer/src/infrastructure/kafka/kafka-admin.service.ts | 토픽 생성·확인 등 |
| server/producer/src/infrastructure/kafka/producer.service.ts | createKafkaConfig 등 @mealio/shared |
| server/producer/src/infrastructure/kafka/serializers/* | (선택: Avro/JSON 직렬화 구현 시 해당 경로 사용, 구현하지 않을 경우 디렉터리·파일 생략 가능) |
| **server/producer/src/infrastructure/storage/** | ⚠️ 미구현 |
| server/producer/src/infrastructure/storage/s3.service.ts | ⚠️ 미구현 · 이미지 Presigned URL 생성 |
| server/producer/src/infrastructure/storage/cdn.service.ts | ⚠️ 미구현 · CloudFlare 캐시 무효화 |
| **server/producer/src/optimization/caching/** | ⚠️ 미구현 |
| server/producer/src/optimization/caching/query-result.cache.ts | ⚠️ 미구현 · Prisma 쿼리 결과 캐싱 |
| server/producer/src/optimization/caching/mongoose-query.cache.ts | ⚠️ 미구현 · Mongoose 쿼리 결과 캐싱 |
| server/producer/src/optimization/caching/http-response.cache.ts | ⚠️ 미구현 · HTTP 응답 캐싱 |
| server/producer/src/optimization/caching/cache-warming.service.ts | ⚠️ 미구현 · 인기 레시피 사전 캐싱 |
| **server/producer/src/optimization/database/postgresql/** | ⚠️ 미구현 |
| server/producer/src/optimization/database/postgresql/read-replica.config.ts | ⚠️ 미구현 · 읽기 복제본 URL |
| server/producer/src/optimization/database/postgresql/query-optimizer/select-optimizer.ts | ⚠️ 미구현 · Prisma select 최적화 |
| server/producer/src/optimization/database/postgresql/query-optimizer/include-optimizer.ts | ⚠️ 미구현 · include 제거 |
| **server/producer/src/optimization/database/mongodb/** | ⚠️ 미구현 |
| server/producer/src/optimization/database/mongodb/query-optimizer/lean-project.helper.ts | ⚠️ 미구현 · lean()+select() |
| **server/producer/src/optimization/monitoring/** | |
| server/producer/src/optimization/monitoring/monitoring.module.ts | 모니터링 통합 모듈 (Sentry·메트릭·예외필터 묶음) |
| server/producer/src/optimization/monitoring/metrics.service.ts | Prometheus 메트릭 |
| server/producer/src/optimization/monitoring/metrics.controller.ts | GET /metrics 엔드포인트 |
| server/producer/src/optimization/monitoring/http-metrics.middleware.ts | HTTP 요청/응답 메트릭 미들웨어 (duration·status) |
| server/producer/src/optimization/monitoring/slow-query.interceptor.ts | 느린 쿼리 로깅 |
| server/producer/src/optimization/monitoring/global-exception.filter.ts | 전역 예외 필터 (미처리 에러 Sentry 전송·JSON 응답) |
| server/producer/src/optimization/monitoring/sentry.module.ts | Sentry NestJS 모듈 설정 |
| server/producer/src/optimization/monitoring/sentry.service.ts | Sentry captureException·breadcrumb 래퍼 |
| server/producer/src/optimization/monitoring/prisma-metrics.ts | Prisma 쿼리 메트릭 |
| server/producer/src/optimization/monitoring/mongoose-metrics.ts | Mongoose 쿼리/연결 메트릭 |

## 1.2 챗봇 SSE 계약 (Producer/Consumer/Shared)

| 항목 | 명세 |
|------|------|
| Redis 채널 | `chatbot:stream:{streamChannelId}` (@mealio/shared `getChatbotStreamChannel`) |
| 이벤트 타입 | `ChatbotStreamEvent`: `type: 'chunk' \| 'done' \| 'error' \| 'tool_call'` (@mealio/shared `types/events`). `done.data`에는 `conversationId`, `isCreditDepleted`(크레딧 소진 여부), 선택 `suggestedRecipes`가 포함된다. |
| Kafka 토픽 | CHATBOT_REQUESTS (@mealio/shared `KAFKA_TOPICS`) |

챗봇 6단계 흐름·설계 원칙은 `../guidelines/backend_development_guidelines.md` §5에 정의되어 있다.

## 1.3 OAuth (백엔드 주도) 명세

OAuth 인증은 백엔드 주도 흐름을 따른다. 전략·API 계약·보안 요건은 `../guidelines/oauth_implementation_guidelines.md`에 정의되어 있다.

| 항목 | 명세 |
|------|------|
| **설정** | Provider별 Client ID, Client Secret, Scope, Redirect URI(백엔드 콜백 URL)를 환경 변수 또는 설정 모듈에서 로드. Redirect URI는 Provider 개발자 콘솔에 백엔드 콜백 URL로 등록(클라이언트 도메인 아님). |
| **진입 라우트** | GET /api/v1/auth/{provider}. path parameter `provider`로 Provider 결정(google, kakao, naver). 해당 Provider 인증 URL 생성(client_id, redirect_uri, scope, state). 응답: 302 Redirect to Provider 인증 URL. |
| **콜백 라우트** | GET /api/v1/auth/{provider}/callback. Query에서 code(필수), state(권장) 추출. state 검증(권장, CSRF 방지). Authorization Code로 Provider Token 엔드포인트 호출 → Access Token( 및 Refresh Token) 수신. Access Token으로 Provider 사용자 정보 API 호출. 수신 사용자 정보로 DB 사용자 생성 또는 조회. 자체 Access JWT + Opaque Refresh Token 발급. 응답: 302 Redirect to 클라이언트 로그인 성공 URL + Set-Cookie(`accessToken`, `refreshToken`, HttpOnly, Secure, SameSite=Lax). |
| **적용 경로** | 진입/콜백: server/producer/src/modules/auth/controllers/*. 전략: server/producer/src/modules/auth/strategies/* (Passport Google, Kakao, Naver). 가드: server/producer/src/modules/auth/guards/* (JWT, OAuth 콜백). 데코레이터: server/producer/src/modules/auth/decorators/*. OpenAPI·프론트엔드와 경로 일치: /api/v1/auth/{provider}, /api/v1/auth/{provider}/callback. |

### Refresh Token (Opaque, SSOT=DB, Cache=Redis)

| 항목 | 명세 |
|------|------|
| **Refresh API** | `POST /api/v1/auth/refresh` |
| **토큰 형식** | Opaque 문자열 `sessionId.secret` |
| **저장소 전략** | 검증/폐기의 최종 판정은 PostgreSQL(`auth_refresh_sessions`)이 SSOT, Redis는 세션 캐시(`auth:refresh:session:{sessionId}`) |
| **회전 정책** | Refresh 성공 시 기존 세션 revoke + 신규 세션 생성 + access/refresh 동시 재발급 |
| **재사용 대응** | 이미 revoke/교체된 세션 재사용 감지 시 사용자 활성 세션 revoke 후 401 |
| **로그아웃** | `POST /api/v1/auth/logout`에서 access/refresh 쿠키 모두 clear + 사용자 세션 revoke |

## 1.4 맞춤형 레시피 추천 API (Producer)

크로스 패키지 개요·E2E·KPI는 `backend_architecture_spec.md` §4, Consumer 갱신·가중치는 `backend_architecture_spec_consumer.md` §2.6을 따른다.

| 항목 | 명세 |
|------|------|
| **API** | `GET /api/v1/recipes/recommended` — **JWT 필수**(`JwtAuthGuard`). 쿼리 `limit` 기본 12, 최소 1·최대 30 (`RecommendedRecipesQueryDto`). |
| **컨트롤러·서비스** | `recipes.controller.ts` → `RecipeQueryService.getRecommended(userId, limit)` (`recipes.service.ts`). |
| **응답 DTO** | `RecommendedRecipeItemDto[]` — `recipe`(RecipeSummary), `rank`, `score`, `reason`, `calculatedAt`. OpenAPI `RecipeRecommendationItem`과 동기화. |
| **조회** | `RecipeRepository` 등에서 `UserRecipeRecommendation` SSOT 조회 후 RecipeSummary·RecipeStats 조인. 필요 필드만 select/include. |
| **Fallback** | SSOT에 해당 `userId` 행이 없으면 `likeCount` DESC 인기 레시피로 `limit`건 채움. `reason`에 초기 추천 데이터 없음을 명시. |
| **캐시 전략** | `server/producer/src/infrastructure/cache/strategies/recommendation-cache-strategy.ts` — Cache-Aside. 키 `recommendation:{userId}` (`@mealio/shared` `cacheKeyRecommendation`, `CACHE_KEY_PREFIX.RECOMMENDATION`). **TTL 3600초(1시간)**. |
| **캐시 무효화** | Consumer가 `cache-invalidation` 토픽(`CacheInvalidationEventType.RECOMMENDATION`) 발행 시 동일 Redis 키 삭제. `backend_architecture_spec_consumer.md` §2.5·`backend_architecture_spec_shared.md` §3.5. |

**확장 시 유의**: 챗봇 `SuggestedRecipe`와 추천 SSOT를 직접 동기화하지 않는다. 필요 시 챗봇이 본 API를 tool로 호출하는 식으로 계약을 확장한다.
