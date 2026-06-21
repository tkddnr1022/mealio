# Recipe Ingestion 절차 (OpenAI Batch API 기반)

공공데이터 레시피를 OpenAI Batch API로 변환·영속화하는 파이프라인의 **절차·상태 전이·멱등성 SSOT**이다. 구현 계획은 `../recipe_ingestion_plan.md`를 참조한다.

---

## 1. 개요

```
[fetch] → [submit] → [retrieve] → [persist]
```

`recipe_ingestion_jobs`에서 각 단계를 멱등하게 관리한다.

---

## 2. 아키텍처

### 2.1 SSOT (Single Source of Truth)

| 계층 | 저장소 | 역할 |
|------|--------|------|
| **Ingestion 파이프라인** | MongoDB `recipe_ingestion_jobs` | 단계별 `status`, `run_id`, `raw_data`, `retrieved_data`, `batch_id`, 재시도·에러의 **유일한 진실 원천** |
| **레시피 도메인** | PostgreSQL (Prisma) | Recipe, Ingredient, RecipeIngredient, 카테고리 등 **서비스 도메인 SSOT** |
| **Kafka** | — | fetch→submit·retrieve→persist **트리거·핸드오프 큐**일 뿐 SSOT 아님. consumer는 Mongo `status`를 재조회한 뒤 처리 |
| **Redis** | — | 레시피·재료 카테고리 목록 **캐시**(TTL 1h). SSOT 아님 |
| **OpenAI Batch output** | — | **파생 데이터**. retrieve 완료 시 Mongo `retrieved_data`에 스냅샷 저장 |

### 2.2 엔트리포인트·CLI

각 단계는 **독립 CLI(standalone job)** 로 1회 실행 단위를 가진다. 단계 간 순서·빈도 조율은 **구현 레이어가 아닌 운영 레이어**(ECS Scheduled Task / cron) 책임이다.

| 단계 | 엔트리포인트 | package.json script | 비고 |
|------|--------------|---------------------|------|
| fetch | CLI (standalone job) | `job:recipe-ingestion-fetch` | 공공데이터 수집·`fetchedCount > 0` 시 Kafka 트리거 발행 |
| submit | CLI (standalone job) + Kafka `recipe-ingestion-fetch-completed` | `job:recipe-ingestion-submit` | OpenAI Batch 제출. Kafka 트리거는 신호만, 대상은 `status: fetched` 조회 |
| retrieve | CLI (standalone job) | `job:recipe-ingestion-retrieve` | Batch 완료 확인·결과 반영 |
| persist | Kafka `recipe-ingestion-retrieved` | — | payload `{ runId, fetchedCount, triggeredAt }` |
| failed 재시도·검수 | CLI | `job:recipe-ingestion-submit --retry-failed` | Admin API·UI 향후 계획 |

```bash
pnpm --filter consumer run job:recipe-ingestion-fetch
pnpm --filter consumer run job:recipe-ingestion-fetch --fetch-limit 100
pnpm --filter consumer run job:recipe-ingestion-submit
pnpm --filter consumer run job:recipe-ingestion-submit --run-id <runId>
pnpm --filter consumer run job:recipe-ingestion-retrieve
pnpm --filter consumer run job:recipe-ingestion-retrieve --run-id <runId>
pnpm --filter consumer run job:recipe-ingestion-persist --run-id <runId>
pnpm --filter consumer run job:recipe-ingestion-submit --retry-failed
```

- fetch 기본값: `fetchLimit=100` (`--fetch-limit`, 최대 1000)
- **cron → CLI → NestJS ApplicationContext** (standalone job). `run-kpi-rollup.ts`와 동일 패턴

### 2.3 스케줄링 (ECS / cron) — 운영 레이어

단계별 CLI를 **별도 Scheduled Task**로 등록하고, fetch·submit·retrieve를 독립 파이프라인으로 운영한다.

| 호출 대상 | 주기 (초안) | 비고 |
|-----------|-------------|------|
| `job:recipe-ingestion-fetch` | 운영 정책에 따라 확정 | 공공데이터 수집 |
| `job:recipe-ingestion-submit` | 운영 정책에 따라 확정 (fallback) | `status: fetched` → OpenAI Batch. Kafka 트리거 유실 시 보완 |
| `job:recipe-ingestion-retrieve` | 1~5분 | Batch 완료 확인·결과 반영 |
| `job:recipe-ingestion-persist` | 운영 정책에 따라 확정 | `status: retrieved` direct persist (수동/배치) |
| `recipe-ingestion-fetch-completed` consumer | always-on | fetch 완료 트리거 → submit |
| `recipe-ingestion-persist` consumer | always-on | Kafka 구독 |

**운영 조율 정책 (예시)** — 구현 코드가 아닌 스케줄·runbook에서 정의:

- submit 전에 `fetched` 적재량이 충분하도록 fetch cron 주기·`fetchLimit`를 조정
- fetch·submit cron 주기·`fetchLimit`를 운영 runbook에서 조율
- submit 실행 시 `fetched` 0건이면 no-op으로 종료
- fetch Kafka 트리거 발행 실패 시 cron submit fallback이 backlog를 보완
- submit cron과 Kafka 트리거가 동시에 실행되어도 `fetched → submitting` 조건부 전환으로 동일 job 중복 Batch 제출을 방지 (persist와 동일 패턴)

### 2.4 수행 주체·데이터 흐름

| 단계 | 수행 주체 | 구동 | 구현 경로 |
|------|-----------|------|-----------|
| fetch | standalone job | cron → CLI | `server/consumer/src/jobs/recipe-ingestion-fetch/` |
| submit | standalone job + consumer | cron fallback + Kafka 구독 | `server/consumer/src/jobs/recipe-ingestion-submit/`, `server/consumer/src/consumers/recipe-ingestion-submit/` |
| retrieve | standalone job | cron → CLI | `server/consumer/src/jobs/recipe-ingestion-retrieve/` |
| persist | standalone job + consumer | CLI + Kafka 구독 | `server/consumer/src/jobs/recipe-ingestion-persist/`, `server/consumer/src/consumers/recipe-ingestion-persist/` |

```
cron ──→ job:recipe-ingestion-fetch ──→ MongoDB (recipe_ingestion_jobs, status: fetched)
                                      └──→ Kafka (recipe-ingestion-fetch-completed)
Kafka ──→ recipe-ingestion-submit consumer ──→ MongoDB ──→ OpenAI Batch API
cron ──→ job:recipe-ingestion-submit ──→ MongoDB ──→ OpenAI Batch API (fallback)
cron ──→ job:recipe-ingestion-retrieve ──→ MongoDB ──→ Kafka (recipe-ingestion-retrieved)
cron/manual ──→ job:recipe-ingestion-persist ──→ MongoDB + PostgreSQL (Recipe domain)
Kafka ──→ recipe-ingestion-persist consumer ──→ MongoDB + PostgreSQL (Recipe domain)
```

### 2.5 submit 트리거·멱등성

fetch→submit Kafka 핸드오프는 **신호만** 전달한다.

1. fetch 성공·`fetchedCount > 0`일 때 `recipe-ingestion-fetch-completed` 발행 — payload `{ runId, fetchedCount, triggeredAt }`, key = `runId`
2. `INFO-200`(0건) 또는 upsert 실패만 있는 경우 트리거 미발행
3. submit consumer는 payload를 트리거 신호로만 사용하고, 실제 제출 대상은 Mongo `status: fetched` + `runId`를 재조회해 결정
4. cron fallback submit CLI는 `--run-id` 지정 시 해당 실행 단위만 처리
5. `fetched → submitting` 조건부 전환으로 cron·Kafka 트리거 중복 실행 시 동일 job 중복 제출을 방지 (`lockedCount === 0`이면 no-op)
6. Kafka redelivery·실패 시 DLQ `recipe-ingestion-fetch-completed-dlq` 위임

### 2.6 persist 멱등성

Kafka redelivery·consumer 재시작에 대비한다.

1. consume 시 payload `{ runId, fetchedCount, triggeredAt }`를 트리거 신호로 수신
2. Mongo `recipe_ingestion_jobs`에서 `status: retrieved` + `runId` 후보를 재조회
3. `status === retrieved`일 때만 `status: persisting`으로 **조건부 전환**(낙관적 락). 이미 `persisting` / `persisted`이면 skip
4. PostgreSQL upsert는 `(source, sourceRecipeId)` 기준 멱등 (`Recipe.source` + `Recipe.sourceRecipeId`, job `source_id`에서 매핑)
5. 성공 시 `status: persisted`, `persisted_at` 기록
6. 실패 시 `retry_count++`, `status: retrieved`로 되돌려 Kafka 재처리 또는 DLQ(`recipe-ingestion-retrieved-dlq`) 위임

### 2.7 환경 변수

Kafka 토픽·DLQ는 `@mealio/shared` `KAFKA_TOPICS`·`KAFKA_DLQ_TOPICS`에 등록한다.

**Consumer 환경 변수 (ingestion 관련)**

| 변수 | 필수 | 용도 |
|------|------|------|
| `PUBLIC_DATA_API_KEY` | 예 | 공공데이터 Open API 인증키 |
| `OPENAI_BATCH_MODEL` | 예 | Batch JSONL `body.model` |

코드에서는 `ConfigService.getOrThrow()`로 조회한다. 검증은 `server/consumer/src/config/env.validation.ts`.

---

## 3. 스키마

### 3.1 `recipe_ingestion_jobs`

MongoDB 컬렉션 (Mongoose). 파이프라인 SSOT.

| 필드 | 설명 |
|------|------|
| `source_id` | 공공데이터 원본 ID — API 응답 `RCP_SEQ` (Number, unique) |
| `status` | `fetched` \| `submitting` \| `submitted` \| `retrieving` \| `retrieved` \| `persisting` \| `persisted` \| `failed` |
| `retry_count` | 최대 3회 |
| `run_id` | fetch 시작 시 생성되는 파이프라인 실행 단위 UUID |
| `raw_data` | JSON (공공데이터 API row 원본) |
| `batch_id` | OpenAI Batch Job ID (`submitted` 이후) |
| `retrieved_data` | JSON (LLM 변환 결과) |
| `error_message` | — |
| `fetched_at` | — |
| `submitted_at` | — |
| `retrieved_at` | — |
| `persisted_at` | — |
| `failed_at` | — |

### 3.2 `recipe_ingestion_state`

MongoDB singleton. API 순번 페이징 커서.

| 필드 | 설명 |
|------|------|
| `last_end_idx` | 마지막으로 요청한 `endIdx` (없으면 fetch 시 `0`으로 간주) |
| `updated_at` | — |

### 3.3 공통 상태·재시도

- **단계 시작**: 각 단계 시작 시 `status: {해당 단계}ing` (경쟁 조건 락)
- **단계 실패**: `retry_count++`, `status: {재시도 필요 단계}`; `retry_count >= MAX_RETRY_COUNT`이면 `status: failed`

---

## 4. 공공데이터 API (식품의약품안전처)

레시피 원본은 [식품의약품안전처 Open API](http://openapi.foodsafetykorea.go.kr) **조리식품의 레시피 DB**에서 수집한다. **경로·필수 인자만** 사용하며, 선택 쿼리(`RCP_NM`, `RCP_PARTS_DTLS`, `CHNG_DT`, `RCP_PAT2`)는 사용하지 않는다.

### 4.1 요청 URL

```
http://openapi.foodsafetykorea.go.kr/api/{keyId}/{serviceId}/{dataType}/{startIdx}/{endIdx}
```

| 경로·인자 | 타입 | 설명 | ingestion 값 |
|-----------|------|------|--------------|
| `keyId` | STRING (필수) | Open API 인증키 | `PUBLIC_DATA_API_KEY` |
| `serviceId` | STRING (필수) | 서비스명 | `PUBLIC_DATA_SERVICE_ID` (조리식품 레시피 DB) |
| `dataType` | STRING (필수) | `xml` \| `json` | `PUBLIC_DATA_TYPE` (`json`) |
| `startIdx` | STRING (필수) | 요청 시작 위치 (1-based) | §5.1에서 계산 |
| `endIdx` | STRING (필수) | 요청 종료 위치 (1-based) | §5.1에서 계산 |

샘플: `http://openapi.foodsafetykorea.go.kr/api/sample/COOKRCP01/json/1/5`

### 4.2 API 제약

- `(endIdx - startIdx + 1)` **최대 1000건** (`ERROR-336`)
- `fetchLimit` 기본값 100 — 기본 호출은 한도 이내

### 4.3 응답 결과 코드 (`RESULT.CODE`)

| 코드 | 의미 | ingestion 처리 |
|------|------|----------------|
| `INFO-000` | 정상 처리 | 응답 row 파싱 후 upsert |
| `INFO-200` | 해당 데이터 없음 | 수집 완료(커서 유지), 0건 반환 |
| `INFO-100` | 인증키 유효하지 않음 | job 실패·알림, 재시도 보류 |
| `INFO-300` | 유효 호출건수 초과 | 백오프 후 재시도 |
| `INFO-400` | 권한 없음 | job 실패·알림 |
| `ERROR-300` | 필수 값 누락 | 클라이언트 버그·설정 오류 |
| `ERROR-301` | 파일타입 누락·유효하지 않음 | `dataType` 설정 확인 |
| `ERROR-310` | 서비스 없음 | `serviceId` 설정 확인 |
| `ERROR-331` | 시작위치 오류 | `startIdx`·커서 점검 |
| `ERROR-332` | 종료위치 오류 | `endIdx`·`fetchLimit` 점검 |
| `ERROR-334` | 시작 > 종료 | `startIdx`/`endIdx` 계산 버그 |
| `ERROR-336` | 1회 요청 1000건 초과 | `fetchLimit` 또는 분할 호출 |
| `ERROR-500` | 서버 오류 | 재시도 |
| `ERROR-601` | SQL 문장 오류 | 재시도 |

### 4.4 페이징·멱등성 역할 분리

| 개념 | 역할 |
|------|------|
| `startIdx` / `endIdx` | API **순번 페이징** — 다음 수집 구간 결정 |
| `RCP_SEQ` (응답 필드) | job **`source_id`** (Number) — upsert·중복 방지의 비즈니스 키 |
| `last_end_idx` | Mongo `recipe_ingestion_state` — 마지막으로 요청한 `endIdx` |

API는 순번 구간으로 데이터를 반환하고, 동일 레시피 재수집 시 `RCP_SEQ` → `source_id` upsert로 중복 job을 방지한다.

### 4.5 공공데이터 API 응답 필드 → Recipe 도메인 매핑

fetch 단계에서 `raw_data`에 원본 row 전체를 보존한다. **이미지·영양·조리 메타**는 submit 단계 LLM이 `retrieved_data`로 구조화하고, persist는 **검증된 `retrieved_data`만** PostgreSQL에 저장한다.

| 공공데이터 API 필드 | LLM `retrieved_data` | Recipe 도메인 | 비고 |
|----------------|----------------------|---------------|------|
| `ATT_FILE_NO_MK` | `recipe.imageUrl` | `imageUrl` | **우선** `ATT_FILE_NO_MK`, 없으면 `ATT_FILE_NO_MAIN` |
| `ATT_FILE_NO_MAIN` | `recipe.imageUrl` | `imageUrl` | fallback (소) |
| `MANUAL01`~`MANUAL20` | `recipe.steps[].content` | `instructions[].content` | 빈 단계 제외, ~요체 정제 |
| `MANUAL_IMG01`~`MANUAL_IMG20` | `recipe.steps[].imageUrl` | `instructions[].imageUrl` | 단계 인덱스(1-based) 정렬 |
| `INFO_ENG` | `recipe.nutrition.calories` | `nutrition.calories` | kcal, 추측 금지 |
| `INFO_CAR` | `recipe.nutrition.carbohydrates` | `nutrition.carbohydrates` | g |
| `INFO_PRO` | `recipe.nutrition.protein` | `nutrition.protein` | g |
| `INFO_FAT` | `recipe.nutrition.fat` | `nutrition.fat` | g |
| `INFO_NA` | `recipe.nutrition.sodium` | `nutrition.sodium` | mg |
| `RCP_WAY2` | `recipe.cookingMethod` | `cookingMethod` | VARCHAR(50) |
| `RCP_PAT2` | `recipe.dishType` | `dishType` | VARCHAR(50) |
| `RCP_NA_TIP` | `recipe.tips` | `cookingTip` | persist 시 `tips` → `cookingTip` |
| `RCP_SEQ` | — | `sourceRecipeId` | job `source_id`에서 매핑 (LLM 경유 없음) |
| `INFO_WGT` | — | — | **후속** — 현재 Recipe 스키마 미포함 |
| `HASH_TAG` | — | — | **후속** — 태그 스키마 설계 후 반영 |

**이미지 URL 정책 (S3 통합 전)**

- LLM이 복사한 URL은 persist 시 `foodsafety-image-url.util.ts`로 정규화한다.
- API 응답 값은 대부분 **절대 URL** (`http://www.foodsafetykorea.go.kr/uploadimg/cook/...`).
- 상대 경로(`/uploadimg/...`)인 경우 `http://www.foodsafetykorea.go.kr` origin을 prefix한다.
- invalid·빈 URL은 `null`로 저장한다. **S3 업로드·CDN 재호스팅은 범위 외**(후속 Phase).

**deterministic 매퍼 (후속 옵션)**

LLM 누락·오차·Batch 품질 편차를 줄이려면 persist 전 `raw_data` → 도메인 **deterministic 매퍼**를 도입할 수 있다. 예상 경로: `integrations/public-data/public-data-recipe-field.mapper.ts`. 도입 시 병합 우선순위는 `raw_data` 매핑 → LLM `retrieved_data` fallback을 권장한다. **현재 구현 범위에서는 LLM-only**이며, `raw_data`는 Mongo 보존·재처리(replay) SSOT로만 사용한다.

---

## 5. 파이프라인 단계

### 5.1 fetch

매개변수 `fetchLimit` 기본값 100. API 1회 최대 1000건(`ERROR-336`) 이내.

1. `recipe_ingestion_state`에서 `last_end_idx` 조회 — 없으면 `0`
2. 구간 계산
   ```
   startIdx = last_end_idx + 1
   endIdx   = startIdx + fetchLimit - 1
   ```
3. 공공데이터 API 호출
   ```
   GET .../api/{keyId}/COOKRCP01/json/{startIdx}/{endIdx}
   ```
4. `RESULT.CODE` 처리
   - `INFO-000`: 각 row `RCP_SEQ` → `source_id`로 `recipe_ingestion_jobs` upsert (`status: fetched`, `raw_data`, `fetched_at`)
   - `INFO-200`: 0건 — `last_end_idx` 갱신 없이 종료
   - 그 외 recoverable 오류: 재시도 · `retry_count` 정책 적용
5. 성공 시 `last_end_idx = endIdx` 저장

> `create` 대신 upsert. API 페이징은 `startIdx`/`endIdx`, job 멱등 키는 `source_id`(`RCP_SEQ`).

### 5.2 submit

`status: fetched` 항목을 OpenAI Batch API에 제출한다. `runId`가 지정되면 해당 실행 단위의 job만 조회하며, 미지정 시 run scope(`runIdCount`) 기준으로 대상을 선택한다.
submit은 `runId`별로 Batch를 분리 생성해 `runId:batch_id = 1:1` 불변식을 유지한다.

1. **대상 조회(run scope)**
   ```
   status: fetched job 조회
   (runId 지정 시 status+runId 필터, 미지정 시 run scope로 선택된 runId 집합)
   (0건이면 no-op 종료)
   runId별 그룹화
   ```
2. **runId 그룹별 상태 전환**
   ```
   status: fetched → status: submitting (일괄 update)
   ```
3. **카테고리 컨텍스트** (Redis TTL 1h)
   ```
   hit  → 캐시 사용
   miss → DB 레시피·재료 카테고리 목록 조회 → Redis 캐싱
   ```
4. **JSONL 생성** — runId 그룹별 대상 job, `custom_id` = `recipe_ingestion_job._id`

   ```jsonl
   {"custom_id": "{recipe_ingestion_job._id}", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "{OPENAI_BATCH_MODEL}", "max_completion_tokens": 8192, "reasoning_effort": "low", "verbosity": "low", "response_format": {"type": "json_object"}, "messages": [{"role": "system", "content": "{system_prompt}"}, {"role": "user", "content": "{raw_data_json}"}]}}
   ```

   `model`은 환경 변수 `OPENAI_BATCH_MODEL` 값을 사용한다.

   `system_prompt` 포함 항목:
   - 출력 JSON 스키마 (레시피, 재료, 레시피-재료)
   - **이미지·영양·조리 메타**: `imageUrl`, `nutrition`, `cookingMethod`, `dishType`, `steps[].imageUrl`
   - 어조 규칙 (~요 체 등)
   - 노이즈 제거 (MANUAL 필드 말미 단일 영문자 등)
   - 카테고리 목록 (ID, 이름) — 선택 또는 신규 제안
   - 재료량 기반 `servings` 추측 혹은 `null` 처리
   - 단계·기법·재료 기반 `difficulty`(1-3) 추론 지시
   - MANUAL·조리법 기반 `cookingTimeMinutes`(분) 추론 지시
   - 재료명 정규화·`ingredient_alias`(canonical 재료명) 반환 지시
   - **`quantity`/`unit` 파싱: 중량·부피와 개수가 함께 있으면 개수 우선** (예: `달걀 30g(1/2개)` → quantity `1/2`, unit `개` — `30`/`g` 아님)
   - `parse_confidence: high | low`, `parse_issues` 반환 지시

5. **Files API 업로드**
   ```
   POST https://api.openai.com/v1/files
     purpose: "batch"
     file: {JSONL}
   → file_id
   ```
6. **Batch Job 생성**
   ```
   POST https://api.openai.com/v1/batches
     input_file_id: {file_id}
     endpoint: "/v1/chat/completions"
     completion_window: "24h"
   → batch_id
   ```
7. **상태 업데이트** (runId 그룹 단위)
   ```
   status: submitted
   batch_id: {batch_id}
   submitted_at: now()
   ```

### 5.3 retrieve

`status: submitted` job의 OpenAI Batch 완료를 확인하고, 완료 batch output을 Mongo에 반영한 뒤 Kafka로 persist를 트리거한다. **cron → CLI** (`job:recipe-ingestion-retrieve`) 1회 실행 단위.

1. **대상 batch 조회 및 Batch API 상태 확인**
   ```
   status: submitted인 distinct batch_id 조회
     for each batch_id:
       GET https://api.openai.com/v1/batches/{batch_id}

       completed → 해당 batch job status: retrieving 후 2~3단계
       failed, expired → retry_count++, status: fetched
       retry_count >= MAX_RETRY_COUNT → status: failed, failed_at
       in_progress / validating / finalizing → 변경 없음 (다음 cron 실행 시 재확인)
   ```
2. **결과 파일 다운로드**
   ```
   GET https://api.openai.com/v1/files/{output_file_id}/content
   → output JSONL 스트리밍 다운로드
   ```
3. **결과 파싱 및 job 반영** — output JSONL 라인 단위

   ```jsonl
   {"id": "...", "custom_id": "{recipe_ingestion_job._id}", "response": {"status_code": 200, "body": {...}}, "error": null}
   ```

   ```
   error != null 또는 status_code != 200
     → retry_count++, status: fetched, error_message
   else
     → retrieved_data, status: retrieved
   ```

4. **retrieve 완료 트리거 발행**
   ```
   batch 처리 전체에서 성공한 job의 runId별 성공 건수 집계
   → Kafka recipe-ingestion-retrieved
      payload: { runId, fetchedCount, triggeredAt }
      key: "runId"
   ```

### 5.4 persist

Kafka `recipe-ingestion-retrieved` 소비 → payload `runId`로 `retrieved` job 재조회 → PostgreSQL 영속화. 멱등성은 §2.5.

- 실패: `retry_count++`, `status: retrieved` 복귀 → Kafka 재처리; 반복 실패 시 DLQ `recipe-ingestion-retrieved-dlq` (`@mealio/shared` `KAFKA_TOPICS`)

1. 레시피 카테고리 신규 제안 upsert
2. 재료 카테고리 신규 제안 upsert
3. **재료 매칭** (단계적)
   ```
   1차: 원문 정규화 (괄호·조사·수량 제거, 공백 정리)
        예) "대파(흰 부분)" → "대파", "달걀 2개" → "달걀", "달걀 30g(1/2개)" → "달걀"
        quantity/unit: 중량·부피와 개수가 함께 있으면 **개수 우선**
        예) "달걀 30g(1/2개)" → quantity `1/2`, unit `개` (30g 아님)
   2차: LLM `retrieved_data`의 `ingredient_alias`(canonical명) → Ingredient.name exact match
        예) 원문 "파(대파)" + ingredient_alias "대파" → DB "대파"
   3차: 1차 정규화 결과 → Ingredient.name exact match
   4차: 임베딩 유사도 (pgvector 또는 Redis vector, Phase 4-B-2)
        cosine ≥ 0.90 → 매칭
        0.85~0.90 → 검수 큐, 임시 매칭 보류
        < 0.85 → 신규 재료 후보 upsert, 검수 큐
   ```
   `match_method`: `exact` \| `alias`(LLM ingredient_alias hit) \| `vector` \| `new`
4. Recipe + RecipeIngredient **transaction upsert** — `(source, sourceRecipeId)` unique; `parse_confidence: low` → `isPublished: false`
   - **이미지·영양·조리 메타**: 검증된 `retrieved_data` → `imageUrl`, `nutrition`, `cookingMethod`, `dishType`, `cookingTip`, `instructions[].imageUrl` (§4.5)
   - **`difficulty`**: LLM 추론값(1-3) → `Recipe.difficulty`. 누락·레거시 payload는 `RECIPE_INGESTION_DEFAULT_DIFFICULTY`(2) fallback; 범위 밖은 clamp (`retrieved-data.validator.ts`)
   - **`cookTime`**: LLM `cookingTimeMinutes` → `Recipe.cookTime`. 누락·레거시 payload는 `RECIPE_INGESTION_DEFAULT_COOK_TIME_MINUTES`(30) fallback; 5-180분 clamp (`retrieved-data.validator.ts`)
5. job 업데이트: `status: persisted`, `persisted_at: now()`

---

## 6. 운영 레이어 조율 (fetch ↔ submit)

fetch와 submit은 **별도 CLI·별도 cron**으로 실행한다.

| 매개변수 | CLI 플래그 | 단계 | 기본값 |
|----------|------------|------|--------|
| `fetchLimit` | `--fetch-limit` | fetch | 100 |
| `runId` | `--run-id` | submit/retrieve/persist | — |
| `runIdCount` | `--run-id-count` | submit/retrieve/persist | 1 (최대 3, `--run-id`와 동시 사용 불가) |
| `jobId` | `--job-id` | submit/persist | — (`--run-id`, `--run-id-count`와 동시 사용 불가) |

- `fetchLimit` ≤ 1000 (`ERROR-336`)
- 운영 runbook에서 fetch 실행량과 submit 처리량을 분리 조율

**파이프라인 전체 흐름** (각 화살표는 독립 스케줄·핸드오프):

```
[cron] fetch CLI → Mongo (fetched) + Kafka emit (fetch completed)
[always-on] submit consumer → OpenAI Batch → Mongo (submitted)
[cron] submit CLI → OpenAI Batch → Mongo (submitted)  # fallback
[cron] retrieve CLI → Mongo (retrieved) + Kafka emit
[always-on] persist consumer → PostgreSQL
```

submit 1회 실행 시 `status: fetched` job이 없으면 no-op으로 종료한다.

---

## 7. 메트릭

| 항목 | 설명 |
|------|------|
| 수집 / 제출 / 완료 / 실패 건수 | 단계별 counter |
| `parse_confidence: low` 비율 | 품질 |
| 재료 신규 생성·`match_method` 분포 | 매칭 품질 |
| LLM 토큰 usage | output JSONL `usage` 합산 |
| stage latency | 단계별 지연 |

---

## 8. 상태 전이

```
fetched
  → (submit) → submitting → submitted
  → (retrieve) → retrieving → retrieved
  → (persist) → persisting → persisted
  → (retry_count >= 3) → failed
```

`failed`는 최종 상태이며 수동 검수 대상이다.

---
