# Producer 패키지 명세 (@cook/producer)

백엔드 아키텍처 명세의 일부이다. 공통 규칙·경로 표기·다른 패키지 명세는 `backend_architecture_spec.md`에 정의되어 있다.

---

**역할**: 클라이언트 요청 실시간 처리, 읽기·캐시 우선 조회, Kafka 이벤트 발행.

## 1.1 파일·디렉터리 명세 (server/producer/src/)

패키지 루트: `server/producer/`. 경로 표기 규칙은 `backend_architecture_spec.md`와 동일하다.

| 경로 | 역할 |
|------|------|
| **server/producer/src/config/** | |
| server/producer/src/config/* | 환경 검증(env.validation), Swagger 설정 등 |
| **server/producer/src/modules/auth/** | |
| server/producer/src/modules/auth/controllers/* | OAuth 진입·콜백: GET /api/v1/auth/{provider} (302 to Provider), GET /api/v1/auth/{provider}/callback (Code 처리, JWT Set-Cookie, 302 to 클라이언트 로그인 성공 URL) |
| server/producer/src/modules/auth/guards/* | JWT 인증 가드, OAuth 콜백 가드 |
| server/producer/src/modules/auth/strategies/* | Passport 전략 (Google, Kakao, Naver) |
| server/producer/src/modules/auth/decorators/* | @CurrentUser 등 |
| server/producer/src/modules/auth/types/* | Request 타입 등 |
| **server/producer/src/modules/health/** | |
| server/producer/src/modules/health/controllers/* | GET /health, /ready |
| **server/producer/src/modules/middleware/** | |
| server/producer/src/modules/middleware/rate-limit/* | API 요청 제한 (Redis) |
| server/producer/src/modules/middleware/logging/* | 요청/응답 로깅 |
| server/producer/src/modules/middleware/correlation-id/* | 분산 추적용 ID |
| **server/producer/src/modules/users/** | |
| server/producer/src/modules/users/controllers/* | GET /api/v1/users/me, PATCH /api/v1/users/me/nickname |
| server/producer/src/modules/users/services/* | 캐시 조회 우선, RDS 폴백 |
| server/producer/src/modules/users/dto/* | 요청/응답 DTO |
| **server/producer/src/modules/recipes/** | |
| server/producer/src/modules/recipes/controllers/* | GET /api/v1/recipes, GET /api/v1/recipes/:recipeId, GET /api/v1/recipes/search, POST /api/v1/recipes/summaries |
| server/producer/src/modules/recipes/services/* | RecipeQueryService 등, 읽기 전용·캐시 활용 |
| server/producer/src/modules/recipes/dto/* | 요청/응답 DTO |
| **server/producer/src/modules/ingredients/** | |
| server/producer/src/modules/ingredients/controllers/* | GET /api/v1/ingredients, GET /api/v1/ingredients/search |
| server/producer/src/modules/ingredients/services/* | 캐시 우선 조회 |
| server/producer/src/modules/ingredients/dto/* | 요청/응답 DTO |
| **server/producer/src/modules/user-ingredients/** | |
| server/producer/src/modules/user-ingredients/controllers/* | GET/PUT/POST/DELETE /api/v1/users/me/ingredients, PUT/POST/DELETE /api/v1/users/me/ingredients/favorites, DELETE /api/v1/users/me/ingredients/favorites/:ingredientId |
| server/producer/src/modules/user-ingredients/services/* | UserIngredientService (MongoDB 저장, 캐시 관리) |
| server/producer/src/modules/user-ingredients/dto/* | 요청/응답 DTO |
| **server/producer/src/modules/chatbot/** | |
| server/producer/src/modules/chatbot/controllers/* | POST /api/v1/chatbot/messages (SSE), GET /api/v1/chatbot/conversations, GET /api/v1/chatbot/conversations/:id |
| server/producer/src/modules/chatbot/services/* | ChatbotService (Kafka 발행, Redis 구독, SSE 전달) |
| server/producer/src/modules/chatbot/dto/* | 메시지 DTO |
| **server/producer/src/infrastructure/database/** | |
| server/producer/src/infrastructure/database/prisma/* | seed 등 앱 전용 스크립트. PrismaModule·PrismaService·schema·migrations는 @cook/shared import |
| server/producer/src/infrastructure/database/mongoose/* | mongoose.module.ts 등. mongooseConfig·스키마는 @cook/shared import |
| **server/producer/src/infrastructure/database/repositories/postgresql/** | |
| server/producer/src/infrastructure/database/repositories/postgresql/user.repository.ts | User 조회·생성(OAuth 로그인용)·갱신 (PrismaService, @cook/shared/prisma-client) |
| server/producer/src/infrastructure/database/repositories/postgresql/recipe.repository.ts | Recipe 조회/생성 (PrismaService, @cook/shared/prisma-client) |
| server/producer/src/infrastructure/database/repositories/postgresql/ingredient.repository.ts | Ingredient 조회 |
| server/producer/src/infrastructure/database/repositories/postgresql/recipe-ingredient.repository.ts | RecipeIngredient 조회/생성 |
| **server/producer/src/infrastructure/database/repositories/mongodb/** | |
| server/producer/src/infrastructure/database/repositories/mongodb/event-log.repository.ts | EventLog (스키마·타입 @cook/shared) |
| server/producer/src/infrastructure/database/repositories/mongodb/chatbot-log.repository.ts | ChatbotLog (스키마·타입 @cook/shared) |
| server/producer/src/infrastructure/database/repositories/mongodb/user-ingredient.repository.ts | UserIngredient (스키마·타입 @cook/shared) |
| **server/producer/src/infrastructure/cache/** | |
| server/producer/src/infrastructure/cache/cache.service.ts | 캐시 서비스 (Redis는 @cook/shared 사용) |
| server/producer/src/infrastructure/cache/cache.module.ts | 캐시 모듈 |
| server/producer/src/infrastructure/cache/cache.decorator.ts | @Cacheable 데코레이터 |
| server/producer/src/infrastructure/cache/strategies/cache-strategy.interface.ts | 캐시 전략 인터페이스 |
| server/producer/src/infrastructure/cache/strategies/index.ts | 전략 export |
| server/producer/src/infrastructure/cache/strategies/recipe-cache-strategy.ts | TTL 1시간 |
| server/producer/src/infrastructure/cache/strategies/ingredient-cache-strategy.ts | TTL 24시간 |
| server/producer/src/infrastructure/cache/strategies/user-cache-strategy.ts | TTL 30분. 캐시 키 prefix는 @cook/shared CACHE_KEY_PREFIX.USER 사용 |
| server/producer/src/infrastructure/cache/strategies/user-ingredient-cache-strategy.ts | TTL 30분. 캐시 키 prefix는 @cook/shared CACHE_KEY_PREFIX.USER_INGREDIENT 사용 |
| **server/producer/src/infrastructure/kafka/** | |
| server/producer/src/infrastructure/kafka/kafka.module.ts | Kafka 모듈 |
| server/producer/src/infrastructure/kafka/kafka-admin.service.ts | 토픽 생성·확인 등 |
| server/producer/src/infrastructure/kafka/producer.service.ts | createKafkaConfig 등 @cook/shared |
| server/producer/src/infrastructure/kafka/serializers/* | (선택: Avro/JSON 직렬화 구현 시 해당 경로 사용, 구현하지 않을 경우 디렉터리·파일 생략 가능) |
| **server/producer/src/infrastructure/storage/** | |
| server/producer/src/infrastructure/storage/s3.service.ts | 이미지 Presigned URL 생성 |
| server/producer/src/infrastructure/storage/cdn.service.ts | CloudFlare 캐시 무효화 |
| **server/producer/src/optimization/caching/** | |
| server/producer/src/optimization/caching/query-result.cache.ts | Prisma 쿼리 결과 캐싱 |
| server/producer/src/optimization/caching/mongoose-query.cache.ts | Mongoose 쿼리 결과 캐싱 |
| server/producer/src/optimization/caching/http-response.cache.ts | HTTP 응답 캐싱 |
| server/producer/src/optimization/caching/cache-warming.service.ts | 인기 레시피 사전 캐싱 |
| **server/producer/src/optimization/database/postgresql/** | |
| server/producer/src/optimization/database/postgresql/connection-pool.config.ts | Prisma 커넥션 풀 |
| server/producer/src/optimization/database/postgresql/read-replica.config.ts | 읽기 복제본 URL |
| server/producer/src/optimization/database/postgresql/query-optimizer/select-optimizer.ts | Prisma select 최적화 |
| server/producer/src/optimization/database/postgresql/query-optimizer/include-optimizer.ts | include 제거 |
| **server/producer/src/optimization/database/mongodb/** | |
| server/producer/src/optimization/database/mongodb/connection-pool.config.ts | Mongoose 커넥션 풀 |
| server/producer/src/optimization/database/mongodb/query-optimizer/lean-project.helper.ts | lean()+select() |
| **server/producer/src/optimization/monitoring/** | |
| server/producer/src/optimization/monitoring/metrics.service.ts | Prometheus 메트릭 |
| server/producer/src/optimization/monitoring/slow-query.interceptor.ts | 느린 쿼리 로깅 |
| server/producer/src/optimization/monitoring/prisma-metrics.ts | Prisma 쿼리 메트릭 |
| server/producer/src/optimization/monitoring/mongoose-metrics.ts | Mongoose 쿼리/연결 메트릭 |

## 1.2 챗봇 SSE 계약 (Producer/Consumer/Shared)

| 항목 | 명세 |
|------|------|
| Redis 채널 | `chatbot:stream:{streamChannelId}` (@cook/shared `getChatbotStreamChannel`) |
| 이벤트 타입 | `ChatbotStreamEvent`: `type: 'intent' \| 'chunk' \| 'done' \| 'error'` (@cook/shared `types/events`) |
| Kafka 토픽 | CHATBOT_REQUESTS (@cook/shared `KAFKA_TOPICS`) |

챗봇 6단계 흐름·설계 원칙은 `../guidelines/backend_development_guidelines.md` §5에 정의되어 있다.

## 1.3 OAuth (백엔드 주도) 명세

OAuth 인증은 백엔드 주도 흐름을 따른다. 전략·API 계약·보안 요건은 `../guidelines/oauth_implementation_guidelines.md`에 정의되어 있다.

| 항목 | 명세 |
|------|------|
| **설정** | Provider별 Client ID, Client Secret, Scope, Redirect URI(백엔드 콜백 URL)를 환경 변수 또는 설정 모듈에서 로드. Redirect URI는 Provider 개발자 콘솔에 백엔드 콜백 URL로 등록(클라이언트 도메인 아님). |
| **진입 라우트** | GET /api/v1/auth/{provider}. path parameter `provider`로 Provider 결정(google, kakao, naver). 해당 Provider 인증 URL 생성(client_id, redirect_uri, scope, state). 응답: 302 Redirect to Provider 인증 URL. |
| **콜백 라우트** | GET /api/v1/auth/{provider}/callback. Query에서 code(필수), state(권장) 추출. state 검증(권장, CSRF 방지). Authorization Code로 Provider Token 엔드포인트 호출 → Access Token( 및 Refresh Token) 수신. Access Token으로 Provider 사용자 정보 API 호출. 수신 사용자 정보로 DB 사용자 생성 또는 조회. 자체 JWT 발급. 응답: 302 Redirect to 클라이언트 로그인 성공 URL + Set-Cookie: JWT (HttpOnly, Secure, SameSite=Lax, Max-Age). |
| **적용 경로** | 진입/콜백: server/producer/src/modules/auth/controllers/*. 전략: server/producer/src/modules/auth/strategies/* (Passport Google, Kakao, Naver). 가드: server/producer/src/modules/auth/guards/* (JWT, OAuth 콜백). 데코레이터: server/producer/src/modules/auth/decorators/*. OpenAPI·프론트엔드와 경로 일치: /api/v1/auth/{provider}, /api/v1/auth/{provider}/callback. |
