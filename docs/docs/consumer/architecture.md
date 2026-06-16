# Consumer 아키텍처

## 이 문서로 해결할 질문

- Consumer 패키지의 전체 구조는 무엇인가요?
- Kafka consumer vs standalone job 차이는 무엇인가요?
- 내결함성(DLQ·멱등)은 어디서 처리하나요?

## 역할

Kafka 이벤트 **수신·비동기 처리**, OpenAI 연동, DB 저장·로그, **캐시 무효화 발행**, **배치 job** (KPI, recipe ingestion).

HTTP API는 제공하지 않습니다 (Producer가 담당).

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

Job 패턴: `NestFactory.createApplicationContext` + `run-*.ts` CLI.

## Processor 패턴

```text
Kafka message
  → BaseTopicProcessor (재시도·DLQ)
  → Handler(s) (도메인 로직)
  → DB / Redis / OpenAI
  → CacheInvalidationRequestService (필요 시)
```

Handler는 **Kafka를 직접 발행하지 않음** — 무효화는 RequestService 경유.

## 주요 Consumer 그룹

| 토픽 | 그룹 | 핵심 Handler |
| --- | --- | --- |
| `chatbot-requests` | chatbot-group | ProcessChatHandler |
| `user-events` | analytics-group | UpdateInventory, Recommendation |
| `activity-events` | activity-events-group | EventLog, 추천 보정 |
| `cache-invalidation` | cache-invalidation-group | RedisInvalidationHandler |

→ [Kafka 소비/신뢰성](./kafka-reliability)

## 신뢰성

- **at-least-once** 전제 — 멱등 키·upsert·`skipDuplicates`
- 실패 시 재시도 → **DLQ** 토픽
- lag: `consumer-lag.monitor.ts`

## DB 사용

| 저장소 | 용도 |
| --- | --- |
| PostgreSQL | Recipe 도메인, 추천 원본 테이블, 크레딧 차감 |
| MongoDB | EventLog, ChatbotLog, ingestion jobs |
| Redis | Handler 캐시, 스트림 발행 |

## 관련 문서

- [챗봇 처리](./chatbot)
- [추천 파이프라인](./recommendation-pipeline)
- [배치/스케줄 작업](./batch-jobs)
- [레시피 수집 상세](./recipe-ingestion)

## 참고 코드·계약

- [Consumer 아키텍처](../consumer/architecture) · server/consumer/src/ (§2.1)
- [개발 규약](../other/development-conventions)
