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
| `agent/common/schema.md` | 의미 중심 통합 스키마 (SSOT) |
| `server/shared/.../schema.prisma` | PostgreSQL 코드 SSOT |
| `server/shared/.../mongoose/schemas/` | MongoDB 코드 SSOT |

## REST API

| 문서 | 파일 |
| --- | --- |
| [API 문서](../producer/api) | — |
| Producer OpenAPI | `agent/common/openapi_spec_backend.yaml` |
| Frontend BFF OpenAPI | `agent/common/openapi_spec_frontend.yaml` |
| [도메인 API 가이드](../producer/domain-api) | 엔드포인트 요약 |

## Kafka·이벤트

| 문서 | 파일 |
| --- | --- |
| [이벤트 발행](../producer/event-publishing) | — |
| [이벤트/분석 파이프라인](../consumer/analytics-pipeline) | — |
| 이벤트 사전 | `agent/observability/event_dictionary.md` |
| Kafka 상수 | `server/shared/src/constants/kafka-topics.ts` |
| 이벤트 타입 | `server/shared/src/types/events/` |

## 캐시·Redis

| 문서 | 파일 |
| --- | --- |
| [Redis 키/캐시 계약](../shared/redis-cache-contract) | — |
| 키 헬퍼 | `server/shared/src/constants/cache-keys.ts` |

## 아키텍처 명세

| 영역 | 인덱스 |
| --- | --- |
| 백엔드 | `agent/backend/spec/backend_architecture_spec.md` |
| 프론트 | `agent/frontend/spec/frontend_architecture_spec.md` |
| 컴포넌트 | `agent/frontend/spec/frontend_components_structure_spec.md` |

## KPI·관측

| 문서 | 용도 |
| --- | --- |
| `agent/observability/product_kpi_contract.md` | KPI 정의 |
| `agent/observability/aggregation_pipeline.md` | 집계 파이프라인 |
| [Observability](../other/observability) | 검증·대시보드 |

## 변경 시 동기화 체크리스트

1. 코드 변경
2. 해당 OpenAPI / schema.md / event_dictionary 갱신
3. Docusaurus 해당 페이지 갱신
4. `spec_driven_development_guidelines.md` 준수

## SSOT

- `agent/common/spec_driven_development_guidelines.md`
