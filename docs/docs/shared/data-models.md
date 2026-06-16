---
title: 데이터 모델/스키마
---

# 데이터 모델/스키마

## 이 문서로 해결할 질문

- PostgreSQL vs MongoDB에 무엇이 저장되는가?
- 스키마 코드·문서 SSOT는?

## 저장소 분리

| 저장소 | ORM | 주요 모델 |
| --- | --- | --- |
| **PostgreSQL** | Prisma | User, Recipe, Ingredient, UserRecipeRecommendation, ChatbotCreditDeduction |
| **MongoDB** | Mongoose | Inventory, ChatbotLog, EventLog, ChatbotConversation, recipe_ingestion_* |

의미·필드 설명: [도메인 개요](../project/domain)

## PostgreSQL (Prisma)

**코드 SSOT**: `server/shared/src/database/prisma/schema.prisma`

| 모델 | 핵심 필드·관계 |
| --- | --- |
| User | email, platformName/Id, creditBalance |
| Recipe | instructions(JSON), nutrition(JSON), categoryId |
| RecipeStats | viewCount, likeCount (1:1 Recipe) |
| Ingredient | name, categoryId |
| RecipeIngredient | recipeId, ingredientId, amount |
| UserRecipeRecommendation | userId, recipeId, rank, score, reason |
| ChatbotCreditDeduction | streamChannelId PK, credits |

마이그레이션: `server/shared/src/database/prisma/migrations/`

```bash
pnpm run db:prisma:migrate:dev
pnpm run db:prisma:migrate:deploy  # prod
```

## MongoDB (Mongoose)

**코드 SSOT**: `server/shared/src/database/mongoose/schemas/`

| 컬렉션 | 스키마 파일 | TTL |
| --- | --- | --- |
| inventories | `inventory.schema.ts` | — |
| chatbot_logs | `chatbot-log.schema.ts` | 30일 |
| event_logs | `event-log.schema.ts` | 90일 |
| recipe_ingestion_jobs | `recipe-ingestion-job.schema.ts` | — |
| kpi_rollups | `kpi-rollup.schema.ts` | — |

## 통합 문서

`agent/common/schema.md` — LLM·에이전트용 **의미 중심** 설명. Prisma/Mongoose와 **일치 유지** 의무.

## 시드

```bash
pnpm run db:prisma:seed
pnpm run db:mongoose:seed
```

## 변경 체크리스트

1. `schema.prisma` 또는 Mongoose schema 수정
2. 마이그레이션 생성·적용
3. `agent/common/schema.md` 갱신
4. OpenAPI DTO·명세 동기화
5. Docusaurus 본 문서·도메인 개요 갱신

## 관련 문서

- [데이터/계약 인덱스](../project/contracts-index)
- [Shared 패키지 개요](./overview)

## SSOT

- `agent/common/schema.md`
- `server/shared/src/database/prisma/schema.prisma`
- `server/shared/src/database/mongoose/schemas/`
