# 아키텍처

## 이 문서로 해결할 질문

- Consumer 패키지의 전체 구조는 무엇인가요?
- Kafka consumer vs standalone job 차이는 무엇인가요?
- 내결함성(DLQ·멱등)은 어디서 처리하나요?

## 역할

Consumer 패키지는 Kafka 이벤트를 **수신·비동기 처리**하고, OpenAI와 연동하며, DB에 저장·로그를 남깁니다. 또한 **캐시 무효화를 발행**하고 KPI·레시피 수집(recipe ingestion) 같은 **배치 job**을 실행합니다.

HTTP API는 제공하지 않으며, 이 역할은 Producer가 담당합니다.

## 구조

```text
server/consumer/src/
├── main.ts              # always-on consumer 진입
├── consumers/           # Kafka topic별 processor
│   ├── chatbot-request/
│   ├── user-events/
│   ├── activity-events/
│   ├── cache-invalidation/
│   └── recipe-ingestion-persist/
├── jobs/                # standalone CLI (cron)
│   ├── kpi-rollup/
│   └── recipe-ingestion-*/
├── persistence/         # repositories, transactions
├── integrations/        # openai, kafka, public-data
└── reliability/         # DLQ, lag monitor, metrics
```

## Always-on vs Job

| 유형 | 기동 | 예 |
| --- | --- | --- |
| **Consumer** | `pnpm run start:consumer` | chatbot-request, user-events |
| **Standalone job** | cron → CLI | kpi-rollup, recipe-ingestion-fetch |

Standalone job은 `NestFactory.createApplicationContext`로 애플리케이션 컨텍스트를 만든 뒤 `run-*.ts` CLI로 실행하는 패턴을 따릅니다.

## 주요 Consumer 그룹

| 토픽 | 그룹 | 핵심 Handler |
| --- | --- | --- |
| `chatbot-requests` | chatbot-group | ProcessChatHandler |
| `user-events` | analytics-group | UpdateInventory, Recommendation |
| `activity-events` | activity-events-group | EventLog, 추천 보정 |
| `cache-invalidation` | cache-invalidation-group | RedisInvalidationHandler |
| `recipe-ingestion-retrieved` | recipe-ingestion-persist-group | PersistRecipeHandler |

Kafka·DLQ·그룹 상세는 [Kafka 소비/신뢰성](./kafka-reliability) 문서를 참고하세요.

## 신뢰성

- **at-least-once** 전달을 전제로 하며, 멱등 키·upsert·`skipDuplicates`로 중복 처리를 방지합니다.
- 처리에 실패하면 재시도한 뒤에도 해결되지 않으면 **DLQ** 토픽으로 보냅니다.
- consumer lag는 `server/consumer/.../consumer-lag.monitor.ts`로 모니터링합니다.

## DB 사용

| 저장소 | 용도 |
| --- | --- |
| PostgreSQL | Recipe 도메인, 추천 원본 테이블, 크레딧 차감 |
| MongoDB | EventLog, ChatbotLog, ingestion jobs |
| Redis | Handler 캐시, 스트림 발행 |

## 관련 문서

- [Kafka 소비/신뢰성](./kafka-reliability)
- [챗봇 처리](./chatbot)
- [추천 파이프라인](./recommendation-pipeline)
- [배치/스케줄 작업](./batch-jobs)
- [레시피 수집 상세](./recipe-ingestion)
- [공유 계약(Kafka·타입)](../shared/contracts)
