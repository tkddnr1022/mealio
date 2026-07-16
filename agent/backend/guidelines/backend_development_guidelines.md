# 백엔드 개발 지침

에이전트 주도 개발 시 **어떻게** 개발할지 원칙과 방법론을 제시하는 **비정형 문서**이다. **무엇을** 개발할지(파일·디렉터리 단위)는 `../spec/backend_architecture_spec.md`에 정의되어 있다.

---

## 1. 구현 우선순위 (백엔드 전체)

### Phase 1: MVP (핵심 기능)
1. **Prisma 설정**
   - PostgreSQL 스키마 정의 및 마이그레이션 생성/적용
2. **Mongoose 설정**
   - MongoDB 스키마 정의 (`inventories`, `chatbot_logs`, `event_logs` 등)
   - 인덱스 및 TTL 정책 설정
3. **Producer**: Auth, Users, Recipes (조회), Kafka 발행
4. **Consumer**: ChatbotLog 저장
5. **Infrastructure**: Prisma(PostgreSQL), Mongoose(MongoDB), Kafka, Redis 연결

### Phase 2: 최적화
1. Cache-Aside 패턴 구현 (Prisma·Mongoose 도메인별 캐시 키/전략)
2. Read Replica 라우팅 (Prisma, PostgreSQL)
3. Prisma Select/Include 최적화; Mongoose lean()·select()·인덱스 검토
4. 재시도 및 DLQ 처리
5. Mongoose 커넥션 풀 및 bulkWrite/insertMany 활용 검토

### Phase 3: 관찰성
1. Prisma 쿼리 메트릭 수집; Mongoose 쿼리·연결 메트릭 수집
2. 분산 추적 (Correlation ID)
3. 에러 모니터링 (Sentry)
4. 슬로우 쿼리 알림 (Prisma + Mongoose)

---

## 2. 모듈 단위 TDD 지침

**Producer API**와 **Consumer 주요 모듈(Consumer·Handler)** 모두 TDD를 적용한다. 테스트는 각 모듈 루트의 `__tests__` 아래 역할별 폴더에 `{대상}.spec.ts`로 작성한다.

### 2.1 공통 원칙

- **테스트 위치**: 모듈 루트 `__tests__/` → Producer는 `controllers/`, `services/` / Consumer는 consumer별 `consumers/{consumer_name}/`, `consumers/{consumer_name}/handlers/` 등으로 구분.
- **의존성**: Controller·Service·Consumer·Handler는 Repository·외부 클라이언트 등을 전부 Mock하여 단위 테스트.
- **TDD 순서**: **Red-Green-Refactor**. 새 API 또는 새 핸들러/컨슈머 추가 시 spec을 먼저 확장 → 실패(Red) → 최소 구현으로 통과(Green) → 리팩터(Refactor). 한 번에 한 동작 단위로 반복해 변경 단위의 추적성을 유지한다.

### 2.2 Producer (API)

- **대상**: Controller(라우팅·인증·DTO·Service 호출·HTTP 상태), Service(비즈니스 로직·캐시·Repository·이벤트 발행).
- **테스트 초점**: Controller는 Service Mock 후 호출·예외→상태 매핑 검증. Service는 Repository·캐시·Kafka 등 Mock 후 로직·예외 검증.

### 2.3 Consumer (이벤트 처리)

- **대상**: Consumer(메시지 수신·핸들러 호출·재시도/DLQ 위임), Handler(페이로드 기반 로직·DB·OpenAI·S3 등).
- **테스트 초점**: Consumer는 Handler들을 Mock한 뒤 메시지 파싱·핸들러 호출 순서·예외 시 재시도/DLQ 검증. Handler는 OpenAIService·Repository 등 Mock 후 `execute(payload)` 동작·반환·예외 검증.
- **적용 범위**: chatbot-request, user-events, activity-events, cache-invalidation 등 consumer별 모듈에 대해 consumer.spec + processor/handlers spec 작성.

### 2.4 Producer / Consumer 테스트 요약

| 구분       | Producer                          | Consumer                                      |
|-----------|------------------------------------|-----------------------------------------------|
| **진입점** | Controller (HTTP)                 | Consumer (Kafka 메시지)                        |
| **비즈니스** | Service                           | Handler                                       |
| **테스트 폴더** | `__tests__/controllers/`, `__tests__/services/` | `__tests__/consumers/`, `__tests__/handlers/` |
| **Controller/Consumer 테스트** | 라우팅, 인증, DTO, Service 호출, HTTP 상태 | 메시지 파싱, 핸들러 순서, 재시도, DLQ          |
| **Service/Handler 테스트** | 캐시, Repository, 이벤트 발행, 도메인 로직 | Repository, OpenAI, S3 등 외부 연동, 도메인 로직 |
| **공통**   | 외부 의존성 Mock, `Test.createTestingModule` | 동일                                          |

### 2.5 Jest 설정

`__tests__` 폴더를 인식하려면 `testRegex`에 `__tests__` 내 `*.spec.ts`를 포함한다. 이미 `.*\\.spec\\.ts$`를 사용 중이면 `src` 이하의 `__tests__`도 기본으로 매칭된다. `rootDir`이 `src`인 경우, `modules/users/__tests__/controllers/users.controller.spec.ts` 같은 경로가 그대로 포함된다.  
Jest 설정상으로는 `src` 이하 어디에 있든 `*.spec.ts` 파일을 인식하지만, **팀 규칙으로 테스트 파일은 항상 `__tests__` 하위에만 두고 소스 파일과 같은 디렉터리에 두지 않는다.**

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

## 3. Producer 설계 원칙

1. **Fast Response First**: 모든 API는 200ms 이내 응답을 목표로 설계한다.
2. **Cache-Aside Pattern**: Redis 조회 → RDB는 Prisma, MongoDB는 Mongoose 폴백 → Redis 캐시 갱신(도메인별 저장소 분리) 순으로 구현한다.
3. **Event Sourcing 지향 쓰기**: 쓰기 작업은 가급적 Kafka 이벤트 발행으로 대체하고, Consumer가 비동기 처리하도록 한다.
4. **Read Replica 활용**: PostgreSQL 읽기 작업은 인프라/DB 레벨(예: pgbouncer, 로드 밸런서, DB 설정)의 라우팅 계층으로 분리해 운영한다. MongoDB는 복제셋 구성에 따라 읽기 전략을 분리한다.
5. **Connection Pool 최적화**: Prisma(`pool_timeout`, `connection_limit`) 및 Mongoose(`maxPoolSize`, `minPoolSize`)를 환경별로 최적 값으로 설정한다.

---

## 4. Consumer 설계 원칙

1. **At-Least-Once Delivery**: 멱등성 보장을 전제로, Kafka 소비는 최소 1회 전달(중복 가능)을 기준으로 설계한다. 구체적인 멱등성 구현 방식(멱등 키, unique 제약, 중복 이벤트 필터링 등)은 도메인별 아키텍처 스펙·코드에서 정의하고, 이 문서는 원칙만 제시한다.
2. **Graceful Degradation**: OpenAI 등 외부 API 장애 시 재시도 후 DLQ로 보내고, 장애가 장기화되더라도 전체 Consumer 프로세스가 중단되지 않도록 한다.
3. **Batch Processing 우선**: PostgreSQL은 Prisma `createMany()`, `updateMany()`를, MongoDB는 Mongoose `insertMany()`, `bulkWrite()`, `updateMany()`를 활용하여 I/O 라운드트립을 최소화한다.
4. **Partitioned Processing**: Kafka 파티션별로 병렬 처리를 수행하되, 동일 키(예: `userId`, `conversationId`)는 같은 파티션으로 보내 순서를 보장한다.
5. **Observability**: Prisma 및 Mongoose의 쿼리/연결 메트릭을 필수로 수집하고, Consumer lag·에러율·처리량을 대시보드로 모니터링한다.
6. **Recommendation KPI**: 추천 파이프라인 관측 지표는 `../spec/backend_architecture_spec.md` **§4.4**를 따른다.

### 4.1 캐시 무효화 (Producer 캐시와의 일관성)

- **Handler 레이어**: Handler는 Kafka 토픽을 직접 발행하지 않는다. DB 반영 후 Producer 캐시를 무효화할 필요가 있으면 **CacheInvalidationRequestService**에 요청만 한다 (예: `requestUserProfileInvalidation(userId)`, `requestInventoryInvalidation(userId)`). 실제 토픽 발행은 해당 서비스에서 수행하며, cache-invalidation 토픽을 구독하는 Processor·RedisInvalidationHandler가 Redis DEL을 실행한다.
- **캐시 키**: Redis 캐시 키 prefix는 **@mealio/shared**의 **CACHE_KEY_PREFIX**를 사용한다. Producer의 캐시 전략과 Consumer의 캐시 무효화가 동일한 키 규칙을 공유하도록 한다.

---

## 5. Function Calling 기반 챗봇 흐름

챗봇은 **OpenAI Responses API**의 Function Calling을 사용한다. 모델이 필요 시 도메인 함수(예: `search_recipes`, `get_user_inventory`)를 호출하고, 그 결과를 반영한 최종 응답을 생성한다. 대화 연속성은 서버 사이드 `previous_response_id` 체이닝으로 유지한다.

### 5.1 실행 시나리오 (End-to-End)

1. **유저 요청 → Producer**: 클라이언트가 `POST /api/v1/chatbot/messages` 등으로 요청. Producer는 `streamChannelId` 생성 후 Kafka(`CHATBOT_REQUESTS`)에 이벤트 발행한다. 이때 페이로드는 **userId, conversationId, 자연어 입력 등 최소 메타데이터 중심**으로 구성해 통신 비용과 관심사를 분리한다.
2. **Consumer 수신 → ProcessChatHandler**: Kafka 메시지 수신 후 `ProcessChatHandler`가 실행된다. payload에는 userId, conversationId, 자연어 입력 등만 포함되며, **유저 재료·레시피 등 도메인 데이터는 필요할 때마다 tool call을 통해 조회**한다.
3. **Responses Function Call (선택적)**: `client.responses.create({ stream: true, store: true })`에 **tools**(평탄 함수 정의)·**instructions**(시스템 프롬프트)·신규 `input`(첫 round는 user message)을 넘긴다. `ChatbotConversation.lastResponseId`가 있으면 `previous_response_id`로 체이닝한다. `tool_choice: 'auto'`로 tool 여부·횟수는 모델이 판단한다. 예를 들어,
   - 단순 잡담·레시피 추천 철학 등은 **tool call 없이** 응답한다.
   - 유저 보유 재료가 필요하면 `get_user_inventory`를 호출한다.
   - 레시피 검색이 필요하면 `search_recipes`를 호출한다. 사용자 발화에서 해석한 조건(키워드, 조리시간/인분 범위, 포함/제외 재료명, 카테고리 id 등)은 **반드시 `search_recipes` 인자에 명시적으로 전달**한다. 예: `search_recipes({ keywords: ['간단','저녁'], cookTime: { lte: 30 }, avoidIngredients: ['우유'] })`.
4. **도메인 Tool Handlers**:
   - **InventoryHandler (`get_user_inventory`)**: MongoDB의 `Inventory` 문서에서 `ingredients.owned`, `ingredients.favorite`, `recipes.favorite` 컨텍스트를 조회한 뒤, 재료 ID는 **PostgreSQL(Prisma) `Ingredient` 마스터와 조인**하여 `[{ id, name, ... }]` 정보를 보강해 반환한다. 이때, **재료 마스터는 Redis 등으로 적절히 캐싱**하여 id → name 변환을 효율적으로 수행한다.
   - **SearchRecipesHandler (`search_recipes`)**: Function call 인자를 받아 **semantic-first** 파이프라인으로 레시피 후보를 수집한다. (0) `mustHaveIngredients`·`avoidIngredients` 재료명을 `IngredientSemanticResolverService`로 exact → `IngredientEmbedding` ANN 해상(임계값 `INGREDIENT_VECTOR_MATCH_THRESHOLD`) → (1) 구조화 질의 텍스트 구성(해상된 canonical name 반영) → (2) LLM Query Expansion → (3) pgvector ANN top-K(`RecipeEmbeddingRepository.searchTopK`, 해상된 `avoidIngredientIds` 병합 제외) → (4) hard constraint(`isPublished`, 기피 재료) 적용 후 Prisma 상세 조회 → (5) semantic·keyword·inventory·user preference·soft constraint 가중 재랭킹. `mustHaveIngredients`는 해상 ID 기준 soft signal, `cookTime`/`servings`/카테고리도 **soft signal**(탈락이 아닌 점수화)로 처리한다. `ingredientIds`는 보유 재료 매칭 가산점에 사용한다. 유저 재료 기반 추천이 필요하면 모델이 먼저 `get_user_inventory`를 호출해 id 배열을 `search_recipes`에 전달하도록 유도한다. 검색 결과는 `SearchedRecipe[]`(최대 10건, `reasonSignals`·점수 포함) 형태로 반환한다. 튜닝 상수는 `server/consumer/src/policy/recipe-search.policy.ts`, 상세 명세는 `../spec/backend_architecture_spec_consumer.md` §2.7.
5. **tool round 체이닝**: `response.output`에 `function_call` 아이템이 있으면 Handler 실행 후 `{ type: 'function_call_output', call_id, output }`를 다음 round `input`으로 보내고, `previous_response_id`는 직전 round의 `response.id`를 사용한다. `instructions`와 `tools`는 **매 요청마다 재전송**한다(`previous_response_id`가 top-level `instructions`·`tools`를 이어받지 않음).
6. **최종 응답·상태 저장**: 텍스트 응답이 완료되면 `ChatbotConversation.lastResponseId`에 최종 `response.id`를 저장한다. 스트리밍 텍스트는 `response.output_text.delta`, 종료·usage는 `response.completed` 이벤트를 사용한다.
7. **Redis 발행 → Producer SSE**: Consumer는 `ChatbotStreamEvent`(type: `chunk` | `tool_call` | `done` | `error`)를 Redis 채널 `chatbot:stream:{streamChannelId}`에 발행한다. Producer는 해당 채널을 구독하여 SSE로 클라이언트에 전달한다.
8. **MongoDB 로깅**: 스트림 종료 후 **ChatbotLog**에 대화 턴·usage 등을 `SaveChatLogHandler`가 저장한다(감사·분석용). 대화 연속성 컨텍스트는 ChatbotLog 재구성이 아니라 Responses 체이닝으로 유지한다.

### 5.2 Function 정의·핸들러 설계 원칙

- **함수 정의 (Responses tools)**: Responses API의 평탄 구조 `{ type: 'function', name, description, parameters, strict }`로 `search_recipes`, `get_user_inventory`, `get_food_categories`, `finalize_recipe_selection` 등을 정의한다. 구현 SSOT는 `chatbot-tools.definition.ts`.
  - `search_recipes` 예시: `parameters`에 `keywords`, `ingredientIds`, `mustHaveIngredients`, `avoidIngredientIds`, `avoidIngredients`, `cookTime`, `servings`, `recipeCategoryIds`, `ingredientCategoryIds`를 두어, 파싱된 조건이 숨은 서버 상태 없이 tool 인자만으로 재현되게 한다.
- **핸들러 매핑**: Consumer 내에서 function name → Handler 인스턴스 매핑을 두고, `function_call` 아이템의 `name`/`arguments`/`call_id`에 따라 Handler를 실행한다. 반환 문자열은 `function_call_output.output`으로 다음 Responses 요청에 전달한다.
- **유저 재료 컨텍스트 처리**: 유저 재료 스키마에는 재료 ID만 저장되므로, **id → name 변환은 항상 `get_user_inventory` 핸들러 내부에서 수행**한다. 이때 Ingredient 마스터를 캐시(예: Redis key `ingredient:by-id:{id}`) 하여 반복 조회를 줄인다.
- **검색·매칭**: `SearchRecipesHandler`는 `IngredientSemanticResolverService`로 재료명을 ID로 해상한 뒤 pgvector ANN으로 의미 기반 후보를 넓게 수집하고, hard constraint(기피 재료·published)를 적용하고 composite score로 재랭킹해 상위 N건을 `SearchedRecipe[]`로 반환한다. 유저 재료 컨텍스트는 `get_user_inventory` tool 결과의 `ingredientIds`로 `inventoryMatchScore`에 반영하며, Producer 이벤트는 최소 메타데이터 계약을 따른다.
- **도메인 확장**: 새 도메인(예: 건강 정보, 쇼핑 리스트)을 넣을 때는 새 함수(예: `search_health_tips`)를 tools에 추가하고, 대응하는 Handler를 등록한다. 기존 `ProcessChatHandler`의 tool dispatch 로직만 확장하면 된다.
- **tool call 선택성**: Prompt(`instructions`)에 “필요하다고 판단될 때에만 tools를 사용한다”는 지침을 명시해 자연스러운 대화 흐름을 보장한다.

### 5.3 SSE·로그와의 연동

- **ChatbotStreamEvent와 Function Calling 이벤트**: `ChatbotStreamEvent`에는 Function Calling 관련 이벤트를 추가한다. 예: `type: 'tool_call'` — payload에 `functionName`(예: `search_recipes`), 필요 시 `arguments` 요약 또는 `status`(예: `start` | `complete`)를 담아, 클라이언트가 “레시피 검색 중…”, “함수 실행 완료” 등 상태를 구분할 수 있게 한다. 기존 `chunk`(스트리밍 텍스트), `done`(최종 payload에 suggestedRecipes 등 도메인 JSON 포함), `error`와 함께 스트림 구간별로 발행한다.
- **클라이언트 피드백**: 실제 Function Calling이 일어나는 시점에 Consumer가 `tool_call` 이벤트를 Redis에 발행하면, Producer가 SSE로 그대로 전달하므로 **클라이언트는 서버가 함수(레시피 검색, 유저 재료 조회 등)를 실행 중임을 실시간으로 피드백 받을 수 있다.** UI에서 로딩/스피너 또는 “레시피를 찾고 있어요” 같은 메시지를 표시하는 데 활용한다.
- **Redis·SSE**: Producer가 `chatbot:stream:{streamChannelId}`를 구독하고, Consumer가 `chunk`·`tool_call`·`done`·`error`를 발행한다. Producer는 수신 내용을 그대로 SSE로 클라이언트에 전송하고, `done`/`error` 또는 타임아웃 시 구독 해제한다.
- **ChatbotLog**: 대화 턴별로 요청 메시지, 최종 응답 텍스트, usage, 도메인 JSON(suggestedRecipes 등)을 Mongoose 스키마에 맞게 저장한다. TTL·인덱스 정책은 `schema.md` 및 Consumer 스키마 정의를 따른다.

### 5.4 Responses `previous_response_id` 체이닝 (상세)

Consumer 챗봇 모듈은 OpenAI 서버 사이드 상태로 연속 대화를 유지한다. 수동으로 ChatbotLog에서 이전 턴을 읽어 메시지 배열을 재구성하지 않는다.

#### 역할·구성 요소

| 구성 요소 | 파일 | 역할 |
|----------|------|------|
| **instructions** | `consumers/chatbot-request/context/conversation.manager.ts` | `CHATBOT_SYSTEM_INSTRUCTIONS` — 매 Responses 요청의 top-level `instructions`로 전달. |
| **체이닝 상태** | `ChatbotConversation.lastResponseId` | 대화별 마지막 `response.id`. `getLastResponseId`/`saveLastResponseId`로 읽고 쓴다. |
| **호출처** | `consumers/chatbot-request/handlers/ProcessChatHandler.ts` | 첫 round `input`=현재 user message(+ optional `previous_response_id`), tool round `input`=`function_call_output[]`. |

#### 요청 규칙

- **매 요청 재전송**: `instructions`와 `tools`는 `previous_response_id`가 있어도 항상 함께 보낸다.
- **첫 턴 / lastResponseId 없음**: 현재 사용자 메시지만으로 새 Responses 체인을 시작한다.
- **연속 턴**: 저장된 `lastResponseId`를 `previous_response_id`로 전달하고, `input`에는 신규 user message만 넣는다.
- **tool round**: 직전 round `response.id`를 `previous_response_id`로, `input`에는 `function_call_output` 아이템만 넣는다(최대 5 round).
- **오류**: `previous_response_id` 만료·무효 등으로 API가 실패하면 기존 Consumer 오류 이벤트·DLQ 경로로 전달한다. 이력 재구성이나 자동 재시도를 추가하지 않는다.

#### 저장·보존

- 턴이 텍스트로 종료되면(또는 max tool round 소진 후) 최종 `response.id`를 `lastResponseId`에 upsert한다.
- OpenAI에 `store: true`로 저장된 response의 보존 기간이 지나면 `previous_response_id` 참조가 실패할 수 있다. 운영 시 보존 기간을 확인하고, 만료 오류는 일반 ProcessChat 오류·DLQ 정책으로 처리한다.
- **ChatbotLog**는 감사·분석·목록 표시용으로 계속 저장하며, GPT 컨텍스트 재구성 용도로 사용하지 않는다.

---

## 6. 맞춤형 레시피 추천 (Recommendation)

**무엇을(파일·API·가중치·알고리즘·캐시 계약)** 은 아래 명세를 따른다. 본 가이드라인은 구현 시 **§2 TDD**, **§3 Producer(캐시·Fast Response)**, **§4 Consumer(멱등·캐시 무효화·Observability)** 원칙을 적용한다.

| 문서 | 절 |
|------|-----|
| `../spec/backend_architecture_spec.md` | §4 크로스 패키지 개요·E2E·KPI |
| `../spec/backend_architecture_spec_consumer.md` | §2.6 Consumer 갱신·가중치·Top N |
| `../spec/backend_architecture_spec_producer.md` | §1.4 Producer API·캐시·fallback |
| `../common/openapi_spec.yaml`, `../common/schema.md` | API·`UserRecipeRecommendation` SSOT |

- 추천 점수 갱신은 Kafka Consumer 경로(§3 Event Sourcing)로 수행한다.
- 캐시 무효화는 `CacheInvalidationRequestService` 호출 경로로 수행한다(§4.1).
- 챗봇 즉시 검색·제안(`search_recipes`, §5)과 홈 피드 개인화 목록(추천 SSOT API)은 역할을 분리한다.

---

## 7. 환경 변수 검증 원칙 및 관리 방식

### 원칙

- **모든 환경 변수는 기본적으로 필수로 간주**하며, **env validation**이 어떤 변수가 필수/선택인지 그 범위를 명시한다. 검증 스키마에서 **필수로 정의된 변수**에 대해 누락·형식 오류가 발생하면 앱 구동을 중단하고, 선택적 변수는 스키마에서 optional로 표현한다. 새 환경 변수를 도입할 때는 항상 각 앱의 `config/env.validation.ts`에 추가하여 필수/선택 여부를 명확히 한다.
- **코드에서는 환경 변수에 대해 `??` 또는 `||` 연산자를 사용하지 않는다.** 조회 시에는 **`ConfigService.getOrThrow()`** 또는 **`process.env.VAR_NAME!`** 로 단언하여 사용한다.

### 관리 방식

- **Producer·Consumer** 모두 **NestJS ConfigModule** + **Joi** 로 앱 기동 시 환경 변수를 검증한다.
- 검증 스키마는 각 앱의 `config/env.validation.ts` 에 정의하며, `ConfigModule.forRoot({ validationSchema, validationOptions })` 로 적용한다.
- 검증 실패 시 앱 구동을 중단하고 오류 메시지를 출력한다.
- 서비스 코드에서는 **`ConfigService.getOrThrow()`** 조회와 **`process.env.VAR!`** 단언 패턴을 사용한다.
- 각 패키지 루트의 `.env.example` 에 필요한 변수 목록과 예시 값을 둔다.
- **@mealio/shared** 는 설정 객체 생성 계층으로 동작하며 `createKafkaConfig`, `createRedisConfig`, `mongooseConfig` 등에서 **`process.env.VAR!`** 를 읽어 반환한다. 실제 검증과 기동 제어는 Producer/Consumer의 `config/env.validation.ts` 가 담당한다.

### 파일 및 변수 목록

| 구분 | 파일/위치 | 비고 |
|------|-----------|------|
| 검증 | 각 앱 `config/env.validation.ts` | NestJS ConfigModule + Joi. 검증 실패 시 기동 중단 |
| 예시 | 각 패키지 루트 `.env.example` | 필수 변수 목록·예시 값 |
| Shared | env 직접 검증 없음 | createKafkaConfig 등은 process.env 읽어 설정 반환 |

**Producer 필수 환경 변수**: APP_ENV, PORT, JWT_SECRET, MONGODB_URL, POSTGRESQL_URL, REDIS_URL, KAFKA_BROKERS, KAFKA_CLIENT_ID.

**Consumer 필수 환경 변수**: APP_ENV, MONGODB_URL, REDIS_URL, KAFKA_BROKERS, KAFKA_CLIENT_ID, KAFKA_CONSUMER_GROUP_ID, OPENAI_API_KEY, OPENAI_CHAT_MODEL, OPENAI_EMBEDDING_MODEL.

---

## 8. 공통 설계 원칙 (DB·확장성)

### 8.1 데이터베이스별 최적화 전략

**Prisma (PostgreSQL)**: Select 최적화(필요 필드만), Include 제한(N+1 방지), Batch Operations(createMany/updateMany), Transaction 최소화, Index 활용(@@index, @@unique).

**Mongoose (MongoDB)**: lean() 사용(읽기 전용), select() 제한, 인덱스(복합·TTL), Bulk 연산(insertMany, bulkWrite), Connection Pool(maxPoolSize 등).

### 8.2 데이터베이스 분리 전략

- **PostgreSQL (via Prisma)**: 정규화된 관계형 데이터, ACID 보장 필요 데이터 (User, Recipe, Ingredient, RecipeIngredient).
- **MongoDB (via Mongoose)**: 비정규화된 로그·상태 데이터, 스키마 유연성 필요 데이터 (Inventory, ChatbotLog, EventLog).

### 8.3 확장성 전략

1. **Horizontal Scaling**: Producer/Consumer 모두 인스턴스 증설 가능.
2. **Kafka Partitioning**: 토픽당 파티션 수는 **Consumer 인스턴스 수 이상**으로 설정하고, 초기에는 두 값을 같게 시작해 인스턴스 증설 시 파티션도 함께 확장한다.
3. **Redis Cluster**: 캐시 데이터 샤딩.
4. **Database Sharding**: User ID 기반 샤딩 설계 시 고려; MongoDB는 샤드 키 설계 시 동일 원칙 적용.
5. **Connection Pooling**: Prisma(인스턴스당 최적 커넥션 수), Mongoose(`maxPoolSize` 등) 각각 설정.

---

## 9. 모노레포·빌드

| 항목 | 명세 |
|------|------|
| 패키지 매니저 | pnpm |
| 워크스페이스 | 루트 `pnpm-workspace.yaml`: client, server/shared, server/producer, server/consumer |
| 빌드·실행 | 루트 `pnpm install` → shared → producer → consumer 순으로 빌드(`pnpm run build:server` 등) 후 `pnpm run start:producer` / `pnpm run start:consumer` |
| CI | pnpm/action-setup, `pnpm install --frozen-lockfile`, `pnpm --filter @mealio/shared build`, `pnpm --filter @mealio/producer build`, `pnpm --filter @mealio/consumer build` |

---

## 10. 데이터베이스별 주의사항 (Prisma + Mongoose)

### 데이터소스·스키마 소유

| 데이터소스 | 접근 방식 | 스키마·마이그레이션 위치 |
|------------|------------|--------------------------|
| PostgreSQL | Prisma | Shared `src/database/prisma/schema.prisma`, `migrations/` |
| MongoDB | Mongoose | Shared `src/database/mongoose/schemas/*`. Producer/Consumer는 import |

### 데이터소스 구성

- **PostgreSQL**: 단일 데이터소스(`datasource db`)를 사용하며, **Prisma**로 접근한다. 리드 레플리카는 DB/프록시 레벨의 읽기·쓰기 분리 경로로 구성한다.
- **MongoDB**: Prisma가 아닌 **Mongoose**로 접근하며, 스키마는 Shared `database/mongoose/schemas/*.schema.ts`에서 관리한다.
- 서버 기동 시 Prisma `$connect()`와 Mongoose `mongoose.connect()`를 각각 수행한다.

### Prisma 관련

- **타입 안정성**: Prisma Client가 TypeScript 타입을 자동 생성; `Prisma.RecipeCreateInput` 등을 DTO에 재사용 가능; 컴파일 타임에 스키마 변경 감지.
- **마이그레이션**: PostgreSQL에 `prisma migrate` 사용; Production에서는 `prisma migrate deploy` 사용.

### Mongoose 관련

- **스키마 버전 관리**: MongoDB는 마이그레이션 툴이 없으므로, 스키마 변경 시 하위 호환을 유지하고 인덱스/필드는 코드와 `schema.md`에 명시하여 동기화한다.
- **인덱스**: 복합 인덱스·TTL 인덱스(ChatbotLog 30일, EventLog 90일)는 스키마 정의 또는 `Model.createIndexes()`로 적용하고, 배포/시드 시 누락되지 않도록 한다.
- **Connection 옵션**: `maxPoolSize`, `minPoolSize`, `serverSelectionTimeoutMS` 등은 환경별로 설정하여 연결 풀과 타임아웃을 조절한다.

### 성능 모니터링 (이원화)

- **Prisma**: 미들웨어(`$use`)로 쿼리 로깅·메트릭 수집.
- **Mongoose**: `mongoose.plugin()` 또는 쿼리 미들웨어로 느린 쿼리·실행 시간 로깅; 연결 이벤트(`connected`, `disconnected`) 모니터링.
