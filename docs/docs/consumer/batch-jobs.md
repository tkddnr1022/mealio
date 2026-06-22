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

## 프로덕션 스케줄 (예시)

| Task | 주기 | 배포 |
| --- | --- | --- |
| kpi-rollup | 일 1회 | ECS Scheduled Task |
| recipe-ingestion-fetch | 운영 정책 | 별도 태스크 |
| recipe-ingestion-parse-submit | fetch 이후 | 별도 태스크 |
| recipe-ingestion-parse-retrieve | 1~5분 | 별도 태스크 |
| recipe-ingestion-embed-submit | persist 이후 | 별도 태스크 |
| recipe-ingestion-embed-retrieve | 1~5분 | 별도 태스크 |

fetch·submit cron 주기와 `fetchLimit`는 운영 runbook에서 조율합니다.

## 새 Job 추가 시

1. `server/consumer/.../` job 모듈과 `run-*.ts` CLI를 추가합니다.
2. `server/consumer/package.json`에 script를 등록합니다.
3. 관련 consumer 문서(아키텍처·배치·운영)를 갱신합니다.
4. 필요하면 [Observability](../other/observability) 검증 시나리오를 추가합니다.

## 관련 문서

- [Consumer 아키텍처](./architecture)
- [환경 변수](./environment-variables)
- [레시피 수집 상세](./recipe-ingestion)
