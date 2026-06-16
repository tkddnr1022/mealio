---
title: 배치/스케줄 작업
---

# 배치/스케줄 작업

## 이 문서로 해결할 질문

- Consumer standalone job은 무엇이 있고 어떻게 실행하나요?
- cron·ECS Scheduled Task와의 관계는 무엇인가요?

## Always-on vs Job

| 유형 | 기동 | 용도 |
| --- | --- | --- |
| **Consumer** (상시) | `pnpm run start:consumer` | Kafka 구독 |
| **Standalone job** | cron → CLI | 배치·ETL·KPI |

Job 패턴: `NestFactory.createApplicationContext` + `run-*.ts`

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

권장 스케줄: 매일 02:00 UTC (`aggregation_pipeline.md`)

## Recipe Ingestion Jobs

| Job | CLI script | 역할 |
| --- | --- | --- |
| fetch | `job:recipe-ingestion-fetch` | 공공데이터 수집 |
| submit | `job:recipe-ingestion-submit` | OpenAI Batch 제출 |
| retrieve | `job:recipe-ingestion-retrieve` | Batch 결과 조회 |
| persist | `job:recipe-ingestion-persist` | 수동 persist (운영) |

루트 단축:

```bash
pnpm run recipe-ingestion:fetch
pnpm run recipe-ingestion:submit
pnpm run recipe-ingestion:retrieve
```

상세: [레시피 수집 상세](./recipe-ingestion)

## 프로덕션 스케줄 (초안)

| Task | 주기 | 배포 |
| --- | --- | --- |
| kpi-rollup | 일 1회 | ECS Scheduled Task |
| recipe-ingestion-fetch | 운영 정책 | 별도 태스크 |
| recipe-ingestion-submit | fetch 이후 | 별도 태스크 |
| recipe-ingestion-retrieve | 1~5분 | 별도 태스크 |

`fetchLimit >= submitBatchSize` 권장.

## 새 Job 추가 시

1. `jobs/<name>/` 모듈 + `run-*.ts` CLI
2. `package.json` script 등록
3. `backend_architecture_spec_consumer.md` 동기화
4. validation 시나리오 추가 (선택)

## 관련 문서

- [레시피 수집 상세](./recipe-ingestion)
- [Consumer 아키텍처](./architecture)

## 참고 코드·계약

- [레시피 수집 파이프라인](../project/recipe-ingestion)
- [개발 규약](../other/development-conventions)
- [분석 파이프라인](../consumer/analytics-pipeline)
