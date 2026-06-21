# 레시피 수집 상세

## 이 문서로 해결할 질문

- fetch→submit→retrieve→persist 각 단계의 책임은 무엇인가요?
- job 상태 전이와 멱등 키는 무엇인가요?
- 운영·검증은 어떻게 하나요?

전체 ETL 개요는 [레시피 수집(ETL)](../project/recipe-ingestion)을 참고하세요.

## 파이프라인

```mermaid
flowchart LR
    Fetch[fetch] --> Submit[submit] --> Retrieve[retrieve] --> Persist[persist]
```

| 단계 | 주체 | 저장소·출력 |
| --- | --- | --- |
| **fetch** | standalone job | MongoDB `recipe_ingestion_jobs` (`fetched`) + Kafka |
| **submit** | standalone job | OpenAI Batch (`submitted`) |
| **retrieve** | standalone job | `retrieved_data` + Kafka |
| **persist** | Kafka consumer | PostgreSQL Recipe |

진행 상태의 기준 저장소는 MongoDB `recipe_ingestion_jobs`이며, API 커서는 `recipe_ingestion_state`를 사용합니다.

## 데이터 원천

데이터 원천은 식약처 Open API의 조리식품 레시피 DB입니다.

```
GET /api/{keyId}/{serviceId}/json/{startIdx}/{endIdx}
```

- `source_id`는 API 응답의 `RCP_SEQ`이며, 멱등 upsert 키로 사용합니다.
- 1회 fetch는 최대 1000건이며, `fetchLimit`은 1000 이하여야 합니다.

## 상태 전이

```mermaid
stateDiagram-v2
    direction LR
    [*] --> fetched
    fetched --> submitting
    submitting --> submitted
    submitted --> retrieving
    retrieving --> retrieved
    retrieved --> persisting
    persisting --> persisted
    persisted --> [*]
    submitting --> fetched: retry
    submitted --> fetched: retry
    retrieving --> fetched: retry
    persisting --> fetched: retry
    fetched --> failed: retry_count >= 3
    submitting --> failed: retry_count >= 3
    submitted --> failed: retry_count >= 3
    retrieving --> failed: retry_count >= 3
    persisting --> failed: retry_count >= 3
```

| 전이 | 트리거 |
| --- | --- |
| → fetched | fetch job API row upsert |
| → submitted | OpenAI batch 생성 |
| → retrieved | batch output 파싱 |
| → persisted | PG upsert 성공 |
| → failed | retry ceiling |

## submit Consumer

- `recipe-ingestion-fetch-completed` 토픽을 구독합니다.
- payload는 `{ startIdx, endIdx, fetchedCount, triggeredAt }` 형식입니다.
- `fetched` → `submitting` 조건부 전환으로 멱등성을 보장합니다.
- 실제 제출 대상은 MongoDB `status: fetched` job 조회로 결정합니다.

## persist Consumer

- `recipe-ingestion-retrieved` 토픽을 구독합니다.
- payload는 `{ jobId }` 형식입니다.
- `retrieved` → `persisting` 조건부 전환으로 멱등성을 보장합니다.
- PostgreSQL에는 `(source, sourceRecipeId)` unique upsert로 저장합니다.

## CLI

```bash
pnpm run recipe-ingestion:fetch
pnpm run recipe-ingestion:submit --submit-batch-size 50
pnpm run recipe-ingestion:retrieve
pnpm run recipe-ingestion:persist --job-id <jobId>
```

## 운영 검증

아래 시나리오로 fetch→submit→retrieve→persist happy path와 복구 경로를 확인합니다.

| # | 시나리오 | 확인 포인트 |
| --- | --- | --- |
| 1 | fetch (소량 `--fetch-limit`) | MongoDB `recipe_ingestion_jobs`에 `fetched` 증가·`recipe-ingestion-fetch-completed` 발행 |
| 2 | submit consumer (상시) | `submitted`·OpenAI `batch_id` 기록 |
| 3 | retrieve | `retrieved`·`recipe-ingestion-retrieved` 토픽 발행 |
| 4 | persist consumer (상시) | PostgreSQL Recipe upsert·job `persisted` |
| 5 | submit `--retry-failed --retry-failed-limit N` | `failed` job 재큐잉 후 재submit |
| 6 | Kafka 재전달·`persist --job-id` | 멱등 persist·수동 복구 |

메트릭(`recipe_ingestion_stage_total` 등) 확인 절차는 [Observability](../other/observability)를 참고하세요.

## 관련 문서

- [레시피 수집(ETL)](../project/recipe-ingestion)
- [배치/스케줄 작업](./batch-jobs)
- [Kafka 소비/신뢰성](./kafka-reliability)
- [Consumer 운영](./operations)
