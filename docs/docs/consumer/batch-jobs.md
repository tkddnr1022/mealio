# 배치/스케줄 작업

## 이 문서로 해결할 질문

- Consumer standalone job은 무엇이 있고 어떻게 실행하나요?
- 프로덕션(EC2)에서 배치 잡을 어떻게 실행하나요?

## Always-on vs Job

| 유형 | 기동 | 용도 |
| --- | --- | --- |
| **Consumer** (상시) | `pnpm run start:consumer` | Kafka 구독 |
| **Standalone job** | cron → CLI | 배치·ETL·KPI |

Standalone job은 `NestFactory.createApplicationContext`로 애플리케이션 컨텍스트를 만든 뒤 `run-*.ts` CLI로 실행하는 패턴을 따릅니다.

## KPI 롤업

```bash
pnpm run kpi:rollup
# 또는
pnpm --filter consumer run job:kpi-rollup
```

| 항목 | 내용 |
| --- | --- |
| 구현 | `server/consumer/.../kpi-rollup.service.ts` |
| 입력 | MongoDB `event_logs` |
| 출력 | `kpi_rollups` 컬렉션 |
| KPI 예 | favorite CVR, recommendation latency, search CTR |

[Observability](../other/observability) 집계 파이프라인을 참고하세요.

## Recipe Ingestion Jobs

| Job | CLI script | 역할 |
| --- | --- | --- |
| fetch | `job:recipe-ingestion-fetch` | 공공데이터 수집 |
| parse-submit | `job:recipe-ingestion-parse-submit` | OpenAI Batch 파싱 요청 제출 |
| parse-retrieve | `job:recipe-ingestion-parse-retrieve` | 파싱 Batch 결과 조회 |
| persist | `job:recipe-ingestion-persist` | 수동 persist (운영) |
| embed-submit | `job:recipe-ingestion-embed-submit` | 임베딩 Batch 요청 제출 |
| embed-retrieve | `job:recipe-ingestion-embed-retrieve` | 임베딩 Batch 결과 적재 |

모노레포 루트에서는 아래 단축 명령을 사용할 수 있습니다.

```bash
pnpm run recipe-ingestion:fetch
pnpm run recipe-ingestion:parse-submit
pnpm run recipe-ingestion:parse-retrieve
pnpm run recipe-ingestion:embed-submit
pnpm run recipe-ingestion:embed-retrieve
```

단계별 상세는 [레시피 수집 상세](./recipe-ingestion)를 참고하세요.

## 프로덕션 실행 (EC2 Docker)

프로덕션(EC2)에서는 consumer 이미지를 재사용한 일회성 컨테이너로 각 배치 잡을 실행합니다. `docker/scripts/run-job.sh`가 `mealio-net` 네트워크에 연결된 컨테이너를 생성하고 종료 후 자동 삭제합니다.

```bash
docker/scripts/run-job.sh kpi-rollup
docker/scripts/run-job.sh kpi-rollup 2026-05-22
docker/scripts/run-job.sh recipe-ingestion-fetch --fetch-limit 100
docker/scripts/run-job.sh recipe-ingestion-parse-retrieve
```

cron 등록 예시는 `docker/scripts/consumer.cron.example`을 참고하고, 실제 등록은 `crontab consumer.cron`으로 적용합니다.

| Task | cron 주기(예시) | 비고 |
| --- | --- | --- |
| kpi-rollup | 매일 10:00 KST | 전일 EventLog 집계 |
| recipe-ingestion-fetch | 매일 11:00 KST | 공공데이터 수집 |
| recipe-ingestion-parse-submit | 매일 11:30 KST (fallback) | Kafka 트리거 유실 시 보완 |
| recipe-ingestion-parse-retrieve | 매 5분 | pending 없으면 no-op |
| recipe-ingestion-embed-submit | 매일 14:30 KST (fallback) | Kafka 트리거 유실 시 보완 |
| recipe-ingestion-embed-retrieve | 매 5분 | pending 없으면 no-op |

## 새 Job 추가 시

1. `server/consumer/.../` job 모듈과 `run-*.ts` CLI를 추가합니다.
2. `server/consumer/package.json`에 script를 등록합니다.
3. `docker/scripts/consumer.cron.example`에 cron 항목을 추가합니다.
4. 관련 consumer 문서(아키텍처·배치·운영)를 갱신합니다.
5. 필요하면 [Observability](../other/observability) 검증 시나리오를 추가합니다.

## 관련 문서

- [Consumer 아키텍처](./architecture)
- [환경 변수](./environment-variables)
- [레시피 수집 상세](./recipe-ingestion)
