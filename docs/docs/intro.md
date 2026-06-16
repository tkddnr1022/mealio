---
slug: /
sidebar_position: 0
title: 소개
---

# Mealio 문서

Mealio 모노레포(`client`, `producer`, `consumer`, `shared`)의 공식 문서 사이트입니다.

## 문서 구조

| 섹션 | 설명 |
| --- | --- |
| **프로젝트** | 개요, 아키텍처, 온보딩, 배포 등 전체 관점 |
| **client** | Next.js 프론트엔드 |
| **producer** | NestJS API 서버 |
| **consumer** | Kafka Consumer·배치 작업 |
| **shared** | 공용 타입·DB·상수 |
| **기타** | Observability, 디자인 시스템, 기여 가이드 |

## 목차 계획 (SSOT)

문서 목차·작성 방향은 [`agent/docusaurus_documentation_plan.md`](https://github.com/tkddnr1022/mealio/blob/main/agent/docusaurus_documentation_plan.md)를 따릅니다.

## 로컬 실행

```bash
pnpm install
pnpm --filter mealio-docs start
```

## 작성 현황

### 1차 (완료)

| 문서 | 상태 |
| --- | --- |
| [로컬 개발/온보딩](./project/getting-started) | ✅ |
| [도메인 개요](./project/domain) | ✅ |
| [E2E 시나리오/화면 흐름](./project/e2e-scenarios) | ✅ |
| [추천 시스템](./project/recommendation) | ✅ |
| [에러 처리/Toast](./client/error-toast) | ✅ |
| [이벤트/분석 파이프라인](./consumer/analytics-pipeline) | ✅ |

### 2차 — 인증·캐시·챗봇 (완료)

| 문서 | 상태 |
| --- | --- |
| [인증 (client)](./client/auth) | ✅ |
| [캐시 (client)](./client/cache) | ✅ |
| [챗봇 UI/스트리밍](./client/chatbot-ui) | ✅ |
| [인증/인가 (producer)](./producer/auth) | ✅ |
| [캐시 (producer)](./producer/cache) | ✅ |
| [챗봇/SSE (producer)](./producer/chatbot-sse) | ✅ |
| [캐시 (consumer)](./consumer/cache) | ✅ |
| [캐시 무효화](./consumer/cache-invalidation) | ✅ |
| [챗봇 처리](./consumer/chatbot) | ✅ |
| [Redis 키/캐시 계약](./shared/redis-cache-contract) | ✅ |

### 3차 — 프로젝트·아키텍처·API (완료)

| 문서 | 상태 |
| --- | --- |
| [프로젝트 개요](./project/overview) | ✅ |
| [시스템 아키텍처](./project/architecture) | ✅ |
| [모노레포 구조](./project/monorepo) | ✅ |
| [배포/환경 전략](./project/deployment) | ✅ |
| [클라이언트 아키텍처](./client/architecture) | ✅ |
| [Producer 아키텍처](./producer/architecture) | ✅ |
| [Consumer 아키텍처](./consumer/architecture) | ✅ |
| [도메인 API 가이드](./producer/domain-api) | ✅ |
| [추천 API](./producer/recommendation-api) | ✅ |

### 4차 — API·운영·계약 (완료)

| 문서 | 상태 |
| --- | --- |
| [API 클라이언트/BFF](./client/api-bff) | ✅ |
| [상태 관리](./client/state) | ✅ |
| [컴포넌트 구조/규칙](./client/components) | ✅ |
| [이벤트 발행](./producer/event-publishing) | ✅ |
| [API 문서](./producer/api) | ✅ |
| [운영 포인트 (producer)](./producer/operations) | ✅ |
| [Kafka 소비/신뢰성](./consumer/kafka-reliability) | ✅ |
| [배치/스케줄 작업](./consumer/batch-jobs) | ✅ |
| [운영/복구](./consumer/operations) | ✅ |
| [레시피 수집 상세](./consumer/recipe-ingestion) | ✅ |
| [레시피 수집(ETL)](./project/recipe-ingestion) | ✅ |
| [데이터/계약 인덱스](./project/contracts-index) | ✅ |
| [Observability](./other/observability) | ✅ |
| [기여 가이드](./other/contributing) | ✅ |
| [Shared 패키지 개요](./shared/overview) | ✅ |
| [데이터 모델/스키마](./shared/data-models) | ✅ |
| [공유 계약](./shared/contracts) | ✅ |

### 스텁 (미작성)

- [접근성/성능 기준](./client/accessibility-performance)
- [Design System](./other/design-system)
- [개발 규약](./other/development-conventions)
- [용어집/FAQ](./other/glossary-faq)
