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

## 1차 작성 우선순위

| 문서 | 상태 |
| --- | --- |
| [로컬 개발/온보딩](./project/getting-started) | ✅ 작성 완료 |
| [도메인 개요](./project/domain) | ✅ 작성 완료 |
| [E2E 시나리오/화면 흐름](./project/e2e-scenarios) | ✅ 작성 완료 |
| [추천 시스템](./project/recommendation) | ✅ 작성 완료 |
| [에러 처리/Toast](./client/error-toast) | ✅ 작성 완료 |
| [이벤트/분석 파이프라인](./consumer/analytics-pipeline) | ✅ 작성 완료 |

나머지 페이지는 스텁 상태입니다.
