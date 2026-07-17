# Chatbot 절차 (OpenAI Responses API · Function Calling 기반)

유저 메시지를 Kafka로 받아 Responses API Function Calling으로 처리하고, Redis 스트림·SSE로 전달하며, 대화 연속성·크레딧을 멱등하게 관리하는 파이프라인의 **절차·계약·체이닝 SSOT**이다.

---

## 1. 개요

```
Client → Producer (POST /api/v1/chatbot/messages, SSE)
       → Kafka (chatbot-requests)
       → Consumer (ProcessChatHandler + tools)
       → OpenAI Responses API
       → Redis (chatbot:stream:{streamChannelId})
       → Producer SSE → Client
       → ChatbotLog / ChatbotConversation / Credit deduction
```

모델이 필요 시 도메인 함수(`search_recipes`, `get_user_inventory` 등)를 호출하고, 그 결과를 반영한 최종 응답을 생성한다. 대화 연속성은 서버 사이드 `previous_response_id` 체이닝으로 유지한다.

---

## 2. 아키텍처

### 2.1 SSOT (Single Source of Truth)

| 계층 | 저장소 | 역할 |
|------|--------|------|
| **대화 메타·체이닝** | MongoDB `chatbot_conversations` | `title`·`updatedAt`·Responses 체이닝용 `lastResponseId`의 **유일한 진실 원천** |
| **대화 턴 로그** | MongoDB `chatbot_logs` | 감사·분석·목록 표시용 턴 로그(TTL 30일). GPT 컨텍스트 재구성 용도 아님 |
| **크레딧** | PostgreSQL `User.creditBalance` + `chatbot_credit_deductions` | 잔액 SSOT. 차감 멱등 키는 `stream_channel_id`(PK) |
| **도메인 조회** | PostgreSQL (Recipe·Ingredient 등) + MongoDB `inventories` | tool handler가 필요 시 조회. Kafka 페이로드에 도메인 스냅샷을 실지 않음 |
| **Kafka** | `chatbot-requests` | 요청 핸드오프 큐. SSOT 아님 |
| **Redis 스트림** | `chatbot:stream:{streamChannelId}` | SSE 중계 채널. SSOT 아님 |
| **OpenAI Responses** | `store: true` response | `previous_response_id` 체이닝용 서버 사이드 상태. 보존 기간 만료 시 참조 실패 가능 |

### 2.2 수행 주체·데이터 흐름

| 단계 | 수행 주체 | 구동 | 구현 경로 |
|------|-----------|------|-----------|
| 메시지 수신·SSE | Producer ChatbotModule | HTTP | `server/producer/src/modules/chatbot/` |
| 요청 발행 | Producer ChatbotService | Kafka publish | 동일 모듈 + `@mealio/shared` `KAFKA_TOPICS.CHATBOT_REQUESTS` |
| 턴 처리 | Consumer chatbot-request | Kafka consume | `server/consumer/src/consumers/chatbot-request/` |
| tool 실행 | ProcessChatHandler → Handlers | Function Calling | `handlers/`, `tools/` |
| 스트림 중계 | Consumer ↔ Redis ↔ Consumer | pub/sub | `@mealio/shared` `getChatbotStreamChannel` |
| 로그·메타·크레딧 | SaveChatLog / SyncConversationMeta / ChatbotCreditService | 턴 성공 후 | 각 Handler·Service |

```
Client ──→ POST /api/v1/chatbot/messages ──→ Producer
                                            ├──→ Kafka (chatbot-requests, key=conversationId)
                                            └──→ Redis subscribe (chatbot:stream:{streamChannelId}) ──→ SSE → Client

Kafka ──→ chatbot-request consumer
            ├── ProcessChatHandler → OpenAI Responses (instructions + tools + previous_response_id)
            │     ├── tool_call → Inventory / SearchRecipes / FoodCategories / FinalizeRecipeSelection
            │     └── Redis publish (chunk | tool_call | done | error)
            ├── SaveChatLogHandler → MongoDB chatbot_logs
            ├── SyncConversationMetaHandler → MongoDB chatbot_conversations
            └── ChatbotCreditService → PostgreSQL credit + cache-invalidation(USER_PROFILE)
```

### 2.3 SSE 계약 (Producer/Consumer/Shared)

| 항목 | 명세 |
|------|------|
| Redis 채널 | `chatbot:stream:{streamChannelId}` (`@mealio/shared` `getChatbotStreamChannel`) |
| 이벤트 타입 | `ChatbotStreamEvent`: `type: 'chunk' \| 'done' \| 'error' \| 'tool_call'` |
| `done.data` | `conversationId`, `isCreditDepleted`, 선택 `suggestedRecipes` |
| Kafka 토픽 | `CHATBOT_REQUESTS` (`@mealio/shared` `KAFKA_TOPICS`) |
| SSE 타임아웃 | Producer `server/producer/src/policy/chatbot.policy.ts` |

파일·DTO 목록은 `../spec/backend_architecture_spec_producer.md` §1.1·§1.2를 따른다.

### 2.4 Kafka·파티션·DLQ

| 항목 | 명세 |
|------|------|
| 토픽 | `chatbot-requests` / DLQ `chatbot-requests-dlq` |
| 컨슈머 그룹 | `chatbot-group` |
| 파티션 키 | `conversationId` — 동일 대화 순서 보장 |
| 페이로드 | `userId`, `message`, `conversationId?`, `streamChannelId` 등 **최소 메타데이터**. 유저 재료·레시피 스냅샷은 포함하지 않음 |
| 발행 | Producer `POST /api/v1/chatbot/messages` 등 |
| 수신 | ProcessChatHandler → tools → SaveChatLogHandler → SyncConversationMetaHandler → Redis 스트림 · 성공 시 ChatbotCreditService |

토픽 표 SSOT: `../spec/backend_architecture_spec_consumer.md` §2.2.

### 2.5 핵심 구현 경로

| 경로 | 역할 |
|------|------|
| `server/producer/src/modules/chatbot/` | SSE·대화 목록/상세 API, Kafka 발행, Redis 구독 |
| `server/consumer/src/consumers/chatbot-request/handlers/ProcessChatHandler.ts` | Responses 스트리밍·Function Calling·Redis 발행·`lastResponseId` 저장·크레딧 차감 트리거 |
| `server/consumer/src/consumers/chatbot-request/tools/chatbot-tools.definition.ts` | Responses 평탄 tools 배열 SSOT |
| `server/consumer/src/consumers/chatbot-request/tools/tool-dispatcher.ts` | function name → Handler |
| `server/consumer/src/consumers/chatbot-request/context/conversation.manager.ts` | `CHATBOT_SYSTEM_INSTRUCTIONS` |
| `server/consumer/src/consumers/chatbot-request/services/chatbot-credit.service.ts` | 멱등 크레딧 차감 |
| `server/shared/src/policy/user-credits.policy.ts` | `computeChatbotCreditCost`, `DEFAULT_USER_CREDIT_*` |
| `server/consumer/src/policy/recipe-search.policy.ts` | `search_recipes` ANN·재랭킹 가중치 |
| `server/consumer/src/policy/chatbot-cache.policy.ts` | 챗봇 Redis 캐시 TTL |

---

## 3. 실행 시나리오 (End-to-End)

1. **유저 요청 → Producer**: 클라이언트가 `POST /api/v1/chatbot/messages` 등으로 요청. Producer는 `streamChannelId` 생성 후 Kafka(`CHATBOT_REQUESTS`)에 이벤트 발행한다. 페이로드는 **userId, conversationId, 자연어 입력 등 최소 메타데이터 중심**으로 구성해 통신 비용과 관심사를 분리한다.
2. **Consumer 수신 → ProcessChatHandler**: Kafka 메시지 수신 후 `ProcessChatHandler`가 실행된다. payload에는 userId, conversationId, 자연어 입력 등만 포함되며, **유저 재료·레시피 등 도메인 데이터는 필요할 때마다 tool call을 통해 조회**한다.
3. **Responses Function Call (선택적)**: `client.responses.create({ stream: true, store: true })`에 **tools**(평탄 함수 정의)·**instructions**(시스템 프롬프트)·신규 `input`(첫 round는 user message)을 넘긴다. `ChatbotConversation.lastResponseId`가 있으면 `previous_response_id`로 체이닝한다. `tool_choice: 'auto'`로 tool 여부·횟수는 모델이 판단한다. 예를 들어,
   - 단순 잡담·레시피 추천 철학 등은 **tool call 없이** 응답한다.
   - 유저 보유 재료가 필요하면 `get_user_inventory`를 호출한다.
   - 레시피 검색이 필요하면 `search_recipes`를 호출한다. 사용자 발화에서 해석한 조건(키워드, 조리시간/인분 범위, 포함/제외 재료명, 카테고리 id 등)은 **`search_recipes` 인자에 명시적으로 전달**한다. 예: `search_recipes({ keywords: ['간단','저녁'], cookTime: { lte: 30 }, avoidIngredients: ['우유'] })`.
4. **도메인 Tool Handlers**:
   - **InventoryHandler (`get_user_inventory`)**: MongoDB의 `Inventory` 문서에서 `ingredients.owned`, `ingredients.favorite`, `recipes.favorite` 컨텍스트를 조회한 뒤, 재료 ID는 **PostgreSQL(Prisma) `Ingredient` 마스터와 조인**하여 `[{ id, name, ... }]` 정보를 보강해 반환한다. 재료 마스터는 Redis 등으로 캐싱하여 id → name 변환을 효율적으로 수행한다.
   - **SearchRecipesHandler (`search_recipes`)**: §5 semantic-first 파이프라인을 따른다.
   - **FoodCategoriesHandler (`get_food_categories`)**: 레시피·재료 카테고리 마스터 조회(Redis 캐시 1시간).
   - **FinalizeRecipeSelectionHandler (`finalize_recipe_selection`)**: 챗봇 추천 레시피 최종 선택·확정.
5. **tool round 체이닝**: `response.output`에 `function_call` 아이템이 있으면 Handler 실행 후 `{ type: 'function_call_output', call_id, output }`를 다음 round `input`으로 보내고, `previous_response_id`는 직전 round의 `response.id`를 사용한다. `instructions`와 `tools`는 **매 요청마다 재전송**한다(`previous_response_id`가 top-level `instructions`·`tools`를 이어받지 않음).
6. **최종 응답·상태 저장**: 텍스트 응답이 완료되면 `ChatbotConversation.lastResponseId`에 최종 `response.id`를 저장한다. 스트리밍 텍스트는 `response.output_text.delta`, 종료·usage는 `response.completed` 이벤트를 사용한다.
7. **크레딧 차감 → Redis `done`**: 성공 종료 직전 `ChatbotCreditService.debitForCompletedChatbotTurn`으로 멱등 차감 후 `done.data.isCreditDepleted`에 반영한다(§7).
8. **Redis 발행 → Producer SSE**: Consumer는 `ChatbotStreamEvent`(type: `chunk` | `tool_call` | `done` | `error`)를 Redis 채널에 발행한다. Producer는 해당 채널을 구독하여 SSE로 클라이언트에 전달한다.
9. **MongoDB 로깅·메타**: 스트림 종료 후 **ChatbotLog**에 대화 턴·usage 등을 `SaveChatLogHandler`가 저장한다. 성공 턴 후 `SyncConversationMetaHandler`가 `chatbot_conversations`를 동기화한다(§8). 대화 연속성 컨텍스트는 ChatbotLog 재구성이 아니라 Responses 체이닝으로 유지한다(§6).

---

## 4. Function 정의·핸들러 설계 원칙

- **함수 정의 (Responses tools)**: Responses API의 평탄 구조 `{ type: 'function', name, description, parameters, strict }`로 `search_recipes`, `get_user_inventory`, `get_food_categories`, `finalize_recipe_selection` 등을 정의한다. 구현 SSOT는 `chatbot-tools.definition.ts`.
  - `search_recipes` 예시: `parameters`에 `keywords`, `ingredientIds`, `mustHaveIngredients`, `avoidIngredientIds`, `avoidIngredients`, `cookTime`, `servings`, `recipeCategoryIds`, `ingredientCategoryIds`를 두어, 파싱된 조건이 숨은 서버 상태 없이 tool 인자만으로 재현되게 한다.
- **핸들러 매핑**: Consumer 내에서 function name → Handler 인스턴스 매핑을 두고, `function_call` 아이템의 `name`/`arguments`/`call_id`에 따라 Handler를 실행한다. 반환 문자열은 `function_call_output.output`으로 다음 Responses 요청에 전달한다.
- **유저 재료 컨텍스트 처리**: 유저 재료 스키마에는 재료 ID만 저장되므로, **id → name 변환은 항상 `get_user_inventory` 핸들러 내부에서 수행**한다. Ingredient 마스터를 캐시(예: Redis key `ingredient:by-id:{id}`) 하여 반복 조회를 줄인다.
- **검색·매칭**: `SearchRecipesHandler`는 §5 파이프라인으로 상위 N건을 `SearchedRecipe[]`로 반환한다. 유저 재료 컨텍스트는 `get_user_inventory` tool 결과의 `ingredientIds`로 `inventoryMatchScore`에 반영하며, Producer 이벤트는 최소 메타데이터 계약을 따른다.
- **도메인 확장**: 새 도메인(예: 건강 정보, 쇼핑 리스트)을 넣을 때는 새 함수(예: `search_health_tips`)를 tools에 추가하고, 대응하는 Handler를 등록한다. 기존 `ProcessChatHandler`의 tool dispatch 로직만 확장하면 된다.
- **tool call 선택성**: Prompt(`instructions`)에 “필요하다고 판단될 때에만 tools를 사용한다”는 지침을 명시해 자연스러운 대화 흐름을 보장한다.

---

## 5. `search_recipes` (semantic-first)

Function call 인자를 받아 다음 순서로 레시피 후보를 수집·재랭킹한다.

| 단계 | 동작 |
|------|------|
| 0 | `mustHaveIngredients`·`avoidIngredients` 재료명을 `IngredientSemanticResolverService`로 exact → `IngredientEmbedding` ANN 해상(임계값 `INGREDIENT_VECTOR_MATCH_THRESHOLD`) |
| 1 | 구조화 질의 텍스트 구성(해상된 canonical name 반영) |
| 2 | LLM Query Expansion — Responses Structured Outputs(`json_schema`, `recipe_search_query_expansion`) (실패 시 원질의 fallback) |
| 3 | pgvector ANN top-K (`RecipeEmbeddingRepository.searchTopK`, 해상된 `avoidIngredientIds` 병합 제외) |
| 4 | hard constraint(`isPublished`, 기피 재료) 적용 후 Prisma 상세 조회 |
| 5 | semantic·keyword·inventory·user preference·soft constraint 가중 재랭킹 |

- `mustHaveIngredients`는 해상 ID 기준 **soft signal**, `cookTime`/`servings`/카테고리도 **soft signal**(탈락이 아닌 점수화)로 처리한다.
- `ingredientIds`는 보유 재료 매칭 가산점에 사용한다. 유저 재료 기반 추천이 필요하면 모델이 먼저 `get_user_inventory`를 호출해 id 배열을 `search_recipes`에 전달하도록 유도한다.
- 검색 결과는 `SearchedRecipe[]`(최대 10건, `reasonSignals`·점수 포함) 형태로 반환한다.
- 튜닝 상수: `server/consumer/src/policy/recipe-search.policy.ts`
- 관련 서비스: `recipe-search-query.service.ts`, `recipe-search-query-expansion.service.ts`, `ingredient-semantic-resolver.service.ts`

홈 피드 개인화 목록(`GET /api/v1/recipes/recommended`, `UserRecipeRecommendation` SSOT)과 역할을 분리한다. 챗봇 `SuggestedRecipe`와 추천 SSOT를 직접 동기화하지 않으며, 필요 시 추천 API를 tool로 호출하는 식으로 계약을 확장한다.

---

## 6. SSE·로그와의 연동

- **ChatbotStreamEvent와 Function Calling 이벤트**: `type: 'tool_call'` — payload에 `functionName`(예: `search_recipes`), 필요 시 `arguments` 요약 또는 `status`(예: `start` | `complete`)를 담아, 클라이언트가 “레시피 검색 중…”, “함수 실행 완료” 등 상태를 구분할 수 있게 한다. 기존 `chunk`(스트리밍 텍스트), `done`(최종 payload에 suggestedRecipes 등 도메인 JSON 포함), `error`와 함께 스트림 구간별로 발행한다.
- **클라이언트 피드백**: Function Calling 시점에 Consumer가 `tool_call`을 Redis에 발행하면 Producer가 SSE로 그대로 전달하므로, 클라이언트가 함수 실행 중임을 실시간으로 피드백받을 수 있다. UI에서 로딩/스피너 또는 “레시피를 찾고 있어요” 같은 메시지에 활용한다.
- **Redis·SSE**: Producer가 `chatbot:stream:{streamChannelId}`를 구독하고, Consumer가 `chunk`·`tool_call`·`done`·`error`를 발행한다. Producer는 수신 내용을 그대로 SSE로 클라이언트에 전송하고, `done`/`error` 또는 타임아웃 시 구독 해제한다.
- **ChatbotLog**: 대화 턴별로 요청 메시지, 최종 응답 텍스트, usage, 도메인 JSON(suggestedRecipes 등)을 Mongoose 스키마에 맞게 저장한다. TTL·인덱스 정책은 `../../common/schema.md` 및 shared Mongoose 스키마 정의를 따른다.

---

## 7. Responses `previous_response_id` 체이닝

Consumer 챗봇 모듈은 OpenAI 서버 사이드 상태로 연속 대화를 유지한다. ChatbotLog에서 이전 턴을 읽어 메시지 배열을 재구성하지 않는다.

### 7.1 역할·구성 요소

| 구성 요소 | 파일 | 역할 |
|----------|------|------|
| **instructions** | `consumers/chatbot-request/context/conversation.manager.ts` | `CHATBOT_SYSTEM_INSTRUCTIONS` — 매 Responses 요청마다 top-level `instructions`로 전달 |
| **체이닝 상태** | `ChatbotConversation.lastResponseId` | 대화별 마지막 `response.id`. `getLastResponseId`/`saveLastResponseId`로 읽고 쓴다 |
| **호출처** | `consumers/chatbot-request/handlers/ProcessChatHandler.ts` | 첫 round `input`=현재 user message(+ optional `previous_response_id`), tool round `input`=`function_call_output[]` |

### 7.2 요청 규칙

- **매 요청 재전송**: `instructions`와 `tools`는 `previous_response_id`가 있어도 항상 함께 보낸다.
- **첫 턴 / lastResponseId 없음**: 현재 사용자 메시지만으로 새 Responses 체인을 시작한다.
- **연속 턴**: 저장된 `lastResponseId`를 `previous_response_id`로 전달하고, `input`에는 신규 user message만 넣는다.
- **tool round**: 직전 round `response.id`를 `previous_response_id`로, `input`에는 `function_call_output` 아이템만 넣는다(최대 5 round).
- **오류**: `previous_response_id` 만료·무효 등으로 API가 실패하면 기존 Consumer 오류 이벤트·DLQ 경로로 전달한다. 이력 재구성이나 자동 재시도를 추가하지 않는다.

### 7.3 저장·보존

- 턴이 텍스트로 종료되면(또는 max tool round 소진 후) 최종 `response.id`를 `lastResponseId`에 upsert한다.
- OpenAI에 `store: true`로 저장된 response의 보존 기간이 지나면 `previous_response_id` 참조가 실패할 수 있다. 운영 시 보존 기간을 확인하고, 만료 오류는 일반 ProcessChat 오류·DLQ 정책으로 처리한다.
- **ChatbotLog**는 감사·분석·목록 표시용으로 계속 저장하며, GPT 컨텍스트 재구성 용도로 사용하지 않는다.

---

## 8. 크레딧 멱등 차감 및 스트림 `done` 계약

| 항목 | 명세 |
|------|------|
| 잔액·한도 | Prisma `User.creditBalance` / `User.creditMonthlyLimit` |
| 멱등 테이블 | `ChatbotCreditDeduction` (`chatbot_credit_deductions`, PK `stream_channel_id`) |
| 비용 계산 | `@mealio/shared` `computeChatbotCreditCost`, `TOKENS_PER_CREDIT`, `DEFAULT_USER_CREDIT_*` (`user-credits.policy.ts`) |
| 서비스 | `ChatbotCreditService.debitForCompletedChatbotTurn` |
| 멱등 방식 | 동일 `streamChannelId`에 `createMany` + `skipDuplicates`로 슬롯 확보 후 `usage.totalTokens` 기반 비용만큼 `creditBalance` 감소(잔액 하한 클램프). 재처리 시 이중 차감 없음 |
| 캐시 정합 | 신규 차감이 발생한 경우에만 `cache-invalidation`(USER_PROFILE) 발행 |
| 스트림 반영 | Redis `done` (`ChatbotStreamDoneEvent`)의 `data.isCreditDepleted`에 차감 결과 포함 |

---

## 9. 대화 메타 동기화

성공 턴 후 `SyncConversationMetaHandler`가 `chatbot_conversations`를 갱신한다.

| 이벤트 | 동작 |
|--------|------|
| `chatbot.start` | LLM으로 `title`·메타 생성 (`createWithTitle`, `titleSource: llm`) |
| `chatbot.message` | `updatedAt` 갱신 (`touchUpdatedAt`) |

- REST 대화 목록의 정렬·커서·표시 시각은 `chatbot_conversations.updatedAt`을 사용한다(로그의 마지막 메시지 시각과 별개).
- 메시지 본문은 `chatbot_logs`에만 둔다. 스키마 상세는 `../../common/schema.md` §3.2·§3.2.1.

---

## 10. 관련 명세·스키마

| 문서 | 용도 |
|------|------|
| `../spec/backend_architecture_spec_producer.md` §1.1·§1.2 | Producer 모듈·DTO·SSE 계약 파일 목록 |
| `../spec/backend_architecture_spec_consumer.md` §2.2~§2.4 | 토픽·핸들러 파일·크레딧 요약 |
| `../spec/backend_architecture_spec_shared.md` | Redis 채널·이벤트 타입·크레딧 정책·스키마 위치 |
| `../../common/schema.md` | ChatbotLog·ChatbotConversation·`chatbot_credit_deductions` |
| `../../common/openapi_spec_backend.yaml` | `POST /api/v1/chatbot/messages` 등 API 계약 |
| `../guidelines/backend_development_guidelines.md` | TDD·Producer/Consumer 공통 설계 원칙 |
