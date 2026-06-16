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

나머지 페이지는 스텁 상태입니다.
