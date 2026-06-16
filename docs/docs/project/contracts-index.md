---
title: 데이터/계약 인덱스
sidebar_position: 10
---

# 데이터/계약 인덱스

스키마·API·이벤트 계약 문서 링크 허브.

## 데이터 스키마

| 문서 | 내용 |
| --- | --- |
| [도메인 개요](./domain) | 엔티티 관계 요약 |
| [데이터 모델/스키마](../shared/data-models) | Prisma/Mongoose |
| [데이터 모델](../shared/data-models) · server/shared/src/database/prisma/schema.prisma | 의미 중심 통합 스키마 |
| `server/shared/.../schema.prisma` | PostgreSQL 코드 기준 |
| `server/shared/.../mongoose/schemas/` | MongoDB 코드 기준 |

## REST API

| 문서 | 파일 |
| --- | --- |
| [API 문서](../producer/api) | — |
| Producer OpenAPI | [Producer API](../producer/api) · server/producer/src/modules/ |
| Frontend BFF OpenAPI | [BFF Route Handler](../client/api-bff) · client/src/app/api/ |
| [도메인 API 가이드](../producer/domain-api) | 엔드포인트 요약 |

## Kafka·이벤트

| 문서 | 파일 |
| --- | --- |
| [이벤트 발행](../producer/event-publishing) | — |
| [이벤트/분석 파이프라인](../consumer/analytics-pipeline) | — |
| 이벤트 사전 | [Observability](../other/observability) |
| Kafka 상수 | `server/shared/src/constants/kafka-topics.ts` |
| 이벤트 타입 | `server/shared/src/types/events/` |

## 캐시·Redis

| 문서 | 파일 |
| --- | --- |
| [Redis 키/캐시 계약](../shared/redis-cache-contract) | — |
| 키 헬퍼 | `server/shared/src/constants/cache-keys.ts` |

## 아키텍처 문서

| 영역 | 인덱스 |
| --- | --- |
| 백엔드 | [Producer](../producer/architecture)·[Consumer](../consumer/architecture)·[Shared](../shared/overview) 아키텍처 문서 |
| 프론트 | [클라이언트 아키텍처](../client/architecture) · client/src/app/ |
| 컴포넌트 | [컴포넌트 구조](../client/components) · client/src/components/ |

## KPI·관측

| 문서 | 용도 |
| --- | --- |
| [Observability](../other/observability) | KPI 정의 |
| [분석 파이프라인](../consumer/analytics-pipeline) | 집계 파이프라인 |
| [Observability](../other/observability) | 검증·대시보드 |

## 변경 시 동기화 체크리스트

1. 코드 변경
2. 해당 API 계약·스키마·이벤트 문서 갱신
3. Docusaurus 해당 페이지 갱신
4. [기여 가이드](../other/contributing) 준수

## 참고 코드·계약

- [기여 가이드](../other/contributing), [개발 규약](../other/development-conventions)
