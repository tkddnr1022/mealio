# 배치/스케줄 작업

## 이 문서로 해결할 질문

- Consumer standalone job은 무엇이 있고 어떻게 실행하나요?
- cron·ECS Scheduled Task와의 관계는 무엇인가요?

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
| 구현 | `jobs/kpi-rollup/kpi-rollup.service.ts` |
| 입력 | MongoDB `event_logs` |
| 출력 | `kpi_rollups` 컬렉션 |
| KPI 예 | favorite CVR, recommendation latency, search CTR |

권장 스케줄은 매일 02:00 UTC이며, [Observability](../other/observability) 집계 파이프라인을 참고하세요.

## Recipe Ingestion Jobs

| Job | CLI script | 역할 |
| --- | --- | --- |
| fetch | `job:recipe-ingestion-fetch` | 공공데이터 수집 |
| submit | `job:recipe-ingestion-submit` | OpenAI Batch 제출 |
| retrieve | `job:recipe-ingestion-retrieve` | Batch 결과 조회 |
| persist | `job:recipe-ingestion-persist` | 수동 persist (운영) |

모노레포 루트에서는 아래 단축 명령을 사용할 수 있습니다.

```bash
pnpm run recipe-ingestion:fetch
pnpm run recipe-ingestion:submit
pnpm run recipe-ingestion:retrieve
```

단계별 상세는 [레시피 수집 상세](./recipe-ingestion)를 참고하세요.

## 프로덕션 스케줄 (초안)

| Task | 주기 | 배포 |
| --- | --- | --- |
| kpi-rollup | 일 1회 | ECS Scheduled Task |
| recipe-ingestion-fetch | 운영 정책 | 별도 태스크 |
| recipe-ingestion-submit | fetch 이후 | 별도 태스크 |
| recipe-ingestion-retrieve | 1~5분 | 별도 태스크 |

`fetchLimit`은 `submitBatchSize` 이상으로 설정하는 것을 권장합니다.

## 새 Job 추가 시

1. `jobs/<name>/` 모듈과 `run-*.ts` CLI를 추가합니다.
2. `package.json`에 script를 등록합니다.
3. Consumer 내부 명세를 동기화합니다.
4. 필요하면 validation 시나리오를 추가합니다.

## 관련 문서

- [레시피 수집 상세](./recipe-ingestion)
- [Consumer 아키텍처](./architecture)
