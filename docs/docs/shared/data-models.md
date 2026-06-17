# 데이터 모델/스키마

## 이 문서로 해결할 질문

- PostgreSQL vs MongoDB에 무엇이 저장되나요?
- 스키마 코드·문서 기준은 무엇인가요?

## 저장소 분리

| 저장소 | ORM | 주요 모델 |
| --- | --- | --- |
| **PostgreSQL** | Prisma | User, Recipe, Ingredient, UserRecipeRecommendation, ChatbotCreditDeduction |
| **MongoDB** | Mongoose | Inventory, ChatbotLog, EventLog, ChatbotConversation, recipe_ingestion_* |

의미·필드 설명: [도메인](../project/domain)

## PostgreSQL (Prisma)

**코드 기준**: `server/shared/src/database/prisma/schema.prisma`

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

**코드 기준**: `server/shared/src/database/mongoose/schemas/`

| 컬렉션 | 스키마 파일 | TTL |
| --- | --- | --- |
| inventories | `inventory.schema.ts` | — |
| chatbot_logs | `chatbot-log.schema.ts` | 30일 |
| event_logs | `event-log.schema.ts` | 90일 |
| recipe_ingestion_jobs | `recipe-ingestion-job.schema.ts` | — |
| kpi_rollups | `kpi-rollup.schema.ts` | — |

## 필드 의미·동기화

[도메인](../project/domain)와 `server/shared/src/database/prisma/schema.prisma`를 함께 참고합니다. Prisma/Mongoose 스키마와 **일치 유지**가 필요합니다.

## 시드

```bash
pnpm run db:prisma:seed
pnpm run db:mongoose:seed
```

## 변경 체크리스트

1. `schema.prisma` 또는 Mongoose schema 수정
2. 마이그레이션 생성·적용
3. [도메인](../project/domain) 및 본 문서 갱신
4. OpenAPI DTO·문서 동기화
5. Docusaurus 본 문서·도메인 갱신

## 관련 문서

- [개요](./overview)
