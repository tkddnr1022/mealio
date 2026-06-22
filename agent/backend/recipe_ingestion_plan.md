# Recipe Ingestion 구현 계획 (Phase별)

`recipe_ingestion_guidelines.md`에 정의된 OpenAI Batch API 기반 레시피 수집 파이프라인을 **단계적으로 구현**하기 위한 실행 계획이다.

---

## 참조 문서

| 문서 | 용도 |
|------|------|
| `guidelines/recipe_ingestion_guidelines.md` | 파이프라인 절차·상태 전이·멱등성 **SSOT (절차)** |
| `spec/backend_architecture_spec_consumer.md` | Consumer 패키지 파일·토픽 **명세 (구현 후 동기화 대상)** |
| `spec/backend_architecture_spec_shared.md` | Mongoose·Prisma·Kafka 상수 |
| `../common/schema.md` | Recipe·Ingredient 도메인 스키마 |
| `guidelines/backend_development_guidelines.md` | TDD·Producer/Consumer 설계·standalone job 패턴 |

---

## 파이프라인 개요

```
[fetch] → [parse-submit] → [parse-retrieve] → [persist] → [embed-submit] → [embed-retrieve]
```

| 단계 | 수행 주체 | 구동 | 경로 |
|------|-----------|------|------|
| fetch | standalone job | cron → CLI | `server/consumer/src/jobs/recipe-ingestion-fetch/` |
| parse-submit | standalone job + always-on consumer | CLI + Kafka 구독 | `server/consumer/src/jobs/recipe-ingestion-parse-submit/`, `server/consumer/src/consumers/recipe-ingestion-parse-submit/` |
| parse-retrieve | standalone job | cron → CLI | `server/consumer/src/jobs/recipe-ingestion-parse-retrieve/` |
| persist | standalone job + always-on consumer | CLI + Kafka 구독 | `server/consumer/src/jobs/recipe-ingestion-persist/`, `server/consumer/src/consumers/recipe-ingestion-persist/` |
| embed-submit | standalone job + always-on consumer | CLI + Kafka 구독 | `server/consumer/src/jobs/recipe-ingestion-embed-submit/`, `server/consumer/src/consumers/recipe-ingestion-embed-submit/` |
| embed-retrieve | standalone job | cron → CLI | `server/consumer/src/jobs/recipe-ingestion-embed-retrieve/` |

**SSOT**: MongoDB `recipe_ingestion_jobs` (파이프라인) · PostgreSQL (레시피·RecipeEmbedding 도메인) · Kafka (parse-submit·persist·embed-submit 트리거)

---

## 공공데이터 API

식품의약품안전처 Open API **조리식품의 레시피 DB**에서 원본을 가져온다. 상세 절차·응답 코드 처리는 `guidelines/recipe_ingestion_guidelines.md` §4를 따른다.

### 요청 URL

```
http://openapi.foodsafetykorea.go.kr/api/{keyId}/{serviceId}/{dataType}/{startIdx}/{endIdx}
```

### fetch 단계에서 사용하는 인자

| 인자 | 출처 | 값 |
|------|------|-----|
| `keyId` | `PUBLIC_DATA_API_KEY` | Open API 인증키 |
| `serviceId` | `public-data-api.client.ts` `PUBLIC_DATA_SERVICE_ID` | 조리식품 레시피 DB serviceId |
| `dataType` | `public-data-api.client.ts` `PUBLIC_DATA_TYPE` | `json` |
| `startIdx` | fetch 로직 계산 | `last_end_idx + 1` |
| `endIdx` | fetch 로직 계산 | `startIdx + fetchLimit - 1` |

**미사용 (선택 쿼리)**: `RCP_NM`, `RCP_PARTS_DTLS`, `CHNG_DT`, `RCP_PAT2`

### API 제약·응답

- 1회 요청 최대 **1000건** (`ERROR-336`) — `fetchLimit` ≤ 1000
- `INFO-000`: 정상 · row 파싱 후 upsert
- `INFO-200`: 데이터 없음 · 0건 종료
- `INFO-100` / `INFO-300` / `INFO-400` / `ERROR-5xx` 등: 가이드라인 표의 재시도·실패 정책

### 페이징 vs 멱등 키

| 저장·필드 | 용도 |
|-----------|------|
| `recipe_ingestion_state.last_end_idx` | API `startIdx`/`endIdx` 순번 커서 |
| `recipe_ingestion_jobs.source_id` | 응답 `RCP_SEQ` (Number) — upsert 멱등 키 |

---

## Phase 의존 관계

```mermaid
flowchart LR
  P0[Phase 0<br/>기반·스키마] --> P1[Phase 1<br/>fetch]
  P0 --> P2[Phase 2<br/>parse-submit]
  P1 --> P2
  P2 --> P3[Phase 3<br/>parse-retrieve]
  P3 --> P4[Phase 4<br/>persist]
  P4 --> P5[Phase 5<br/>embed]
  P5 --> P6[Phase 6<br/>운영·관측]
  P0 --> P4
```

| Phase | 이름 | 핵심 산출 | 가이드라인 대응 |
|-------|------|-----------|-----------------|
| 0 | 기반·스키마 | Mongoose·Kafka·공통 상수·env | §2.6, §3 |
| 1 | fetch | 공공데이터 수집 job | §5.1 |
| 2 | parse-submit | OpenAI Parse Batch 제출 job | §5.2, §6 |
| 3 | parse-retrieve | Parse Batch 완료 조회·결과 반영 job | §5.3 |
| 4 | persist | Kafka consumer + PG 영속화 | §5.4, §2.5 |
| 5 | embed | Embedding Batch 제출·RecipeEmbedding upsert | §5.5, §5.6 |
| 6 | 운영·관측 | ECS/cron·메트릭·재시도·명세 동기화 | §2.3, §2.6, §7 |

---

## Phase 0 — 기반·스키마

**목표**: 파이프라인 SSOT 컬렉션·Kafka 계약·공통 상수를 먼저 고정하여 이후 Phase가 동일 계약 위에서 개발되도록 한다.

**선행 조건**: 없음

### 작업 항목

- [ ] MongoDB `recipe_ingestion_state` Mongoose 스키마 — `last_end_idx` API 커서 (singleton)
- [ ] MongoDB `recipe_ingestion_jobs` Mongoose 스키마·모델 정의
  - 필드: `source_id`(Number, unique, API `RCP_SEQ`), `status`, `retry_count`, `raw_data`, `batch_id`, `retrieved_data`, `error_message`, 타임스탬프(`fetched_at` ~ `failed_at`)
  - `status` enum: `fetched | parse_submitting | parse_submitted | parse_retrieving | parse_retrieved | persisting | persisted | embed_submitting | embed_submitted | embed_retrieving | embed_retrieved | failed`
- [ ] `RecipeIngestionJobRepository` (MongoDB) — upsert·조건부 status 전환(낙관적 락)·batch 단위 조회
- [ ] `RecipeIngestionStateRepository` — `last_end_idx` get/set
- [ ] `@mealio/shared` Kafka 상수 등록 (기존 토픽과 동일 — `backend_architecture_spec_consumer.md` §2.2)
  - `KAFKA_TOPICS.RECIPE_INGESTION_PARSE_SUBMIT_TRIGGERED`: `recipe-ingestion-parse-submit-triggered`
  - `KAFKA_TOPICS.RECIPE_INGESTION_PERSIST_TRIGGERED`: `recipe-ingestion-persist-triggered`
  - `KAFKA_TOPICS.RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED`: `recipe-ingestion-embed-submit-triggered`
  - 각 DLQ: `*-dlq` 접미사
  - 로컬: Producer `KafkaAdminService`가 상수 목록 기준 메인·DLQ 자동 생성 (`APP_ENV === production`에서는 생성 스킵)
- [ ] `CONSUMER_GROUPS` 추가
  - `RECIPE_INGESTION_PARSE_SUBMIT` (`recipe-ingestion-parse-submit-group`)
  - `RECIPE_INGESTION_PERSIST` (`recipe-ingestion-persist-group`)
  - `RECIPE_INGESTION_EMBED_SUBMIT` (`recipe-ingestion-embed-submit-group`)
- [ ] lag·메트릭용 토픽↔그룹 매핑 **양쪽** 갱신
  - `reliability/monitoring/topic-consumer-group.map.ts` (processor 메트릭·DLQ 라벨)
  - `reliability/monitoring/consumer-lag.monitor.ts` (`GROUP_TOPIC_MAP` — lag 수집)
- [ ] `env.validation.ts` — 공공데이터 API·OpenAI Batch 관련 변수 검증
  - `PUBLIC_DATA_API_KEY` (필수)
  - `OPENAI_BATCH_MODEL` (필수 — Batch JSONL `body.model`. `OPENAI_CHAT_MODEL`과 분리)
- [ ] `public-data-api.client.ts` — `PUBLIC_DATA_SERVICE_ID`, `PUBLIC_DATA_TYPE`(`json`) 상수
- [ ] Consumer `.env.example`에 위 변수·예시 값 반영
- [ ] `backend_architecture_spec_consumer.md` §2.1·§2.2에 신규 경로·토픽 **초안** 반영 (Phase 6에서 최종 동기화)

### 예정 파일 (shared / consumer)

| 경로 | 역할 |
|------|------|
| `server/shared/src/database/mongoose/schemas/recipe-ingestion-job.schema.ts` | Job Mongoose 스키마 |
| `server/shared/src/database/mongoose/schemas/recipe-ingestion-state.schema.ts` | API 커서 Mongoose 스키마 |
| `server/shared/src/constants/kafka-topics.ts` | 토픽·DLQ 상수 |
| `server/consumer/src/persistence/repositories/mongodb/recipe-ingestion-job.repository.ts` | Job CRUD·상태 전환 |
| `server/consumer/src/persistence/repositories/mongodb/recipe-ingestion-state.repository.ts` | `last_end_idx` 커서 |
| `server/consumer/src/constants/consumer-groups.constants.ts` | consumer group 상수 |
| `server/consumer/src/reliability/monitoring/topic-consumer-group.map.ts` | 토픽 → consumer group (메트릭) |
| `server/consumer/src/reliability/monitoring/consumer-lag.monitor.ts` | group → topic (lag 폴링) |

### 완료 기준

- Job 문서 CRUD·`source_id` unique upsert·`status` 조건부 update 단위 테스트 통과 (`__tests__/` 하위 spec)
- 로컬: Producer 기동 후 KafkaAdminService로 메인·DLQ 토픽 생성 확인

---

## Phase 1 — fetch

**목표**: 공공데이터 API에서 신규 레시피를 수집해 `recipe_ingestion_jobs`에 `status: fetched`로 적재한다.

**선행 조건**: Phase 0

### 작업 항목

- [ ] **공공데이터 API 클라이언트** (`integrations/public-data/public-data-api.client.ts`)
  - URL: `GET /api/{keyId}/{serviceId}/{dataType}/{startIdx}/{endIdx}`
  - 경로 인자만 사용 — 선택 쿼리(`RCP_NM` 등) 미사용
  - `RESULT.CODE` 파싱 — `INFO-000` / `INFO-200` / 오류 코드별 분기 (가이드라인 §4.3)
  - `fetchLimit` > 1000 요청 시 클라이언트 단에서 거부 또는 분할 (API `ERROR-336`)
- [ ] **`FetchService`** — 공공데이터 수집만 (이후 단계 미호출)
  1. `recipe_ingestion_state`에서 `last_end_idx` 조회 (없으면 `0`)
  2. `startIdx = last_end_idx + 1`, `endIdx = startIdx + fetchLimit - 1` 계산
  3. API 호출 (공공데이터 API, `json`)
  4. `INFO-000`: 각 row `RCP_SEQ` → `source_id` upsert (`status: fetched`, `raw_data`, `fetched_at`)
  5. `INFO-200`: 0건 반환, 커서 미갱신
  6. 성공 시 `last_end_idx = endIdx` 저장
- [ ] CLI 엔트리포인트 `run-recipe-ingestion-fetch.ts` + `package.json` script `job:recipe-ingestion-fetch`
- [ ] 실패 처리: recoverable 오류 재시도 · job 단위 `retry_count++` · `retry_count >= 3` → `failed`
- [ ] 단위 테스트 — API mock · `INFO-200` · `ERROR-336` · 동일 `RCP_SEQ` upsert · 커서 갱신 (`backend_development_guidelines.md` §2 — `__tests__/services/`)

### 예정 파일

| 경로 | 역할 |
|------|------|
| `server/consumer/src/jobs/recipe-ingestion-fetch/recipe-ingestion-fetch.module.ts` | fetch standalone job 모듈 |
| `server/consumer/src/jobs/recipe-ingestion-fetch/services/fetch.service.ts` | fetch 로직 |
| `server/consumer/src/jobs/recipe-ingestion-fetch/run-recipe-ingestion-fetch.ts` | fetch CLI |
| `server/consumer/src/integrations/public-data/public-data-api.client.ts` | 공공 API HTTP 클라이언트 |
| `server/consumer/src/jobs/recipe-ingestion-fetch/__tests__/services/fetch.service.spec.ts` | 단위 테스트 |

### 완료 기준

- `startIdx`/`endIdx` 구간 요청 URL이 스펙과 일치 (샘플: `.../COOKRCP01/json/1/100`)
- `INFO-200` 시 커서·job 건수 변화 없음
- 동일 `RCP_SEQ`(`source_id`) 재수집 시 job 문서 1건만 유지(upsert)
- API 장애·`INFO-300` 시 재시도 정책이 가이드라인과 일치
- `fetchLimit` CLI 플래그(`--fetch-limit`, 기본 100, 최대 1000) 파싱 가능
- cron → CLI → `NestFactory.createApplicationContext` 패턴 준수 (`run-kpi-rollup.ts` 참고)

---

## Phase 2 — parse-submit

**목표**: `status: fetched` job을 OpenAI Parse Batch API에 제출하고 `status: parse_submitted`로 전환한다. parse-submit은 fetch와 **독립 standalone job**으로 운영하며, fetch 물량 조율은 운영 레이어의 fetch cron 정책에서 담당한다.

**선행 조건**: Phase 0, Phase 1

### 작업 항목

- [ ] **`ParseSubmitService`** — OpenAI Parse Batch 제출만 (FetchService 미호출)
  1. `status: fetched` job 조회 (`runId` 지정 시 해당 실행 단위만)
  2. `fetched` → `parse_submitting` 일괄 전환
  3. JSONL 생성·Files API 업로드·Batches API 생성
  4. `parse_submitting` → `parse_submitted` (+ `batch_id`, `submitted_at`)
- [ ] **카테고리 컨텍스트** — Redis TTL 1h 캐시 (기존 `FoodCategoriesHandler` 패턴 재사용 또는 공유 서비스 추출)
- [ ] **system_prompt** 템플릿 — 출력 JSON 스키마·어조·노이즈 제거·카테고리 목록·재료 정규화·`parse_confidence`/`parse_issues`/`ingredient_alias` 지시
  - **확장**: `imageUrl`, `nutrition`, `cookingMethod`, `dishType`, `steps[].imageUrl` (공공데이터 API §4.5 매핑)
- [ ] **JSONL 생성** — `custom_id` = job `_id`, model = `ConfigService.getOrThrow('OPENAI_BATCH_MODEL')`, `response_format: json_object`
- [ ] **OpenAI Batch 연동**
  - Files API 업로드 (`purpose: batch`)
  - Batches API 생성 (`endpoint: /v1/chat/completions`, `completion_window: 24h`)
- [ ] CLI 엔트리포인트 `run-recipe-ingestion-parse-submit.ts` + `package.json` script `job:recipe-ingestion-parse-submit`
- [ ] 통합 테스트 — OpenAI mock·JSONL 형식·`OPENAI_BATCH_MODEL` 주입 검증 (`__tests__/services/`)

### 예정 파일

| 경로 | 역할 |
|------|------|
| `server/consumer/src/jobs/recipe-ingestion-parse-submit/recipe-ingestion-parse-submit.module.ts` | parse-submit standalone job 모듈 |
| `server/consumer/src/jobs/recipe-ingestion-parse-submit/services/parse-submit.service.ts` | parse-submit 로직 |
| `server/consumer/src/jobs/recipe-ingestion-parse-submit/services/category-context.service.ts` | Redis·DB 카테고리 조회 |
| `server/consumer/src/jobs/recipe-ingestion-parse-submit/prompts/recipe-ingestion.system-prompt.ts` | system prompt |
| `server/consumer/src/integrations/openai/openai-batch.service.ts` | Files·Batches API |
| `server/consumer/src/jobs/recipe-ingestion-parse-submit/run-recipe-ingestion-parse-submit.ts` | parse-submit CLI |
| `server/consumer/src/consumers/recipe-ingestion-parse-submit/` | Kafka parse-submit consumer (fetch 완료 트리거) |

### CLI 계약

```bash
pnpm --filter consumer run job:recipe-ingestion-parse-submit
pnpm --filter consumer run job:recipe-ingestion-parse-submit --run-id <runId>
pnpm --filter consumer run job:recipe-ingestion-parse-submit --run-id-count 2
```

| 플래그 | 기본값 | 제약 |
|--------|--------|------|
| `--run-id` | — | 지정 `runId`에 속한 `fetched` job만 제출 (`--run-id-count`와 동시 사용 불가) |
| `--run-id-count` | 1 | 처리할 `runId` 개수. 양의 정수, 최대 3 |

### 완료 기준

- E2E(mock): JSONL 업로드 → batch 생성 → Mongo `parse_submitted` 일괄 반영
- `fetched` 0건 시 no-op 종료 (fetch CLI 미호출)
- Batch API 실패 시 `parse_submitting` job이 `fetched`로 복귀·retry_count 증가
- cron → CLI → `NestFactory.createApplicationContext` 패턴 준수 (`run-kpi-rollup.ts` 참고)
- parse-submit job이 fetch job과 **독립 모듈·CLI·배포**

---

## Phase 3 — parse-retrieve

**목표**: OpenAI Parse Batch 완료 batch의 output을 Mongo에 저장하고 Kafka로 persist를 트리거한다.

**선행 조건**: Phase 2 (최소 1건 `parse_submitted` batch 존재)

### 작업 항목

- [ ] **`ParseRetrieveService`** — `status: parse_submitted`인 distinct `batch_id` 조회
- [ ] Batch 상태 확인 (`GET /v1/batches/{id}`)
  - `completed` → parse-retrieve 단계 수행
  - `failed` / `expired` → `retry_count++`, `status: fetched` (`expired`도 재시도 횟수 소모 — 가이드라인 §5.3)
  - `retry_count >= 3` → `status: failed`, `failed_at`
  - `in_progress` / `validating` / `finalizing` → 변경 없음
- [ ] output JSONL 스트리밍 다운로드·라인 파싱
  - 오류 라인: `retry_count++`, `status: fetched`, `error_message`
  - 성공 라인: `retrieved_data` 저장, `status: parse_retrieved`, `retrieved_at`
- [ ] Kafka `recipe-ingestion-persist-triggered` 발행 — payload `{ runId, fetchedCount, triggeredAt }`, key = `runId`
- [ ] CLI 엔트리포인트 `run-recipe-ingestion-parse-retrieve.ts` + `package.json` script `job:recipe-ingestion-parse-retrieve`

### 예정 파일

| 경로 | 역할 |
|------|------|
| `server/consumer/src/jobs/recipe-ingestion-parse-retrieve/recipe-ingestion-parse-retrieve.module.ts` | Nest 모듈 |
| `server/consumer/src/jobs/recipe-ingestion-parse-retrieve/services/parse-retrieve.service.ts` | parse-retrieve·파싱·emit |
| `server/consumer/src/jobs/recipe-ingestion-parse-retrieve/run-recipe-ingestion-parse-retrieve.ts` | CLI |

### CLI 계약

```bash
pnpm --filter consumer run job:recipe-ingestion-parse-retrieve
```

### 완료 기준

- mock batch `completed` → job별 `parse_retrieved` + Kafka 메시지 1건/runId
- mock batch `expired` → 해당 batch job `retry_count++`·`fetched` 복귀
- partial failure JSONL → 성공·실패 job 분리 처리
- `in_progress` batch — CLI 1회 실행 시 job 상태 불변, 이후 cron 재실행 시 `completed` 처리
- cron → CLI → `NestFactory.createApplicationContext` 패턴 준수 (`run-kpi-rollup.ts` 참고)
- parse-retrieve job이 parse-submit job과 **독립 모듈·CLI·배포**

---

## Phase 4 — persist

**목표**: Kafka 이벤트를 소비해 PostgreSQL 레시피 도메인에 멱등 upsert한다.

**선행 조건**: Phase 0 (Kafka·repository), Phase 3 (이벤트 발행)

### 작업 항목

#### 4-A — Consumer 골격·멱등성

- [ ] `recipe-ingestion-persist` consumer (processor·consumer·module)
- [ ] `ConsumersModule` 등록
- [ ] persist 멱등성 흐름
  1. `{ runId }` 트리거로 `status: parse_retrieved` job 재조회
  2. `status === parse_retrieved`일 때만 `persisting` 조건부 전환
  3. 이미 `persisting` / `persisted` → skip
  4. 성공 → `persisted`, `persisted_at` + Kafka `recipe-ingestion-embed-submit-triggered` 발행
  5. 실패 → `retry_count++`, `status: parse_retrieved` 복귀 → Kafka redelivery 또는 DLQ

#### 4-B — 도메인 영속화

- [ ] `retrieved_data` JSON 스키마 검증 (`response-parser` 또는 전용 validator)
  - **확장**: `imageUrl`, `nutrition`, `cookingMethod`, `dishType`, `steps[]` 객체 형식(`content`, `imageUrl?`)
- [ ] 레시피·재료 카테고리 신규 제안 upsert
- [ ] **재료 매칭** (단계적)
  - 4-B-1 (MVP): 1차 정규화 + 2차 LLM `ingredient_alias` exact match + 3차 정규화명 exact match
  - 4-B-2 (후속): 4차 임베딩 유사도 (threshold 0.90 / 0.85~0.90 검수 큐 / 0.85 미만 신규 후보)
- [ ] `match_method` (`exact | alias` = LLM ingredient_alias hit | `vector` | `new`) 기록
- [ ] Recipe + RecipeIngredient **Prisma `$transaction`** upsert — `(source, sourceRecipeId)` unique
- [ ] `parse_confidence: low` → `isPublished: false`
- [x] `recipe-creation.domain.ts` — Prisma 트랜잭션 upsert (persist는 Recipe 도메인만 담당, 임베딩은 embed 단계)
- [ ] DLQ — `BaseTopicProcessor` 재시도 후 `recipe-ingestion-persist-triggered-dlq`

### 예정 파일

| 경로 | 역할 |
|------|------|
| `server/consumer/src/consumers/recipe-ingestion-persist/recipe-ingestion-persist.processor.ts` | processor |
| `server/consumer/src/consumers/recipe-ingestion-persist/recipe-ingestion-persist.consumer.ts` | consumer |
| `server/consumer/src/consumers/recipe-ingestion-persist/recipe-ingestion-persist.module.ts` | module |
| `server/consumer/src/consumers/recipe-ingestion-persist/handlers/PersistRecipeHandler.ts` | Kafka 트리거 → PersistService 위임 |
| `server/consumer/src/consumers/recipe-ingestion-persist/__tests__/handlers/PersistRecipeHandler.spec.ts` | handler 단위 테스트 |
| `server/consumer/src/jobs/recipe-ingestion-persist/services/persist.service.ts` | persist 오케스트레이션 |
| `server/consumer/src/jobs/recipe-ingestion-persist/domains/ingredient-matcher.domain.ts` | 재료 매칭 |
| `server/consumer/src/jobs/recipe-ingestion-persist/domains/recipe-creation.domain.ts` | Prisma 트랜잭션 (LLM `retrieved_data` → imageUrl·nutrition·instructions[].imageUrl) |
| `server/consumer/src/integrations/public-data/foodsafety-image-url.util.ts` | LLM 이미지 URL 정규화 (persist) |
| `server/consumer/src/persistence/repositories/postgresql/recipe-ingredient.repository.ts` | RecipeIngredient 쓰기 |

### 완료 기준

- 동일 `{ runId }` Kafka redelivery 시 PG 중복 insert 없음
- `(source, sourceRecipeId)` 기준 upsert로 재처리 안전
- MVP(4-B-1) 매칭으로 end-to-end 1건 persist 성공
- persist 후 Recipe에 `imageUrl`, `nutrition`, `instructions[].imageUrl`, `cookingMethod`, `dishType`, `cookingTip` 저장 확인
- consumer lag·DLQ 토픽 모니터링 대상 등록 (Phase 6)

### Phase 4 분할 권장

| 서브 Phase | 범위 | 배포 가능 여부 |
|------------|------|----------------|
| 4-A | consumer + 멱등 shell + skip 로직 | Kafka consume만 (no-op handler) |
| 4-B-1 | LLM alias + exact 매칭 + transaction upsert | **MVP persist** |
| 4-B-2 | vector 매칭 + 검수 큐 | 품질 개선 (별도 스프린트) |

---

## Phase 5 — embed

**목표**: persist 완료 레시피에 대해 OpenAI Embedding Batch를 제출하고, 완료 결과를 `RecipeEmbedding`(pgvector)에 upsert한다.

**선행 조건**: Phase 4 (최소 1건 `persisted` job 존재)

### 작업 항목

#### 5-A — embed-submit

- [ ] **`EmbedSubmitService`** — `status: persisted` job을 OpenAI Embedding Batch API에 제출
  1. `persisted` → `embed_submitting` 일괄 전환
  2. `RecipeEmbeddingDocumentService.buildDocumentByRecipeId()`로 `document_text` 생성
  3. JSONL 생성·Batches API 제출 (`submitEmbeddingBatchJsonl`)
  4. `embed_submitting` → `embed_submitted` (+ `batch_id`, `submitted_at`)
- [ ] Kafka `recipe-ingestion-embed-submit-triggered` consumer — persist 완료 트리거 → `EmbedSubmitService.submit`
- [ ] CLI `job:recipe-ingestion-embed-submit` (`--run-id`, `--run-id-count`, `--job-id`)

#### 5-B — embed-retrieve

- [ ] **`EmbedRetrieveService`** — `status: embed_submitted`인 distinct `batch_id` 조회
- [ ] Batch 상태 확인·output JSONL 파싱
  - 성공 라인: `RecipeEmbeddingRepository.upsert` + `status: embed_retrieved`
  - 실패·누락: `retry_count++`, `status: persisted` 롤백 (재시도)
- [ ] CLI `job:recipe-ingestion-embed-retrieve` (`--run-id`, `--run-id-count`)

### 예정 파일

| 경로 | 역할 |
|------|------|
| `server/consumer/src/jobs/recipe-ingestion-embed-submit/recipe-ingestion-embed-submit.module.ts` | embed-submit standalone job 모듈 |
| `server/consumer/src/jobs/recipe-ingestion-embed-submit/services/embed-submit.service.ts` | embed-submit 로직 |
| `server/consumer/src/jobs/recipe-ingestion-embed-submit/integrations/recipe-embedding-document.integration.ts` | 임베딩 요청용 `document_text` 생성 |
| `server/consumer/src/jobs/recipe-ingestion-embed-submit/run-recipe-ingestion-embed-submit.ts` | embed-submit CLI |
| `server/consumer/src/consumers/recipe-ingestion-embed-submit/` | Kafka embed-submit consumer |
| `server/consumer/src/jobs/recipe-ingestion-embed-retrieve/recipe-ingestion-embed-retrieve.module.ts` | embed-retrieve standalone job 모듈 |
| `server/consumer/src/jobs/recipe-ingestion-embed-retrieve/services/embed-retrieve.service.ts` | embed-retrieve·RecipeEmbedding upsert |
| `server/consumer/src/jobs/recipe-ingestion-embed-retrieve/run-recipe-ingestion-embed-retrieve.ts` | embed-retrieve CLI |
| `server/consumer/src/persistence/repositories/postgresql/recipe-embedding.repository.ts` | RecipeEmbedding upsert |

### 완료 기준

- persist 완료 → Kafka embed-submit 트리거 → `embed_submitted` 전환
- mock embedding batch `completed` → `RecipeEmbedding` upsert + `embed_retrieved`
- embed 실패 시 job `persisted` 롤백·`retry_count++`
- embed-submit·embed-retrieve가 persist와 **독립 모듈·CLI·배포**

---

## Phase 6 — 운영·관측·복구

**목표**: 프로덕션 cron·메트릭·장애 복구 경로를 완성하고 명세를 동기화한다.

**선행 조건**: Phase 1~5 (MVP persist + embed 완료)

### 작업 항목

| Scheduled Task | 호출 CLI | 주기 (초안) | 배포 단위 |
|----------------|----------|-------------|-----------|
| recipe-ingestion-fetch | `pnpm --filter consumer run job:recipe-ingestion-fetch` | 운영 정책 확정 | fetch 별도 태스크 |
| recipe-ingestion-parse-submit | `pnpm --filter consumer run job:recipe-ingestion-parse-submit` | 운영 정책 확정 | parse-submit 별도 태스크 |
| recipe-ingestion-parse-retrieve | `pnpm --filter consumer run job:recipe-ingestion-parse-retrieve` | 1~5분 | parse-retrieve 별도 태스크 |
| recipe-ingestion-persist-consumer | — | always-on | Kafka persist consumer ECS service |
| recipe-ingestion-persist-job | `pnpm --filter consumer run job:recipe-ingestion-persist` | 운영 정책 확정 | persist 별도 태스크 (선택) |
| recipe-ingestion-embed-submit-consumer | — | always-on | Kafka embed-submit consumer ECS service |
| recipe-ingestion-embed-submit-job | `pnpm --filter consumer run job:recipe-ingestion-embed-submit` | 운영 정책 확정 | embed-submit 별도 태스크 (선택) |
| recipe-ingestion-embed-retrieve | `pnpm --filter consumer run job:recipe-ingestion-embed-retrieve` | 1~5분 | embed-retrieve 별도 태스크 |

- [ ] ECS Scheduled Task / cron 스케줄 정의 (fetch·parse-submit·parse-retrieve·embed-retrieve **각각 분리**)
- [ ] **운영 runbook** — fetch/parse-submit cron 주기·`fetchLimit` 조율
  - 문서: `guidelines/recipe_ingestion_operations_runbook.md`
- [ ] ECS Task Definition·IAM·환경 변수 (`OPENAI_BATCH_MODEL`·공공데이터 API 키 포함)
- [ ] EventBridge / cron 표현식·타임존·동시 실행 정책
- [ ] **단계별 Prometheus 메트릭** (`consumer-metrics.service` 확장)
  - 수집·제출·완료·실패 건수
  - `parse_confidence: low` 비율
  - 재료 신규 생성·`match_method` 분포
  - LLM 토큰 usage 합산 (output JSONL)
  - stage latency
- [ ] `consumer-lag.monitor` `GROUP_TOPIC_MAP` — `recipe-ingestion-persist-triggered`·`recipe-ingestion-embed-submit-triggered` lag 알림 (Phase 0에서 매핑 추가, Phase 6에서 대시보드·알림 연동)
- [ ] CLI `--retry-failed` — `status: failed` job 재큐잉 (정책·runbook 확정)
- [ ] CLI persist 수동 처리 — `{ jobId }` direct persist (운영용)
  - 구현 계약: `job:recipe-ingestion-persist --job-id <jobId>`
- [ ] `backend_architecture_spec_consumer.md` **최종 동기화** (§2.1 파일 목록·§2.2 토픽 표·스케줄러 행)
- [ ] `../observability/validation.md`에 ingestion E2E 검증 시나리오 추가 (선택)
- [ ] Admin API·검수 UI — **향후 계획** (본 Phase 범위 외, backlog 기록만)

### 완료 기준

- Grafana/Prometheus에서 stage별 counter·histogram 조회 가능
- `failed` job 수동 재시도 절차 runbook화
- 명세·가이드라인·실제 코드 경로 일치 (`spec_driven_development_guidelines.md` 준수)

---

## E2E 검증 시나리오 (전 Phase 통합)

Phase 6 또는 각 Phase 완료 시 아래를 순차 검증한다.

1. **Happy path**: 공공 API mock 10건 → fetch CLI → parse-submit CLI(mock batch) → parse-retrieve(mock output) → persist → embed-submit(mock embedding batch) → embed-retrieve → PG Recipe 10건·RecipeEmbedding 10건·Mongo `embed_retrieved`
2. **fetch 부족**: `fetched` 0건 상태에서 parse-submit CLI no-op · fetch cron 후 parse-submit cron 재실행으로 제출
3. **Batch partial fail**: JSONL 일부 `status_code != 200` → 해당 job만 `fetched` 복귀·`retry_count++`
4. **Batch expired**: OpenAI batch `expired` → batch 소속 job `retry_count++`·`fetched` 복귀
5. **Kafka redelivery**: persist 중복 consume → PG row count 불변
6. **retry ceiling**: `retry_count >= 3` → `failed`, 더 이상 자동 parse-submit 제외
7. **이미지·영양 persist**: fetch mock row(ATT_FILE/MANUAL_IMG/INFO_*) → persist → PG `imageUrl`·`nutrition`·`instructions[].imageUrl`·`cookingTip` 확인
8. **embed 실패 롤백**: embedding batch 실패 → job `persisted` 복귀·`retry_count++`

---

## 상태 전이 체크리스트

가이드라인 §8과 구현 대응:

```
fetched → parse_submitting → parse_submitted
        → parse_retrieving → parse_retrieved
        → persisting → persisted
        → embed_submitting → embed_submitted
        → embed_retrieving → embed_retrieved
retry_count >= 3 → failed
```

| 전이 | 구현 Phase | 검증 |
|------|------------|------|
| → fetched | 1 | upsert |
| fetched → parse_submitting → parse_submitted | 2 | batch_id 설정 |
| parse_submitted → parse_retrieving → parse_retrieved | 3 | retrieved_data·Kafka |
| parse_retrieved → persisting → persisted | 4 | PG upsert·embed-submit 트리거 |
| persisted → embed_submitting → embed_submitted | 5-A | embedding batch_id 설정 |
| embed_submitted → embed_retrieving → embed_retrieved | 5-B | RecipeEmbedding upsert |
| any → failed (retry ≥ 3) | 1~5 공통 | failed_at |

---

## Backlog (본 계획 범위 외)

- **공공데이터 API deterministic 매퍼** — `integrations/public-data/public-data-recipe-field.mapper.ts` (예정). `raw_data`에서 `imageUrl`·`nutrition`·`MANUAL_IMG*` 등을 코드로 직접 매핑하고, persist 시 LLM `retrieved_data`와 병합(`raw_data` 우선). LLM-only persist의 누락·오차·비용을 줄이는 품질 개선 옵션. §4.5 참조.
- Admin API / UI — failed job 검수·수동 재처리
- 재료 검수 큐 (vector 0.85~0.90 구간) 전용 워크플로
- `recipe-ingestion-persist-triggered`·`recipe-ingestion-embed-submit-triggered` 파티션 키·처리량 튜닝
- OpenAI 서킷 브레이커 (`circuit-breaker.ts` 명세 미구현 항목)

---

## 구현 순서 요약

```
Phase 0 (기반)
  └─► Phase 1 (fetch + fetch CLI)
        └─► Phase 2 (parse-submit + parse-submit CLI)
              └─► Phase 3 (parse-retrieve + CLI)
                    └─► Phase 4-A → 4-B-1 (persist MVP)
                          └─► Phase 5 (embed-submit + embed-retrieve)
                                └─► Phase 6 (운영 — cron·runbook으로 단계 조율)
                                      └─► Phase 4-B-2 (vector 매칭, 선택)
```

각 Phase는 **독립 PR**로 나누어 리뷰·배포하는 것을 권장한다. Phase 2 완료 시점부터 OpenAI Parse Batch 실 API smoke test, Phase 4-B-1 완료 시점부터 스테이징 E2E, Phase 5 완료 시점부터 embedding E2E를 수행한다.
