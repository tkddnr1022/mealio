# 백엔드 개발 지침

에이전트 주도 개발 시 **어떻게** 개발할지 원칙과 방법론을 제시하는 **비정형 문서**이다. **무엇을** 개발할지(파일 단위 명세)는 `../spec/backend_architecture_spec.md`를 참고한다.

---

## 1. 구현 우선순위 (백엔드 전체)

### Phase 1: MVP (핵심 기능)
1. **Prisma 설정**
   - PostgreSQL 스키마 정의 및 마이그레이션 생성/적용
2. **Mongoose 설정**
   - MongoDB 스키마 정의 (`user_ingredients`, `chatbot_logs`, `event_logs` 등)
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

- **테스트 위치**: 모듈 루트 `__tests__/` → Producer는 `controllers/`, `services/` / Consumer는 `consumers/`, `handlers/` 로 구분.
- **의존성**: Controller·Service·Consumer·Handler는 Repository·외부 클라이언트 등을 전부 Mock하여 단위 테스트.
- **TDD 순서**: **Red-Green-Refactor**. 새 API 또는 새 핸들러/컨슈머 추가 시 spec을 먼저 확장 → 실패(Red) → 최소 구현으로 통과(Green) → 리팩터(Refactor). 한 번에 한 동작 단위로 반복하며, Green 구간에서 다른 기능을 추가하지 않는다.

### 2.2 Producer (API)

- **대상**: Controller(라우팅·인증·DTO·Service 호출·HTTP 상태), Service(비즈니스 로직·캐시·Repository·이벤트 발행).
- **테스트 초점**: Controller는 Service Mock 후 호출·예외→상태 매핑 검증. Service는 Repository·캐시·Kafka 등 Mock 후 로직·예외 검증.

### 2.3 Consumer (이벤트 처리)

- **대상**: Consumer(메시지 수신·핸들러 호출·재시도/DLQ 위임), Handler(페이로드 기반 로직·DB·OpenAI·S3 등).
- **테스트 초점**: Consumer는 Handler들을 Mock한 뒤 메시지 파싱·핸들러 호출 순서·예외 시 재시도/DLQ 검증. Handler는 OpenAIService·Repository 등 Mock 후 `execute(payload)` 동작·반환·예외 검증.
- **적용 범위**: recipe-generation, chatbot-requests 등 각 consumer 모듈별로 consumer.spec + handlers/*.spec 작성.

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

---

## 5. 챗봇 SSE 스트리밍 흐름

1. **클라이언트 → Producer**: `POST /api/v1/chatbot/messages` 로 SSE 연결을 생성하고 유지한다.
2. **Producer**: 요청별 `streamChannelId` 를 생성하고, Kafka(`CHATBOT_REQUESTS`)에 이벤트를 발행한다(`streamChannelId` 포함).
3. **Producer**: Redis 채널 `chatbot:stream:{streamChannelId}` 를 구독한다.
4. **Consumer**: Kafka 메시지 수신 후 (필요 시) 의도 분류/도메인 태깅 페이즈를 거쳐 GPT 스트리밍 호출을 수행하고, `ChatbotStreamEvent` 타입 이벤트를 동일 Redis 채널에 발행한다. (`type: 'intent'` | `'chunk'` | `'done'` | `'error'`)
5. **Producer**: Redis 수신 메시지(`ChatbotStreamEvent`)를 SSE 형식(`data: {JSON}\n\n`)으로 클라이언트에 전송한다.
6. **종료 조건**: Consumer가 `type: 'done'` 또는 `type: 'error'` 를 발행하면 Producer는 스트림을 종료하고 Redis 구독을 해제한다. 타임아웃(예: 120초) 도달 시에도 동일하게 종료한다.

---

## 6. RAG 목표·흐름·도메인 확장 원칙

### 6.1 목표

- **핵심 범위**: 유저, 재료, 레시피, 유저 보유 재료, 유저 관심 재료, 챗봇 로그, 이벤트 로그를 기반으로 한 **레시피 추천/요리 보조 RAG** 구현.
- **확장**: 동일한 챗봇 인터페이스를 유지한 채, **다른 도메인(예: 건강 정보, 쇼핑 리스트, 식단 플랜 등)의 데이터 소스**를 추가로 연결할 수 있도록 설계한다.

### 6.2 도메인 RAG 흐름 (레시피 추천)

1. **Kafka 이벤트 수신**: `ChatbotRequestEvent` (userId, sessionId, conversationId, 자연어 입력, 의도 분류/도메인 태그). 의도 분류는 LLM 프롬프트 기반(예: `chatbot-intent-classification`)으로 JSON 반환.
2. **컨텍스트 수집** (`rag-context.builder.ts`): user-context.source(User, UserIngredient), recipe-context.source(Recipe, RecipeIngredient, Ingredient), chatbot-log-context.source(ChatbotLog), event-context.source(EventLog).
3. **LLM 입력 구조화**: userProfile, inventory, candidateRecipes, history, events 등 공통 스키마로 요약·축약.
4. **OpenAI 호출**: `ProcessChatHandler` + `OpenAIService` — chatbot-response 프롬프트에 RagContext 주입, 스트리밍 응답을 `ChatbotStreamEvent` 로 Redis 발행.
5. **로그 및 피드백 루프**: `UpdateContextHandler` 가 ChatbotLog, EventLog 에 결과 저장.

### 6.3 도메인 확장 시 설계 원칙

1. **새 도메인은 새로운 `IRagContextSource` 구현으로 추가** (예: `health-context.source.ts`). 외부에는 `fetch(query: RagQuery)` 만 노출.
2. **도메인별 스키마는 `schema.md`와 각 스토리지 스키마에 명확히 반영**.
3. **챗봇 프롬프트는 도메인-불인지 + 도메인-특화 섹션을 분리** (공통: 사용자/세션/최근 대화; 도메인별: 레시피/쇼핑/건강 등).
4. **도메인 추가 시 기존 RAG 흐름을 깨지 않는다**: `rag-context.builder` 의 `enabledSources` 에 새 소스만 등록, 의도 분류 로직만 확장.

---

## 7. 환경 변수 검증 원칙 및 관리 방식

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

## 8. 공통 설계 원칙 (DB·확장성)

### 8.1 데이터베이스별 최적화 전략

**Prisma (PostgreSQL)**: Select 최적화(필요 필드만), Include 제한(N+1 방지), Batch Operations(createMany/updateMany), Transaction 최소화, Index 활용(@@index, @@unique).

**Mongoose (MongoDB)**: lean() 사용(읽기 전용), select() 제한, 인덱스(복합·TTL), Bulk 연산(insertMany, bulkWrite), Connection Pool(maxPoolSize 등).

### 8.2 데이터베이스 분리 전략

- **PostgreSQL (via Prisma)**: 정규화된 관계형 데이터, ACID 보장 필요 데이터 (User, Recipe, Ingredient, RecipeIngredient).
- **MongoDB (via Mongoose)**: 비정규화된 로그·상태 데이터, 스키마 유연성 필요 데이터 (UserIngredient, ChatbotLog, EventLog).

### 8.3 확장성 전략

1. **Horizontal Scaling**: Producer/Consumer 모두 인스턴스 증설 가능.
2. **Kafka Partitioning**: 토픽당 파티션 수는 **Consumer 인스턴스 수 이상**으로 설정하고, 초기에는 두 값을 같게 두되 인스턴스 증설 시 파티션 수를 줄이지 않는다.
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
| CI | pnpm/action-setup, `pnpm install --frozen-lockfile`, `pnpm --filter @cook/shared build`, `pnpm --filter @cook/producer build`, `pnpm --filter @cook/consumer build` |

---

## 10. 데이터베이스별 주의사항 (Prisma + Mongoose)

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
