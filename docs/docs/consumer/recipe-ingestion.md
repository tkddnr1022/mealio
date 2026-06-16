---
title: 레시피 수집 상세
---

# 레시피 수집 상세

## 이 문서로 해결할 질문

- fetch→submit→retrieve→persist 각 단계의 책임은?
- job 상태 전이와 멱등 키는?
- 운영·검증은 어떻게 하는가?

개요: [레시피 수집(ETL)](../project/recipe-ingestion)

## 파이프라인

```text
fetch → submit → retrieve → persist
```

| 단계 | 주체 | 저장소·출력 |
| --- | --- | --- |
| **fetch** | standalone job | MongoDB `recipe_ingestion_jobs` (`fetched`) |
| **submit** | standalone job | OpenAI Batch (`submitted`) |
| **retrieve** | standalone job | `retrieved_data` + Kafka |
| **persist** | Kafka consumer | PostgreSQL Recipe |

기준: MongoDB `recipe_ingestion_jobs` · API 커서 `recipe_ingestion_state`

## 데이터 원천

식약처 Open API — 조리식품 레시피 DB

```
GET /api/{keyId}/{serviceId}/json/{startIdx}/{endIdx}
```

- `source_id` = 응답 `RCP_SEQ` (멱등 upsert 키)
- 1회 최대 1000건 (`fetchLimit` ≤ 1000)

## 상태 전이

```text
fetched → submitting → submitted
        → retrieving → retrieved
        → persisting → persisted
retry_count >= 3 → failed
```

| 전이 | 트리거 |
| --- | --- |
| → fetched | fetch job API row upsert |
| → submitted | OpenAI batch 생성 |
| → retrieved | batch output 파싱 + Kafka |
| → persisted | PG upsert 성공 |
| → failed | retry ceiling |

## persist Consumer

- 토픽: `recipe-ingestion-retrieved`
- payload: `{ jobId }`
- 멱등: `retrieved` → `persisting` 조건부 전환, Kafka redelivery 안전
- PG: `(source, sourceRecipeId)` unique upsert

## CLI

```bash
pnpm run recipe-ingestion:fetch
pnpm run recipe-ingestion:submit --submit-batch-size 50
pnpm run recipe-ingestion:retrieve
```

## 운영 검증

[Observability](../other/observability) §8-A — happy path, partial fail, Kafka redelivery.

## 관련 문서

- [배치/스케줄 작업](./batch-jobs)
- [Kafka 소비/신뢰성](./kafka-reliability)

## 참고 코드·계약

- [레시피 수집 파이프라인](../project/recipe-ingestion)
- [레시피 수집](../project/recipe-ingestion)
