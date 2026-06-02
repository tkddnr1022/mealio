# Recipe Ingestion 운영 Runbook (Phase 5)

`fetch -> submit -> retrieve -> persist` 파이프라인의 운영 스케줄, 장애 복구, 검증 절차를 정의한다.

---

## 1) 배포 토폴로지

| 구성 | 실행 형태 | 커맨드 |
|------|-----------|--------|
| fetch | ECS Scheduled Task | `pnpm --filter consumer run job:recipe-ingestion-fetch --fetch-limit 200` |
| submit | ECS Scheduled Task | `pnpm --filter consumer run job:recipe-ingestion-submit --submit-batch-size 100` |
| retrieve | ECS Scheduled Task | `pnpm --filter consumer run job:recipe-ingestion-retrieve` |
| persist | ECS Service (always-on) | Consumer app 상시 구동 (`recipe-ingestion-persist` Kafka consumer 포함) |

기본 원칙:
- fetch, submit, retrieve는 **서로 다른 Task Definition / Schedule**로 분리한다.
- persist는 Scheduled Task가 아니라 Kafka consumer 서비스로 운영한다.
- `fetchLimit >= submitBatchSize`를 기본 정책으로 유지한다.

---

## 2) 권장 스케줄 (초기안)

| 작업 | EventBridge cron(UTC) | KST 환산 | 목적 |
|------|------------------------|----------|------|
| fetch | `cron(0/15 * * * ? *)` | 매시 15분 간격 | 원본 데이터 수집 |
| submit | `cron(5/15 * * * ? *)` | fetch + 5분 오프셋 | Batch 제출 |
| retrieve | `cron(0/3 * * * ? *)` | 3분 간격 | 완료 batch 빠른 회수 |

스케줄 정책:
- fetch/submit는 같은 시각 동시 실행을 피하기 위해 오프셋을 둔다.
- retrieve는 submit보다 짧은 주기로 돌려 지연을 줄인다.
- 단일 작업의 예상 수행 시간이 주기를 초과하면 주기 상향 또는 batch 크기 하향으로 조정한다.

---

## 3) ECS Task Definition 체크리스트

- **이미지/명령**
  - fetch: `job:recipe-ingestion-fetch`
  - submit: `job:recipe-ingestion-submit`
  - retrieve: `job:recipe-ingestion-retrieve`
- **환경 변수**
  - 공통: `NODE_ENV`, `MONGODB_URL`, `POSTGRESQL_URL`, `REDIS_URL`, `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`
  - ingestion: `PUBLIC_DATA_API_KEY`, `OPENAI_API_KEY`, `OPENAI_BATCH_MODEL`, `METRICS_ENABLED`
- **IAM 권한**
  - Secrets Manager/SSM 파라미터 조회
  - ECR pull, CloudWatch logs write
  - (사용 시) KMS decrypt
- **동시성 정책**
  - 동일 schedule의 중복 실행 방지(이전 실행이 남아있으면 skip 또는 fail-fast)
  - 장애 재시작 횟수는 1~2회로 제한하고, 실패 원인은 runbook 절차로 수동 복구

---

## 4) 장애 복구 CLI

## 4.1 failed 재큐잉 후 submit

```bash
pnpm --filter consumer run job:recipe-ingestion-submit --retry-failed --retry-failed-limit 100 --submit-batch-size 100
```

- 동작: `status=failed` 중 오래된 순서로 최대 N건을 `fetched`로 되돌린 뒤 submit 수행.
- 권장: 대량 복구 시 `retry-failed-limit`을 점진적으로 증가시켜 부하를 제어한다.

## 4.2 persist 수동 실행 (특정 job 강제 처리)

```bash
pnpm --filter consumer run job:recipe-ingestion-persist --job-id <jobObjectId>
```

- 동작: `retrieved` 상태 job을 direct persist 경로로 즉시 처리.
- 사용 상황: consumer 트리거와 별개로 운영자가 특정 job을 수동 처리해야 할 때.

---

## 5) 운영 지표/알림

Prometheus 지표:
- `recipe_ingestion_stage_total{stage,outcome}`
- `recipe_ingestion_stage_latency_ms{stage}`
- `recipe_ingestion_parse_confidence_total{level}`
- `recipe_ingestion_ingredient_match_total{match_method}`
- `recipe_ingestion_llm_tokens_total{token_type}`
- `kafka_consumer_lag{topic,partition,consumer_group}`

경보 예시:
- `recipe-ingestion-retrieved` lag이 10분 이상 지속 증가
- `recipe_ingestion_stage_total{stage="persist",outcome="failed"}` 급증
- `recipe_ingestion_parse_confidence_total{level="low"}` 비율 급증

---

## 6) 운영 검증 순서

1. fetch 1회 실행 후 `recipe_ingestion_jobs(status=fetched)` 증가 확인
2. submit 실행 후 `submitted` 증가 및 `batchId` 저장 확인
3. retrieve 실행 후 `retrieved` 증가 + Kafka emit 로그 확인
4. persist 소비 후 `persisted` 증가 및 PostgreSQL upsert 확인
5. `/metrics`에서 stage/latency/lag 지표 노출 확인
6. 실패 job 생성 후 `--retry-failed`, `job:recipe-ingestion-persist --job-id` 복구 절차 검증
