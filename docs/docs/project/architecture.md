# 시스템 아키텍처

## 이 문서로 해결할 질문

- Mealio의 주요 컴포넌트와 데이터 흐름은 무엇인가요?
- 동기(HTTP)와 비동기(Kafka) 경계는 어디인가요?
- 프로덕션 인프라 배치는 어떻게 되나요?

## 컴포넌트 다이어그램 (운영 예시)

```mermaid
flowchart LR
  subgraph frontend [Frontend]
    Client[client Next.js]
  end
  subgraph ec2 [AWS EC2]
    Nginx[Nginx]
    Producer[producer]
    Consumer[consumer]
    Kafka[Kafka]
    Prom[Prometheus]
    Graf[Grafana]
    Nginx --> Producer
    Producer --> Kafka
    Consumer --> Kafka
    Prom --> Producer
    Prom --> Consumer
    Graf --> Prom
  end
  subgraph managed [Managed]
    Atlas[(MongoDB Atlas)]
    Neon[(Neon PostgreSQL)]
    Upstash[(Upstash Redis)]
  end
  Client -->|HTTPS API| Nginx
  Producer --> Atlas
  Producer --> Neon
  Producer --> Upstash
  Consumer --> Atlas
  Consumer --> Neon
  Consumer --> Upstash
  Consumer --> OpenAI[OpenAI API]
```

- **Frontend**: Vercel(권장) 또는 EC2 Docker 중 하나를 선택해 배포합니다.
- **Vercel 배포 시**: Client는 EC2 외부에 두고, API만 Nginx를 경유합니다.

## 요청 경로 (동기)

```mermaid
flowchart LR
    B[Browser] --> C[client Next.js]
    C --> P[producer NestJS REST]
    P --> R[Redis cache / PostgreSQL / MongoDB]
    P -->|쓰기 시| K[Kafka publish]
```

읽기는 **Cache-Aside**를 우선 적용하며, 쓰기는 HTTP 200 응답 후 Consumer가 최종 반영합니다.

## 이벤트 경로 (비동기)

```mermaid
flowchart LR
    P[producer] --> K[Kafka topic]
    K --> CP[consumer processor]
    CP --> H[Handler]
    H --> S[DB / Redis / OpenAI]
    S --> CI[cache-invalidation / 추가 이벤트]
```

## 패키지 책임

| 패키지 | 동기/비동기 | 핵심 책임 |
| --- | --- | --- |
| `client` | 동기(HTTP/SSE) | UI, BFF Route Handler, ISR |
| `producer` | 동기 + 발행 | API, OAuth, 캐시 조회, Kafka produce, SSE 중계 |
| `consumer` | 비동기 | Kafka consume, GPT, 추천, ETL, KPI 롤업 |
| `shared` | — | 스키마, 타입, Kafka/Redis 상수 |

## 데이터 저장소 역할

| 저장소 | 데이터 예 |
| --- | --- |
| PostgreSQL | User, Recipe, Ingredient, UserRecipeRecommendation |
| MongoDB | Inventory, ChatbotLog, EventLog, ingestion jobs |
| Redis | API 캐시, refresh 세션 캐시, 챗봇 스트림, dedupe |
| Kafka | 도메인 이벤트 버스 (영속 아님) |
| S3 | 레시피 이미지 (확장) |

→ [도메인](./domain)

## 외부 서비스

| 서비스 | 사용처 |
| --- | --- |
| OpenAI | 챗봇, recipe ingestion Batch |
| Sentry | 에러 추적 (client, producer, consumer) |
| GA4 | 프론트 행동 분석 |
| CloudFlare | CDN (정적 자산·ISR) |

## 크로스 컷 관심사

| 관심사 | 구현 |
| --- | --- |
| 인증 | OAuth 백엔드 주도, JWT HttpOnly 쿠키 |
| 캐시 | Producer Cache-Aside + Consumer 무효화 |
| 관측성 | Correlation-ID, Prometheus `/metrics`, EventLog |
| 신뢰성 | Kafka at-least-once, DLQ, 멱등 키 |

## 관련 문서

- [모노레포 구조](./monorepo)
- [배포/환경 전략](./deployment)
- [추천 시스템](./recommendation)
- [E2E 시나리오](./e2e-scenarios)
