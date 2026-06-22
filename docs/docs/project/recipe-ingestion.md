# 레시피 수집(ETL)

## 이 문서로 해결할 질문

- Mealio 레시피 데이터는 어디서 오고 어떻게 가공되나요?
- fetch·parse-submit·parse-retrieve·persist·embed-submit·embed-retrieve 단계는 각각 무엇을 하나요?
- 로컬에서 파이프라인 job을 어떻게 실행하나요?

## 목적

**식약처 공공데이터** 레시피를 수집하고, **OpenAI Batch API**로 정규화·매핑한 뒤 PostgreSQL에 영속화합니다.

## 단계 요약

```mermaid
flowchart LR
    API[공공 API] --> Fetch
    Fetch --> Mongo[(ingestion jobs)]
    Mongo --> ParseSubmit
    ParseSubmit --> ParseOpenAI[OpenAI Batch (parse)]
    ParseOpenAI --> ParseRetrieve
    ParseRetrieve --> KafkaPersist[Kafka persist-triggered]
    KafkaPersist --> Persist
    Persist --> KafkaEmbed[Kafka embed-submit-triggered]
    KafkaEmbed --> EmbedSubmit
    EmbedSubmit --> EmbedOpenAI[OpenAI Batch (embedding)]
    EmbedOpenAI --> EmbedRetrieve
    Persist --> PG[(PostgreSQL Recipe)]
    EmbedRetrieve --> RE[(RecipeEmbedding pgvector)]
```

| 단계 | 실행 | 결과 |
| --- | --- | --- |
| fetch | cron / CLI | `status: fetched` |
| parse-submit | cron / CLI | `batch_id`, `parse_submitted` |
| parse-retrieve | cron / CLI | `parse_retrieved` + Kafka 이벤트 |
| persist | always-on consumer | `persisted` + Recipe row |
| embed-submit | cron / CLI + Kafka | 임베딩 Batch 요청 생성 |
| embed-retrieve | cron / CLI | RecipeEmbedding(pgvector) upsert + `embed_retrieved` |

## 저장소

| 저장소 | 내용 |
| --- | --- |
| MongoDB `recipe_ingestion_jobs` | 파이프라인 job 문서 |
| MongoDB `recipe_ingestion_state` | API 페이징 커서 |
| PostgreSQL | 최종 Recipe 도메인·RecipeEmbedding(pgvector) |

## 운영 특성

- `fetch`, `parse-submit`, `parse-retrieve`, `embed-submit`, `embed-retrieve`는 **독립 job**이며 cron으로 조율합니다.
- fetch·submit cron 주기와 `fetchLimit`는 운영 runbook에서 조율합니다.
- `persist`는 always-on Consumer가 Kafka 이벤트를 소비해 PostgreSQL에 반영합니다.

## 로컬 실행 (CLI)

인프라·Consumer가 기동된 상태에서 루트 스크립트로 각 단계를 실행할 수 있습니다.

```bash
pnpm run recipe-ingestion:fetch
pnpm run recipe-ingestion:parse-submit
pnpm run recipe-ingestion:parse-retrieve
pnpm run recipe-ingestion:embed-submit
pnpm run recipe-ingestion:embed-retrieve
```

## 관련 문서

- [레시피 수집 상세](../consumer/recipe-ingestion)
- [레시피 임베딩](../consumer/recipe-embedding)
- [배치/스케줄 작업](../consumer/batch-jobs)
- [시스템 아키텍처](./architecture)
- [도메인](./domain)
