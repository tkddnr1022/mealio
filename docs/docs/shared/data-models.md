# 데이터 모델/스키마

## 이 문서로 해결할 질문

- PostgreSQL vs MongoDB에 무엇이 저장되나요?
- Prisma·Mongoose 스키마의 코드 기준은 어디인가요?
- 스키마를 변경할 때 어떤 문서를 함께 갱신해야 하나요?

## 저장소 분리

| 저장소 | ORM | 주요 모델 |
| --- | --- | --- |
| **PostgreSQL** | Prisma | User, Recipe, Ingredient, RecipeEmbedding, UserRecipeRecommendation, ChatbotCreditDeduction |
| **MongoDB** | Mongoose | Inventory, ChatbotLog, ChatbotConversation, EventLog, recipe_ingestion_*, kpi_rollups |

엔티티 의미와 필드 설명은 [도메인](../project/domain) 문서를 참고하세요.

## PostgreSQL (Prisma)

Prisma 스키마의 코드 기준은 `server/shared/.../schema.prisma`입니다.

| 모델 | 핵심 필드·관계 |
| --- | --- |
| User | email, platformName/Id, creditBalance |
| RecipeCategory | key, name, displayOrder |
| Recipe | instructions(JSON), nutrition(JSON), categoryId |
| RecipeStats | viewCount, likeCount (1:1 Recipe) |
| IngredientCategory | key, name, displayOrder |
| Ingredient | name, categoryId |
| RecipeIngredient | recipeId, ingredientId, amount |
| RecipeEmbedding | recipeId PK, embedding(vector), documentText, version |
| UserRecipeRecommendation | userId, recipeId, rank, score, reason |
| ChatbotCreditDeduction | streamChannelId PK, credits |

마이그레이션 파일은 `server/shared/.../migrations/`에 있습니다.

```bash
pnpm run db:prisma:migrate:dev
pnpm run db:prisma:migrate:deploy  # prod
```

## MongoDB (Mongoose)

Mongoose 스키마의 코드 기준은 `server/shared/.../schemas/`입니다.

| 컬렉션 | 스키마 파일 | TTL |
| --- | --- | --- |
| `inventory` | `inventory.schema.ts` | — |
| `chatbot_logs` | `chatbot-log.schema.ts` | 30일 |
| `chatbot_conversations` | `chatbot-conversation.schema.ts` | — |
| `event_logs` | `event-log.schema.ts` | 90일 |
| `recipe_ingestion_jobs` | `recipe-ingestion-job.schema.ts` | — |
| `recipe_ingestion_state` | `recipe-ingestion-state.schema.ts` | — |
| `kpi_rollups` | `kpi-rollup.schema.ts` | 400일 |

## 필드 의미·동기화

[도메인](../project/domain) 문서와 `server/shared/.../schema.prisma`를 함께 참고하세요. Prisma와 Mongoose 스키마는 코드 기준과 **일치하도록 유지**해야 합니다.

## 시드

```bash
pnpm run db:prisma:seed
pnpm run db:mongoose:seed
```

## 변경 체크리스트

1. `schema.prisma` 또는 Mongoose 스키마를 수정합니다.
2. 마이그레이션을 생성하고 적용합니다.
3. [도메인](../project/domain) 문서와 본 문서를 갱신합니다.
4. OpenAPI DTO와 관련 문서를 동기화합니다.
5. Docusaurus의 본 문서와 도메인 문서를 갱신합니다.

## 관련 문서

- [개요](./overview)
- [도메인](../project/domain)
- [레시피 임베딩](../consumer/recipe-embedding)
- [공유 계약](./contracts)
- [환경 변수](./environment-variables)
