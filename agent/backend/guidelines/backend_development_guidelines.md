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
4. **Consumer**: Recipe Generation, ChatbotLog 저장
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

**Producer API**와 **Consumer 주요 모듈(Consumer·Handler)** 모두 TDD를 적용한다. 테스트는 소스와 같은 디렉터리에 두지 않고, 각 모듈 루트의 `__tests__` 아래 역할별 폴더에 `{대상}.spec.ts`로 작성한다.

### 2.1 공통 원칙

- **테스트 위치**: 모듈 루트 `__tests__/` → Producer는 `controllers/`, `services/` / Consumer는 consumer별 `consumers/{consumer_name}/`, `consumers/{consumer_name}/handlers/` 등으로 구분.
- **의존성**: Controller·Service·Consumer·Handler는 Repository·외부 클라이언트 등을 전부 Mock하여 단위 테스트.
- **TDD 순서**: **Red-Green-Refactor**. 새 API 또는 새 핸들러/컨슈머 추가 시 spec을 먼저 확장 → 실패(Red) → 최소 구현으로 통과(Green) → 리팩터(Refactor). 한 번에 한 동작 단위로 반복하며, Green 구간에서 다른 기능을 추가하지 않는다.

### 2.2 Producer (API)

- **대상**: Controller(라우팅·인증·DTO·Service 호출·HTTP 상태), Service(비즈니스 로직·캐시·Repository·이벤트 발행).
- **테스트 초점**: Controller는 Service Mock 후 호출·예외→상태 매핑 검증. Service는 Repository·캐시·Kafka 등 Mock 후 로직·예외 검증.

### 2.3 Consumer (이벤트 처리)

- **대상**: Consumer(메시지 수신·핸들러 호출·재시도/DLQ 위임), Handler(페이로드 기반 로직·DB·OpenAI·S3 등).
- **테스트 초점**: Consumer는 Handler들을 Mock한 뒤 메시지 파싱·핸들러 호출 순서·예외 시 재시도/DLQ 검증. Handler는 OpenAIService·Repository 등 Mock 후 `execute(payload)` 동작·반환·예외 검증.
- **적용 범위**: recipe-generation, chatbot-request, user-events, activity-events, cache-invalidation 등 consumer별 모듈에 대해 consumer.spec + processor/handlers spec 작성.

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
4. **Read Replica 활용**: PostgreSQL 읽기 작업은 **애플리케이션 레벨에서 여러 Prisma datasource를 두지 않고**, 인프라/DB 레벨(예: pgbouncer, 로드 밸런서, DB 설정)을 통해 리드 레플리카로 라우팅한다. MongoDB는 복제셋 구성에 따라 읽기 전략을 분리한다.
5. **Connection Pool 최적화**: Prisma(`pool_timeout`, `connection_limit`) 및 Mongoose(`maxPoolSize`, `minPoolSize`)를 환경별로 최적 값으로 설정한다.

---

## 4. Consumer 설계 원칙

1. **At-Least-Once Delivery**: 멱등성 보장을 전제로, Kafka 소비는 최소 1회 전달(중복 가능)을 기준으로 설계한다. 구체적인 멱등성 구현 방식(멱등 키, unique 제약, 중복 이벤트 필터링 등)은 도메인별 아키텍처 스펙·코드에서 정의하고, 이 문서는 원칙만 제시한다.
2. **Graceful Degradation**: OpenAI 등 외부 API 장애 시 재시도 후 DLQ로 보내고, 장애가 장기화되더라도 전체 Consumer 프로세스가 중단되지 않도록 한다.
3. **Batch Processing 우선**: PostgreSQL은 Prisma `createMany()`, `updateMany()`를, MongoDB는 Mongoose `insertMany()`, `bulkWrite()`, `updateMany()`를 활용하여 I/O 라운드트립을 최소화한다.
4. **Partitioned Processing**: Kafka 파티션별로 병렬 처리를 수행하되, 동일 키(예: `userId`, `conversationId`)는 같은 파티션으로 보내 순서를 보장한다.
5. **Observability**: Prisma 및 Mongoose의 쿼리/연결 메트릭을 필수로 수집하고, Consumer lag·에러율·처리량을 대시보드로 모니터링한다.

### 4.1 캐시 무효화 (Producer 캐시와의 일관성)

- **Handler 레이어**: Handler는 Kafka 토픽을 직접 발행하지 않는다. DB 반영 후 Producer 캐시를 무효화할 필요가 있으면 **CacheInvalidationRequestService**에 요청만 한다 (예: `requestUserProfileInvalidation(userId)`, `requestInventoryInvalidation(userId)`). 실제 토픽 발행은 해당 서비스에서 수행하며, cache-invalidation 토픽을 구독하는 Processor·RedisInvalidationHandler가 Redis DEL을 실행한다.
- **캐시 키**: Redis 캐시 키 prefix는 **@cook/shared**의 **CACHE_KEY_PREFIX**를 사용한다. Producer의 캐시 전략과 Consumer의 캐시 무효화가 동일한 키 규칙을 공유하도록 한다.

---

## 5. Function Calling 기반 챗봇 흐름

챗봇은 **OpenAI Function Calling**을 사용한다. GPT가 필요 시 도메인 함수(예: `search_recipes`, `get_user_ingredients`)를 호출하고, 그 결과를 반영한 최종 응답을 생성하도록 한다.

### 5.1 실행 시나리오 (End-to-End)

1. **유저 요청 → Producer**: 클라이언트가 `POST /api/v1/chatbot/messages` 등으로 요청. Producer는 `streamChannelId` 생성 후 Kafka(`CHATBOT_REQUESTS`)에 이벤트 발행한다. 이때 페이로드에는 **userId, conversationId, 자연어 입력 등 최소 메타데이터만 포함**하고, **대용량 도메인 배열은 포함하지 않는다**(통신 비용 절감 및 관심사 분리).
2. **Consumer 수신 → ProcessChatHandler**: Kafka 메시지 수신 후 `ProcessChatHandler`가 실행된다. payload에는 userId, conversationId, 자연어 입력 등만 포함되며, **유저 재료·레시피 등 도메인 데이터는 필요할 때마다 tool call을 통해 조회**한다.
3. **GPT Function Call (선택적)**: OpenAI Chat Completions API에 **tools**(도메인 함수 정의)를 넘기고 스트리밍 호출한다. `tool_choice: 'auto'` 를 사용하여 **모든 tool call 여부·횟수는 GPT가 판단**하게 한다. 예를 들어,
   - 단순 잡담·레시피 추천 철학 등은 **tool call 없이** 대화 컨텍스트만으로 답변한다.
   - 유저 보유 재료가 필요하면 `get_user_ingredients({ userId })` 를 호출하여 유저 재료 컨텍스트를 확보한다.
   - 레시피 검색이 필요하다고 판단하면 `search_recipes` 를 호출한다. 이때 **재료 기준 검색이 아니라 키워드 기반 브라우징만 필요한 경우**, `ingredientIds` 없이 `keywords`, `maxCookTime` 등만 인자로 넘길 수 있어야 한다. 예: `search_recipes({ keywords: ['간단','저녁'], maxCookTime: 30 })`.
4. **도메인 Tool Handlers**:
   - **InventoryHandler (`get_user_ingredients`)**: MongoDB의 `Inventory` 컬렉션에서 유저가 보유/관심 있는 재료 ID를 조회한 뒤, **PostgreSQL(Prisma) `Ingredient` 마스터와 조인**하여 `[{ id, name, ... }]` 형태로 반환한다. 이때, **재료 마스터는 Redis 등으로 적절히 캐싱**하여 id → name 변환을 반복적으로 수행하지 않도록 한다.
   - **SearchRecipesHandler (`search_recipes`)**: Function call 인자를 받아 **PostgreSQL(Prisma)** 로 레시피 검색을 수행한다. `ingredientIds?: string[]` 는 **optional** 로 두어, 유저 재료와 무관한 일반 검색(키워드·시간·난이도 기준)도 지원한다. 유저 재료 기반 추천이 필요한 경우에는, GPT가 먼저 `get_user_ingredients` 를 호출해 재료 컨텍스트를 얻고, 그 결과(또는 그 안의 id 배열)를 활용해 `search_recipes` 를 호출하도록 프롬프트로 유도한다. 검색 결과는 `SuggestedRecipe[]` 형태로 GPT에 반환한다.
5. **GPT 최종 응답**: GPT는 (선택적으로) 여러 도메인 tool call 결과를 컨텍스트로 받아, 자연어 응답(예: "김치찌개를 추천드립니다")을 생성한다.
6. **Redis 발행 → Producer SSE**: Consumer는 `ChatbotStreamEvent`(type: `chunk` | `tool_call` | `done` | `error`, 본문·도메인 JSON 포함)를 Redis 채널 `chatbot:stream:{streamChannelId}`에 발행한다. Producer는 해당 채널을 구독하여 SSE(`data: {JSON}\n\n`)로 클라이언트에 전달한다.
7. **MongoDB 로깅**: 스트림 종료 후 **ChatbotLog**에 대화 턴, 요청/응답 요약, 호출된 function 메타데이터를 Mongoose로 저장한다.

### 5.2 Function 정의·핸들러 설계 원칙

- **함수 정의 (OpenAI tools)**: OpenAI `tools` 배열에 `search_recipes`, `get_user_ingredients` 등 도메인 함수의 이름·설명·parameters(JSON Schema)를 명시한다.
  - `get_user_ingredients` 예시: `parameters: { type: 'object', properties: { userId: { type: 'string' } }, required: ['userId'] }`
  - `search_recipes` 예시: `parameters: { type: 'object', properties: { keywords: { type: 'array', items: { type: 'string' } }, ingredientIds: { type: 'array', items: { type: 'string' }, nullable: true }, maxCookTime: { type: 'number' } }, required: ['keywords'] }` 처럼 **`ingredientIds` 를 optional** 로 정의하여, 재료 기반 추천이 아닌 일반 검색도 자연스럽게 지원한다.
- **핸들러 매핑**: Consumer 내에서 function name → Handler 인스턴스 매핑을 두고, GPT가 반환한 `tool_calls`에 따라 해당 Handler의 `execute(payload)`를 호출한다. 반환값은 GPT에 tool result로 전달한다.
- **유저 재료 컨텍스트 처리**: 유저 재료 스키마에는 재료 ID만 저장되므로, **id → name 변환은 항상 `get_user_ingredients` 핸들러 내부에서 수행**한다. 이때 Ingredient 마스터를 캐시(예: Redis key `ingredient:by-id:{id}`) 하여 반복 조회를 줄인다. GPT는 이 tool 결과로부터 유저가 보유한 재료명을 이해하고, 이후 대화나 추가 tool call(`search_recipes`)에 활용한다.
- **검색·매칭**: `SearchRecipesHandler`는 Prisma로 Recipe·RecipeIngredient·Ingredient를 조회하고, (필요한 경우) 유저 재료/선호 재료와의 일치도로 매칭 점수를 계산한 뒤 상위 N건을 `SuggestedRecipe[]`로 반환한다. 이때 유저 재료 컨텍스트는 `get_user_ingredients` tool 결과를 통해 간접적으로 주입되며, **Producer가 Kafka 이벤트에 owned/favorites 배열(예: `ownedIngredientIds`, `favoriteIngredientIds`)을 직접 실어 나르지 않는다.**
- **도메인 확장**: 새 도메인(예: 건강 정보, 쇼핑 리스트)을 넣을 때는 새 함수(예: `search_health_tips`)를 tools에 추가하고, 대응하는 Handler를 등록한다. 기존 `ProcessChatHandler`의 tool dispatch 로직만 확장하면 된다.
- **tool call 선택성**: Prompt 설계 시, 모든 질문에서 tool call을 강제하지 않고 “필요하다고 판단될 때에만 `tools` 를 사용하고, 그렇지 않으면 대화 컨텍스트와 프롬프트만으로 답변하라”는 지침을 명시하여 **자연스러운 대화 흐름을 보장**한다.

### 5.3 SSE·로그와의 연동

- **ChatbotStreamEvent와 Function Calling 이벤트**: `ChatbotStreamEvent`에는 Function Calling 관련 이벤트를 추가한다. 예: `type: 'tool_call'` — payload에 `functionName`(예: `search_recipes`), 필요 시 `arguments` 요약 또는 `status`(예: `start` | `complete`)를 담아, 클라이언트가 “레시피 검색 중…”, “함수 실행 완료” 등 상태를 구분할 수 있게 한다. 기존 `chunk`(스트리밍 텍스트), `done`(최종 payload에 suggestedRecipes 등 도메인 JSON 포함), `error`와 함께 스트림 구간별로 발행한다.
- **클라이언트 피드백**: 실제 Function Calling이 일어나는 시점에 Consumer가 `tool_call` 이벤트를 Redis에 발행하면, Producer가 SSE로 그대로 전달하므로 **클라이언트는 서버가 함수(레시피 검색, 유저 재료 조회 등)를 실행 중임을 실시간으로 피드백 받을 수 있다.** UI에서 로딩/스피너 또는 “레시피를 찾고 있어요” 같은 메시지를 표시하는 데 활용한다.
- **Redis·SSE**: Producer가 `chatbot:stream:{streamChannelId}`를 구독하고, Consumer가 `chunk`·`tool_call`·`done`·`error`를 발행한다. Producer는 수신 내용을 그대로 SSE로 클라이언트에 전송하고, `done`/`error` 또는 타임아웃 시 구독 해제한다.
- **ChatbotLog**: 대화 턴별로 요청 메시지, GPT 최종 응답 텍스트, 호출된 function 목록·인자·결과 요약, 최종 도메인 JSON(suggestedRecipes 등)을 Mongoose 스키마에 맞게 저장한다. TTL·인덱스 정책은 `schema.md` 및 Consumer 스키마 정의를 따른다.

### 5.4 대화 히스토리 컨텍스트 처리 (상세)

Consumer 챗봇 모듈은 GPT 호출 전 **대화 히스토리 컨텍스트**를 구성하여, 이전 턴을 반영한 연속 대화를 지원한다.

#### 역할·구성 요소

| 구성 요소 | 파일 | 역할 |
|----------|------|------|
| **대화 메시지 구성** | `consumers/chatbot-request/context/conversation.manager.ts` | `buildMessagesForGpt(previousTurns, newUserMessage)`로 GPT용 메시지 배열 생성. 시스템 프롬프트 + 이전 턴(user/assistant) + 새 사용자 메시지 순서로 구성. |
| **호출처** | `consumers/chatbot-request/handlers/ProcessChatHandler.ts` | GPT 스트리밍 호출 전 `buildMessagesForGpt`를 호출해 `messages`를 얻고, OpenAI API에 전달. |

#### 메시지 배열 구성 규칙

- **순서**: `[ system 메시지, ...이전 턴(user/assistant만), 새 사용자 메시지 ]`
- **시스템 메시지**: `conversation.manager` 내부의 고정 시스템 프롬프트(도구 사용 지침, 응답 형식, **대화 맥락** 지침 포함). “이전 대화를 기억하여 이어가기”, “이미 거절한 레시피 재추천 금지”, “이전에 언급된 재료/레시피 참조” 등을 명시.
- **이전 턴**: `PreviousTurn[]` — `role: 'user' | 'assistant' | 'system'`, `content: string`. GPT 메시지로 넣을 때는 `user`/`assistant`만 사용하며, `system`은 맨 앞 한 번만 사용.

#### 이전 턴(previousTurns) 공급

- **목적**: 동일 `conversationId` 내 이전 user/assistant 메시지를 GPT 컨텍스트에 포함해 연속 대화를 구현.
- **저장소**: MongoDB **ChatbotLog** (`chatbot_logs`). `SaveChatLogHandler`가 턴 종료 시 user 턴·assistant 턴을 각각 `role`, `message`, `context.conversationId`와 함께 저장.
- **조회 설계(확장 방향)**: ProcessChatHandler에서 `conversationId`가 있으면, ChatbotLog를 `userId`·`context.conversationId` 기준으로 조회하고 `createdAt` 순 정렬 후 **최근 N턴**만 취해 `PreviousTurn[]`로 변환. N은 토큰/윈도우 제한을 고려해 정한다(예: 최근 10~20턴). 조회 전용 메서드는 `chatbot-log.repository` 또는 ChatbotLog Model 직접 사용으로 구현.
- **현재 동작**: ProcessChatHandler가 `buildMessagesForGpt([], payload.message)`처럼 **빈 이전 턴**으로 호출할 수 있음. 이전 턴 로딩을 붙일 때는 위 조회 후 `previousTurns`를 채워 전달하면 된다.

#### ProcessChatHandler와의 연동

- Payload에 `conversationId`가 포함되어 있으면, 해당 ID로 ChatbotLog에서 이전 턴을 조회한다.
- 조회한 이전 턴을 `PreviousTurn[]` 형태로 만든 뒤 `buildMessagesForGpt(previousTurns, payload.message)`에 넘긴다.
- Tool call 라운드 내에서는 **같은 요청 내**에서 누적되는 `messages`(assistant tool_calls, tool results)만 유지하며, “이전 턴”은 최초 1회만 조회·구성한다.

#### 토큰·윈도우 고려

- GPT 컨텍스트 윈도우 제한을 지키기 위해 이전 턴 개수 또는 총 메시지 길이에 상한을 두는 것을 권장한다.
- 예: 최근 N턴만 사용, 또는 `message` 길이 합이 일정 바이트/토큰 이하가 되도록 잘라서 사용.

---

## 6. 환경 변수 검증 원칙 및 관리 방식

### 원칙

- **모든 환경 변수는 기본적으로 필수로 간주**하며, **env validation**이 어떤 변수가 필수/선택인지 그 범위를 명시한다. 검증 스키마에서 **필수로 정의된 변수**에 대해 누락·형식 오류가 발생하면 앱 구동을 중단하고, 선택적 변수는 스키마에서 optional로 표현한다. 새 환경 변수를 도입할 때는 항상 각 앱의 `config/env.validation.ts`에 추가하여 필수/선택 여부를 명확히 한다.
- **코드에서는 환경 변수에 대해 `??` 또는 `||` 연산자를 사용하지 않는다.** 조회 시에는 **`ConfigService.getOrThrow()`** 또는 **`process.env.VAR_NAME!`** 로 단언하여 사용한다.

### 관리 방식

- **Producer·Consumer** 모두 **NestJS ConfigModule** + **Joi** 로 앱 기동 시 환경 변수를 검증한다.
- 검증 스키마는 각 앱의 `config/env.validation.ts` 에 정의하며, `ConfigModule.forRoot({ validationSchema, validationOptions })` 로 적용한다.
- 검증 실패 시 앱 구동을 중단하고 오류 메시지를 출력한다.
- 서비스 코드에서는 **`ConfigService.getOrThrow()`** 로 값을 조회하거나, shared 설정 등에서 **`process.env.VAR!`** 로 단언한다. **`get('VAR') ?? default` / `process.env.VAR || default` 는 사용하지 않는다.**
- 각 패키지 루트의 `.env.example` 에 필요한 변수 목록과 예시 값을 둔다.
- **@cook/shared** 는 환경 변수를 직접 검증하지 않는다. `createKafkaConfig`, `createRedisConfig`, `mongooseConfig` 등은 **`process.env.VAR!`** 로 읽어 설정 객체를 반환하며, 실제 검증은 이를 사용하는 Producer/Consumer의 `config/env.validation.ts` 에서 앱 기동 시 수행한다. 즉, 시스템 전체의 “모든 환경 변수는 기본적으로 필수”라는 원칙은 **각 애플리케이션의 validation 스키마를 통해 강제**되며, shared 패키지는 단독으로 앱 구동을 중단시키지 않는다.

### 파일 및 변수 목록

| 구분 | 파일/위치 | 비고 |
|------|-----------|------|
| 검증 | 각 앱 `config/env.validation.ts` | NestJS ConfigModule + Joi. 검증 실패 시 기동 중단 |
| 예시 | 각 패키지 루트 `.env.example` | 필수 변수 목록·예시 값 |
| Shared | env 직접 검증 없음 | createKafkaConfig 등은 process.env 읽어 설정 반환 |

**Producer 필수 환경 변수**: NODE_ENV, PORT, JWT_SECRET, MONGODB_URL, POSTGRESQL_URL, REDIS_URL, KAFKA_BROKERS, KAFKA_CLIENT_ID.

**Consumer 필수 환경 변수**: NODE_ENV, MONGODB_URL, REDIS_URL, KAFKA_BROKERS, KAFKA_CLIENT_ID, KAFKA_CONSUMER_GROUP_ID, OPENAI_API_KEY, OPENAI_CHAT_MODEL.

---

## 7. 공통 설계 원칙 (DB·확장성)

### 7.1 데이터베이스별 최적화 전략

**Prisma (PostgreSQL)**: Select 최적화(필요 필드만), Include 제한(N+1 방지), Batch Operations(createMany/updateMany), Transaction 최소화, Index 활용(@@index, @@unique).

**Mongoose (MongoDB)**: lean() 사용(읽기 전용), select() 제한, 인덱스(복합·TTL), Bulk 연산(insertMany, bulkWrite), Connection Pool(maxPoolSize 등).

### 7.2 데이터베이스 분리 전략

- **PostgreSQL (via Prisma)**: 정규화된 관계형 데이터, ACID 보장 필요 데이터 (User, Recipe, Ingredient, RecipeIngredient).
- **MongoDB (via Mongoose)**: 비정규화된 로그·상태 데이터, 스키마 유연성 필요 데이터 (Inventory, ChatbotLog, EventLog).

### 7.3 확장성 전략

1. **Horizontal Scaling**: Producer/Consumer 모두 인스턴스 증설 가능.
2. **Kafka Partitioning**: 토픽당 파티션 수는 **Consumer 인스턴스 수 이상**으로 설정하고, 초기에는 두 값을 같게 두되 인스턴스 증설 시 파티션 수를 줄이지 않는다.
3. **Redis Cluster**: 캐시 데이터 샤딩.
4. **Database Sharding**: User ID 기반 샤딩 설계 시 고려; MongoDB는 샤드 키 설계 시 동일 원칙 적용.
5. **Connection Pooling**: Prisma(인스턴스당 최적 커넥션 수), Mongoose(`maxPoolSize` 등) 각각 설정.

---

## 8. 모노레포·빌드

| 항목 | 명세 |
|------|------|
| 패키지 매니저 | pnpm |
| 워크스페이스 | 루트 `pnpm-workspace.yaml`: client, server/shared, server/producer, server/consumer |
| 빌드·실행 | 루트 `pnpm install` → shared → producer → consumer 순으로 빌드(`pnpm run build:server` 등) 후 `pnpm run start:producer` / `pnpm run start:consumer` |
| CI | pnpm/action-setup, `pnpm install --frozen-lockfile`, `pnpm --filter @cook/shared build`, `pnpm --filter @cook/producer build`, `pnpm --filter @cook/consumer build` |

---

## 9. 데이터베이스별 주의사항 (Prisma + Mongoose)

### 데이터소스·스키마 소유

| 데이터소스 | 접근 방식 | 스키마·마이그레이션 위치 |
|------------|------------|--------------------------|
| PostgreSQL | Prisma | Shared `src/database/prisma/schema.prisma`, `migrations/` |
| MongoDB | Mongoose | Shared `src/database/mongoose/schemas/*`. Producer/Consumer는 import |

### 데이터소스 구성

- **PostgreSQL**: 단일 데이터소스(`datasource db`)만 사용하며, **Prisma**로 접근한다. 리드 레플리카 사용이 필요한 경우, 애플리케이션에서 Prisma datasource를 추가로 정의하지 않고 DB/프록시 레벨에서 읽기/쓰기를 분리한다.
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
