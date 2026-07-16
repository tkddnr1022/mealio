# 통합 데이터 스키마 설명 (Relational + NoSQL)

본 문서는 **레시피 추천/요리 보조 서비스**의 데이터 스키마를 LLM이 이해하고 활용할 수 있도록 **의미 중심(Semantic)** 으로 설명한 통합 스키마 문서이다.

시스템은 다음 두 가지 데이터 저장 방식을 혼합하여 사용한다.

* **RDB (정형 데이터, PostgreSQL + Prisma)**: 사용자, 레시피, 재료, 레시피-재료 관계
* **NoSQL (MongoDB + Mongoose)**: 유저 재료 상태, 챗봇 대화 로그, 이벤트 로그

> **정합성**: 이 문서는 `server/shared/src/database/` 의 Prisma `schema.prisma` 및 Mongoose `schemas/` 와 일치하도록 유지한다.

---

## 1. 전체 도메인 개요

### 핵심 도메인 엔티티 (RDB / Prisma)

* **User**: 서비스를 이용하는 사용자
* **RecipeCategory**: 레시피 카테고리 마스터 데이터
* **Recipe**: 요리 레시피
* **RecipeStats**: 레시피 조회/좋아요 집계 카운터
* **IngredientCategory**: 재료 카테고리 마스터 데이터
* **Ingredient**: 재료 마스터 데이터
* **RecipeIngredient**: 레시피와 재료 간의 다대다 관계
* **UserRecipeRecommendation**: 사용자별 추천 결과 SSOT (랭크·점수·근거)

### 행동/상태/로그 도메인 (NoSQL / Mongoose)

* **Inventory**: 사용자가 보유 재료·관심 재료·관심 레시피 ID를 관리하는 상태 문서 (`inventories` 컬렉션)
* **ChatbotLog**: LLM 챗봇 대화 기록 (`chatbot_logs` 컬렉션, 30일 TTL)
* **EventLog**: 도메인 이벤트 스트림 (`event_logs` 컬렉션, 90일 TTL)
* **RecipeIngestionJob**: 공공데이터 레시피 수집 파이프라인 job SSOT (`recipe_ingestion_jobs` 컬렉션)
* **RecipeIngestionState**: 공공데이터 API 순번 페이징 커서 singleton (`recipe_ingestion_state` 컬렉션)

---

## 2. RDB 스키마 (PostgreSQL, Prisma)

### 2.1 User

**의미**

* 서비스 사용자 계정 정보
* 소셜 로그인 기반 사용자를 고려한 구조

**필드 설명** (Prisma `User` ↔ DB 컬럼)

| 필드 (Prisma)   | DB 컬럼       | 타입           | 의미                           |
| --------------- | ------------- | -------------- | ------------------------------ |
| id              | id            | INT / SERIAL   | 사용자 고유 ID (PK)            |
| email           | email         | VARCHAR(100)   | 사용자 이메일 (UNIQUE)         |
| nickname        | nickname      | VARCHAR(50)    | 사용자 닉네임                  |
| platformName    | platform_name | VARCHAR(20)    | 로그인 플랫폼 (e.g. google, kakao) |
| platformId      | platform_id   | VARCHAR(100)   | 플랫폼 내 사용자 ID            |
| createdAt       | created_at    | TIMESTAMP      | 계정 생성 시각                 |
| updatedAt       | updated_at    | TIMESTAMP      | 계정 수정 시각                 |
| creditBalance      | credit_balance       | INT            | 남은 챗봇 크레딧 (기본 1000)   |
| creditMonthlyLimit | credit_monthly_limit | INT            | 월간 크레딧 상한(표시용, 기본 1000) |

**인덱스**: `(platform_name, platform_id)`, `(email)`, `(created_at)`

#### `chatbot_credit_deductions` (PostgreSQL)

챗봇 SSE 요청(`stream_channel_id`)당 크레딧 차감 1회를 보장하는 멱등 테이블. Prisma 모델 `ChatbotCreditDeduction`.

| 컬럼 | 타입 | 의미 |
| --- | --- | --- |
| stream_channel_id | VARCHAR(80) PK | Producer가 발급한 스트림 채널 ID |
| user_id | INT FK → User | 사용자 |
| credits | INT | 실제 차감한 크레딧 |
| created_at | TIMESTAMP | 기록 시각 |

### 2.2 RecipeCategory

**의미**

* 레시피 카테고리 마스터 데이터
* 카테고리 ID/키/표시명/정렬/활성화 상태를 단일 소스(SSOT)로 관리

**필드 설명** (Prisma `RecipeCategory` ↔ DB 컬럼)

| 필드 (Prisma) | DB 컬럼      | 타입         | 의미                                |
| ------------- | ------------ | ------------ | ----------------------------------- |
| id            | id           | INT          | 카테고리 ID (PK, 수동 부여)         |
| key           | key          | VARCHAR(50)  | 불변 카테고리 키 (`KOREAN`, `WESTERN` 등, UNIQUE) |
| name          | name         | VARCHAR(100) | 사용자 표시용 카테고리 이름         |
| displayOrder  | display_order| INT          | 카테고리 노출 정렬 순서 (기본 0)    |
| isActive      | is_active    | BOOLEAN      | 사용 여부 (기본 true)               |
| createdAt     | created_at   | TIMESTAMP    | 생성 시각                           |
| updatedAt     | updated_at   | TIMESTAMP    | 수정 시각                           |

**인덱스**: `(is_active, display_order)`, `UNIQUE(key)`

---

### 2.3 Recipe

**의미**

* 요리 레시피의 메타 정보와 조리 절차를 포함
* `RecipeCategory`와 FK로 연결되어 카테고리 무결성 보장

**특징**

* `instructions`: JSON 구조 → 단계별 조리 설명

**필드 설명** (Prisma `Recipe` ↔ DB 컬럼)

| 필드 (Prisma)   | DB 컬럼      | 타입            | 의미                             |
| --------------- | ------------ | --------------- | -------------------------------- |
| id              | id           | INT / SERIAL    | 레시피 ID (PK)                   |
| categoryId      | category     | INT             | 레시피 카테고리 ID (`RecipeCategory.id` FK); Prisma 필드 `categoryId` → DB 컬럼 `category` |
| title           | title        | VARCHAR(100)    | 레시피 제목                      |
| description     | description  | TEXT            | 레시피 요약 설명 (nullable)      |
| instructions    | instructions | JSON            | 조리 단계 (순서/텍스트/타이머 등) |
| difficulty      | difficulty   | SMALLINT        | 난이도 (1~5 등)                  |
| cookTime        | cook_time    | INT             | 예상 조리 시간 (분)              |
| imageUrl        | image_url    | VARCHAR(512)    | 레시피 이미지 URL (nullable)     |
| servings        | servings     | INT             | 인분 (기본값 2)                  |
| cookingMethod   | cooking_method | VARCHAR(50)   | 조리 방법 (예: 찌기, 볶기). nullable |
| dishType        | dish_type    | VARCHAR(50)     | 요리 종류 (예: 반찬, 국). nullable |
| nutrition       | nutrition    | JSON            | 1인분 영양 정보. nullable. `{ calories, carbohydrates, protein, fat, sodium }` (단위: kcal·g·mg) |
| cookingTip      | cooking_tip  | TEXT            | 저감·건강 조리 팁. nullable      |
| source          | source       | VARCHAR(50)     | 데이터 출처 식별자 (예: `foodsafety`). nullable |
| sourceRecipeId  | source_recipe_id | VARCHAR(50) | 출처별 레시피 ID (외부 API 일련번호 등). nullable |
| isPublished     | is_published | BOOLEAN         | 공개 여부 (기본값 true)          |
| createdAt       | created_at   | TIMESTAMP       | 생성 시각                        |
| updatedAt       | updated_at   | TIMESTAMP       | 수정 시각                        |

**`instructions` JSON 항목** (조리 단계 1건)

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| step | number | 단계 번호 |
| content | string | 조리 설명 |
| imageUrl | string \| null | 단계별 참고 이미지 URL (optional) |

**`nutrition` JSON 항목** (1인분 기준)

| 필드 | 타입 | 단위 | 의미 |
| --- | --- | --- | --- |
| calories | number | kcal | 열량 |
| carbohydrates | number | g | 탄수화물 |
| protein | number | g | 단백질 |
| fat | number | g | 지방 |
| sodium | number | mg | 나트륨 |

**제약**: `FK(category) -> RecipeCategory(id)` (Prisma: `categoryId` → `@map("category")`)
**인덱스(추가)**: `UNIQUE(source, source_recipe_id)` — 동일 출처 레시피 중복 방지 (nullable 조합 허용)  
**인덱스**: `(category, difficulty, cook_time, created_at)`, `(difficulty, cook_time, created_at)`, `(created_at DESC)`

### 2.4 RecipeStats

**의미**

* 레시피 통계(조회수, 좋아요 수) 전용 엔터티
* 정적 본문(`Recipe`)과 동적 카운터를 분리해 고빈도 업데이트 경합을 완화

**필드 설명** (Prisma `RecipeStats` ↔ DB 컬럼)

| 필드 (Prisma) | DB 컬럼    | 타입      | 의미 |
| ------------- | ---------- | --------- | ---- |
| recipeId      | recipe_id  | INT       | 레시피 ID (PK, `Recipe.id` FK) |
| viewCount     | view_count | INT       | 조회수 (기본값 0) |
| likeCount     | like_count | INT       | 좋아요 수 (기본값 0) |
| updatedAt     | updated_at | TIMESTAMP | 최종 통계 갱신 시각 |

**제약**: `FK(recipe_id) -> Recipe(id)` (ON DELETE CASCADE)  
**인덱스**: `(view_count DESC, recipe_id DESC)`, `(like_count DESC, recipe_id DESC)`

---

### 2.5 IngredientCategory

**의미**

* 재료 카테고리 마스터 데이터
* 카테고리 ID/키/표시명/정렬/활성화 상태를 단일 소스(SSOT)로 관리

**필드 설명** (Prisma `IngredientCategory` ↔ DB 컬럼)

| 필드 (Prisma) | DB 컬럼      | 타입         | 의미                                |
| ------------- | ------------ | ------------ | ----------------------------------- |
| id            | id           | INT          | 카테고리 ID (PK, 수동 부여)         |
| key           | key          | VARCHAR(50)  | 불변 카테고리 키 (`VEGETABLE` 등, UNIQUE) |
| name          | name         | VARCHAR(100) | 사용자 표시용 카테고리 이름         |
| displayOrder  | display_order| INT          | 카테고리 노출 정렬 순서 (기본 0)    |
| isActive      | is_active    | BOOLEAN      | 사용 여부 (기본 true)               |
| createdAt     | created_at   | TIMESTAMP    | 생성 시각                           |
| updatedAt     | updated_at   | TIMESTAMP    | 수정 시각                           |

**인덱스**: `(is_active, display_order)`, `UNIQUE(key)`

---

### 2.6 Ingredient

**의미**

* 재료 마스터 데이터
* `IngredientCategory`와 FK로 연결되어 카테고리 무결성 보장

**필드 설명** (Prisma `Ingredient` ↔ DB 컬럼)

| 필드 (Prisma) | DB 컬럼    | 타입         | 의미                             |
| ------------- | ---------- | ------------ | -------------------------------- |
| id            | id         | INT / SERIAL | 재료 ID (PK)                     |
| name          | name       | VARCHAR(100) | 재료명                           |
| categoryId    | category   | INT          | 재료 카테고리 ID (`IngredientCategory.id` FK); Prisma 필드 `categoryId` → DB 컬럼 `category` |
| createdAt     | created_at | TIMESTAMP    | 생성 시각                        |

**제약**: `FK(category) -> IngredientCategory(id)` (Prisma: `categoryId` → `@map("category")`)  
**인덱스**: `(category, name)`

---

### 2.7 RecipeIngredient

**의미**

* 레시피와 재료 간의 다대다 관계
* 특정 레시피에서 재료 사용량·단위·선택 여부 정의

**필드 설명** (Prisma `RecipeIngredient` ↔ DB 컬럼)

| 필드 (Prisma) | DB 컬럼      | 타입              | 의미                     |
| ------------- | ------------ | ----------------- | ------------------------ |
| id            | id           | INT / SERIAL      | 관계 ID (PK)             |
| recipeId      | recipe_id    | INT               | 레시피 ID (FK)           |
| ingredientId  | ingredient_id| INT               | 재료 ID (FK)             |
| amount        | amount       | DECIMAL(10,2)     | 필요 수량 (nullable)     |
| unit          | unit         | VARCHAR(20)       | 단위 g, ml, 개 등 (nullable) |
| isOptional    | is_optional  | BOOLEAN           | 선택 재료 여부 (기본 false) |

**제약**: `UNIQUE(recipe_id, ingredient_id)`  
**인덱스**: `(recipe_id)`, `(ingredient_id)`

---

### 2.8 UserRecipeRecommendation

**의미**

* 사용자별 추천 결과를 PostgreSQL에 저장하는 SSOT 엔터티
* Producer 추천 API는 이 테이블을 우선 조회하고, Redis는 서빙 캐시로만 사용

**필드 설명** (Prisma `UserRecipeRecommendation` ↔ DB 컬럼)

| 필드 (Prisma) | DB 컬럼 | 타입 | 의미 |
| ------------- | ------- | ---- | ---- |
| id | id | BIGINT / SERIAL | 추천 행 ID (PK) |
| userId | user_id | INT | 사용자 ID (FK → `User.id`) |
| recipeId | recipe_id | INT | 레시피 ID (FK → `Recipe.id`) |
| rank | rank | INT | 사용자별 추천 순위 (1이 최상위) |
| score | score | DECIMAL(8,4) | 추천 점수 |
| reason | reason | VARCHAR(255) | 추천 근거 요약 (nullable) |
| calculatedAt | calculated_at | TIMESTAMP | 점수 계산 시각 |
| createdAt | created_at | TIMESTAMP | 생성 시각 |
| updatedAt | updated_at | TIMESTAMP | 수정 시각 |

**제약**

* `UNIQUE(user_id, recipe_id)` — 동일 사용자/레시피 중복 방지
* `UNIQUE(user_id, rank)` — 사용자별 순위 중복 방지

**인덱스**

* `(user_id, score DESC)` — 상위 점수 조회
* `(updated_at DESC)` — 최근 재계산 대상/모니터링

---

### 2.9 RecipeEmbedding (RAG 벡터 인덱스)

**의미**

* 레시피 문서를 pgvector 임베딩으로 저장하는 검색 인덱스
* 챗봇 `search_recipes`의 semantic-first ANN 검색 기반 데이터

**필드 설명** (PostgreSQL `RecipeEmbedding`)

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| recipe_id | INT (PK, FK → Recipe.id) | 레시피 ID |
| embedding | vector(1536) | OpenAI 임베딩 벡터 |
| document_text | TEXT | 임베딩 생성에 사용한 원문(제목/설명/재료/카테고리 등) |
| embedding_model | VARCHAR(100) | 사용한 임베딩 모델명 |
| version | INT | 재생성 횟수(업서트 시 증가) |
| source_updated_at | TIMESTAMP | 원본 Recipe 최신 갱신 시각 스냅샷 |
| created_at | TIMESTAMP | 생성 시각 |
| updated_at | TIMESTAMP | 갱신 시각 |

**인덱스**

* `(updated_at DESC)` — 최신 재색인 추적
* ANN 검색은 Prisma raw query(`ORDER BY embedding <=> query_vector LIMIT k`)로 수행. 별도 ivfflat 인덱스는 현행 마이그레이션 기준 미사용.

---

## 3. NoSQL 스키마 (MongoDB, Mongoose)

> 아래 스키마는 `server/shared/src/database/mongoose/schemas/` 의 Mongoose 스키마와 일치한다.  
> 컬렉션·필드명·타입·enum·서브스키마를 구현 기준으로 기술한다.

---

### 3.1 Inventory

**컬렉션**: `inventory`  
**의미**

* 사용자별 인벤토리를 계층형으로 관리 (`ingredients.ownedIds`, `ingredients.favoriteIds`, `recipes.favoriteIds`)
* `Ingredient` 마스터와 JOIN하여 상세 정보 조회

**LLM 활용 포인트**

* 사용자 보유·관심 재료 기반 레시피 추천
* 부족 재료 안내

**필드 설명** (Mongoose `Inventory`)

| 필드                  | 타입     | 의미                             |
| --------------------- | -------- | -------------------------------- |
| userId                | Number   | 사용자 ID (required, unique, index) |
| ingredients.ownedIds      | [Number] | 보유 재료 ID 배열 (기본 [])      |
| ingredients.favoriteIds   | [Number] | 관심 재료 ID 배열 (기본 [])      |
| recipes.favoriteIds       | [Number] | 관심 레시피 ID 배열 (기본 [])    |
| lastSyncedAt          | Date     | 마지막 동기화 시각 (optional)    |
| createdAt             | Date     | 생성 시각 (timestamps)           |
| updatedAt             | Date     | 수정 시각 (timestamps)           |

**인덱스**: `ingredients.ownedIds`, `ingredients.favoriteIds`, `recipes.favoriteIds`

**문서 구조 예시**

```json
{
  "_id": "...",
  "userId": 1,
  "ingredients": {
    "ownedIds": [1, 5, 12],
    "favoriteIds": [3, 5]
  },
  "recipes": {
    "favoriteIds": [101, 202]
  },
  "lastSyncedAt": "2025-01-25T00:00:00.000Z",
  "createdAt": "2025-01-20T00:00:00.000Z",
  "updatedAt": "2025-01-25T00:00:00.000Z"
}
```

---

### 3.2 ChatbotLog

**컬렉션**: `chatbot_logs`  
**TTL**: 30일 (`expireAfterSeconds: 2592000`)  
**의미**

* 사용자-LLM 대화 메시지 단위 로그
* 역할(role), 메시지, 컨텍스트, LLM 메타(토큰·모델), 지연·성공·에러 포함
* 상세 절차·체이닝·SSE: `agent/backend/guidelines/chatbot_guidelines.md`

**LLM 활용 포인트**

* 이전 대화 맥락 복원
* 실패 케이스·응답 품질 분석

**필드 설명** (Mongoose `ChatbotLog`)

| 필드    | 타입               | 의미                                      |
| ------- | ------------------ | ----------------------------------------- |
| userId  | Number             | 사용자 ID (required, index)               |
| role    | String             | `'user'` \| `'assistant'` \| `'system'` (required, index) |
| message | String             | 메시지 본문 (required, max 10000)         |
| context | ConversationContext| 대화 컨텍스트 (optional)                  |
| llm     | LLMMetadata        | LLM 호출 메타 (optional)                  |
| latency | Number             | 응답 지연 ms, 0~60000 (optional)          |
| success | Boolean            | 성공 여부 (required, default true)        |
| error   | String             | 에러 메시지 (optional, max 1000)          |
| createdAt | Date             | 생성 시각 (timestamps)                    |
| updatedAt | Date             | 수정 시각 (timestamps)                    |

**ConversationContext**

| 필드                 | 타입           | 의미                 |
| -------------------- | -------------- | -------------------- |
| conversationId       | String         | 대화 ID              |
| previousMessageIds   | [String]       | 이전 메시지 ID 목록  |
| userPreferences      | Mixed          | 사용자 선호          |
| mentionedIngredientIds | [Number]    | 언급된 재료 ID       |
| suggestedRecipes     | [SuggestedRecipeSummary] | 추천 레시피 요약 (검색 결과 부분 집합) |

**SuggestedRecipeSummary** (`context.suggestedRecipes[]` 항목)

| 필드         | 타입    | 의미                    |
| ------------ | ------- | ----------------------- |
| id           | Number  | 레시피 ID               |
| title        | String  | 제목                    |
| categoryId   | Number  | 레시피 카테고리 ID      |
| categoryName | String  | 카테고리 표시명         |
| imageUrl     | String \| null | 대표 이미지 URL (없으면 null) |
| cookTime     | Number \| null | 조리 시간(분). 없으면 null |
| difficulty   | Number \| null | 난이도(1-5). 없으면 null |

**LLMMetadata**

| 필드             | 타입    | 의미          |
| ---------------- | ------- | ------------- |
| model            | String  | 모델명 (required) |
| promptTokens     | Number  | (required)    |
| completionTokens | Number  | (required)    |
| totalTokens      | Number  | (required)    |
| maxTokens        | Number  | (optional)    |

**인덱스**: `(userId, createdAt DESC)`, `(userId, context.conversationId, createdAt ASC, _id ASC)` — 동일 `createdAt`(예: 한 번의 `insertMany`) 시 삽입 순서 타이브레이크, `(success, createdAt DESC)`, `(llm.model, createdAt DESC)`, TTL `(createdAt, 30일)`

**문서 구조 예시**

```json
{
  "_id": "...",
  "userId": 1,
  "role": "assistant",
  "message": "이 재료로 만들 수 있는 요리를 추천해드릴게요",
  "context": {
    "conversationId": "conv_xyz",
    "mentionedIngredientIds": [1, 5]
  },
  "llm": {
    "model": "gpt-4-turbo",
    "promptTokens": 100,
    "completionTokens": 50,
    "totalTokens": 150
  },
  "latency": 820,
  "success": true,
  "createdAt": "2025-01-25T00:00:00.000Z",
  "updatedAt": "2025-01-25T00:00:00.000Z"
}
```

---

### 3.2.1 ChatbotConversation (대화 메타)

**컬렉션**: `chatbot_conversations`  
**TTL**: 없음 (대화 목록·메타는 메시지 로그 TTL과 별도로 유지)  
**의미**

* `conversationId` 단위 **대화 메타데이터**(제목·활동 시각 등). 메시지 본문은 `chatbot_logs`에만 둔다.
* 신규 대화 첫 턴(`chatbot.start`) 성공 후 LLM으로 `title`을 채운다.
* 이어쓰기(`chatbot.message`)마다 `updatedAt`을 갱신한다. **REST 대화 목록의 정렬·커서·표시 시각은 이 `updatedAt`를 사용**한다(로그의 마지막 메시지 시각과 별개).

**필드 설명** (Mongoose `ChatbotConversation`)

| 필드           | 타입   | 의미 |
| -------------- | ------ | ---- |
| userId         | Number | 사용자 ID (required, index) |
| conversationId | String | 대화 ID (required, index) |
| title          | String | 표시용 제목 (optional, max 120). MESSAGE만 오고 제목 없을 수 있음 |
| titleSource    | String | `'llm'` \| `'manual'` (optional, default `llm`) |
| lastResponseId | String | OpenAI Responses API 체이닝용 마지막 `response.id` (optional). 턴 종료 시 갱신 |
| createdAt      | Date   | 생성 시각 (timestamps) |
| updatedAt      | Date   | 마지막 활동 갱신 시각 (timestamps). 목록 정렬 기준 |

**인덱스**: `(userId, conversationId)` unique, `(userId, updatedAt DESC)`

---

### 3.3 EventLog

**컬렉션**: `event_logs`  
**TTL**: 90일 (`expireAfterSeconds: 7776000`)  
**타임스탬프**: `createdAt` → `occurredAt`, `updatedAt` → `processedAt`  
**의미**

* 도메인 이벤트 스트림 (CQRS / 감사 로그)
* 주체(actor), 대상(entity), payload, metadata 포함

**LLM 활용 포인트**

* 사용자 행동·플로우 분석
* 이벤트 기반 요약·시나리오 재현

**type (enum)**

* `recipe.view`, `recipe.share`
* `search.query`, `search.click`
* `user.signup`, `user.login`, `nickname.update`
* `ingredient.add`, `ingredient.remove`, `ingredient.update`
* `ingredient.favorites_add`, `ingredient.favorites_remove`, `ingredient.favorites_update`
* `recipe.favorites_add`, `recipe.favorites_remove`
* `chatbot.start`, `chatbot.message`

**필드 설명** (Mongoose `EventLog`)

| 필드       | 타입          | 의미                                    |
| ---------- | ------------- | --------------------------------------- |
| type       | String        | 이벤트 타입 (enum, required, index)     |
| actor      | EventActor    | 이벤트 주체 (required)                  |
| entity     | EventEntity   | 이벤트 대상 (optional)                  |
| payload    | Mixed         | 이벤트별 추가 데이터 (optional)         |
| metadata   | EventMetadata | 플랫폼·버전·출처 등 (optional)          |
| occurredAt | Date          | 발생 시각 (timestamps createdAt)        |
| processedAt| Date          | 처리 시각 (timestamps updatedAt)        |

**EventActor**

| 필드      | 타입   | 의미                          |
| --------- | ------ | ----------------------------- |
| type      | String | `'user'` \| `'system'` \| `'admin'` (required) |
| userId    | Number | 사용자 ID (user일 때)         |
| ipAddress | String | IP 주소                       |
| userAgent | String | User-Agent                    |

**EventEntity**

| 필드 | 타입   | 의미 (예: `recipe`, `ingredient`, `user`) |
| ---- | ------ | ----------------------------------------- |
| type | String | 엔티티 타입 (required)                    |
| id   | Number | 엔티티 ID (required)                      |
| name | String | 표시명 (optional)                         |

**EventMetadata**

| 필드    | 타입   | 의미          |
| ------- | ------ | ------------- |
| platform| String | web, ios, android |
| version | String | 앱 버전       |
| source  | String | search, recommendation, direct |
| referrer| String | 리퍼러        |
| extra   | Mixed  | 기타          |

**인덱스**: `(actor.userId, occurredAt DESC)`, `(type, occurredAt DESC)`, `(entity.type, entity.id, occurredAt DESC)`, `(occurredAt DESC)`, `(metadata.platform, type)`, TTL `(occurredAt, 90일)`

**문서 구조 예시**

```json
{
  "_id": "...",
  "type": "recipe.view",
  "actor": {
    "type": "user",
    "userId": 1,
    "ipAddress": "127.0.0.1",
    "userAgent": "Mozilla/5.0..."
  },
  "entity": {
    "type": "recipe",
    "id": 10,
    "name": "김치찌개"
  },
  "payload": { "source": "recommendation" },
  "metadata": {
    "platform": "web",
    "version": "1.0.0",
    "source": "recommendation"
  },
  "occurredAt": "2025-01-25T00:00:00.000Z",
  "processedAt": "2025-01-25T00:00:01.000Z"
}
```

---

### 3.4 RecipeIngestionJob

**컬렉션**: `recipe_ingestion_jobs`  
**TTL**: 없음  
**의미**

* 식품의약품안전처 공공데이터 API에서 수집한 레시피를 OpenAI Batch API로 변환·PostgreSQL 영속화·pgvector 임베딩까지 처리하는 **파이프라인 job SSOT**
* `sourceId`(API `RCP_SEQ`) 기준 upsert 멱등 키. 성공 시 PostgreSQL `Recipe`(`source: foodsafety`, `sourceRecipeId`)·`RecipeEmbedding`으로 반영
* 상세 절차·상태 전이: `agent/backend/guidelines/recipe_ingestion_guidelines.md`

**LLM 활용 포인트**

* `rawData`: 공공 API 원본 row — 재처리(replay)·deterministic 매핑 후보
* `retrievedData`: parse Batch LLM 구조화 결과 — persist 검증 입력
* `status`·단계별 타임스탬프: 파이프라인 진행·백로그·실패 검수

**필드 설명** (Mongoose `RecipeIngestionJob`)

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| sourceId | Number | 공공데이터 API `RCP_SEQ` (required, unique, index) — upsert 멱등 키 |
| status | String | 파이프라인 단계 (required, index). §3.4.1 enum |
| retryCount | Number | 단계 실패 재시도 횟수 (required, default 0) |
| rawData | Mixed | 공공 API row 원본 JSON (optional) |
| parseBatchId | String | OpenAI Parse Batch Job ID — parse-submit 이후 (optional, index) |
| embedBatchId | String | OpenAI Embedding Batch Job ID — embed-submit 이후 (optional, index) |
| runId | String | fetch 시작 시 생성되는 파이프라인 실행 단위 UUID (optional, index) |
| retrievedData | Mixed | parse Batch LLM 변환 결과 JSON (optional). §3.4.2 |
| errorMessage | String | 마지막 단계 실패 메시지 (optional) |
| newIngredientIds | [Number] | persist에서 신규 생성된 재료 ID 목록 (optional) |
| fetchedAt | Date | fetch upsert 시각 (optional) |
| parseSubmittedAt | Date | parse Batch 제출 완료 시각 (optional) |
| parseRetrievedAt | Date | parse Batch 결과 반영 시각 (optional) |
| persistedAt | Date | PostgreSQL 영속화 완료 시각 (optional) |
| embedSubmittedAt | Date | embed Batch 제출 완료 시각 (optional) |
| embedRetrievedAt | Date | RecipeEmbedding upsert 완료 시각 (optional) |
| failedAt | Date | `failed` 전환 시각 (optional) |

**§3.4.1 `status` (enum)**

계약 SSOT: `@mealio/shared` `RECIPE_INGESTION_JOB_STATUSES`.

| 값 | 단계 | 설명 |
| --- | --- | --- |
| `fetched` | fetch | 공공 API row upsert 완료, parse-submit 대기 |
| `parse_submitting` | parse-submit | Parse Batch 제출 락 (in-flight) |
| `parse_submitted` | parse-submit | Parse Batch 제출 완료, parse-retrieve 대기 |
| `parse_retrieving` | parse-retrieve | Parse Batch output 처리 락 (in-flight) |
| `parse_retrieved` | parse-retrieve | `retrievedData` 반영 완료, persist 대기 |
| `persisting` | persist | PostgreSQL 영속화 락 (in-flight) |
| `persisted` | persist | Recipe 도메인 upsert 완료, embed-submit 대기 |
| `embed_submitting` | embed-submit | Embedding Batch 제출 락 (in-flight) |
| `embed_submitted` | embed-submit | Embedding Batch 제출 완료, embed-retrieve 대기 |
| `embed_retrieving` | embed-retrieve | Embedding Batch output 처리 락 (in-flight) |
| `embed_retrieved` | embed-retrieve | RecipeEmbedding upsert 완료 (파이프라인 종료) |
| `failed` | — | 재시도 상한 초과 등으로 중단, 수동 검수·재큐잉 대상 |

**§3.4.2 `retrievedData` JSON** (parse Batch LLM 출력, camelCase)

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| recipe | RetrievedRecipe | 레시피 메타·조리 단계 |
| ingredients | [RetrievedIngredient] | 재료 목록 (1건 이상) |
| parseConfidence | String | `'high'` \| `'medium'` \| `'low'` — persist 최소 신뢰도 검증 |
| parseIssues | [String] | 파싱 이슈 메모 (optional) |

**RetrievedRecipe** (`retrievedData.recipe`)

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| title | String | 레시피 제목 (required) |
| description | String \| null | 요약 설명 (optional) |
| servings | Number \| null | 인분 (optional) |
| difficulty | Number \| null | 난이도 1-3 추론값 → persist 시 clamp (optional) |
| cookingTimeMinutes | Number \| null | 조리 시간(분) → `Recipe.cookTime` (optional) |
| categoryId | Number \| null | `RecipeCategory.id` (optional) |
| proposedCategory | { key, name } \| null | 카테고리 매핑 제안 (optional) |
| steps | [String] \| [{ content, imageUrl? }] | 조리 단계 (required, 비어 있지 않음) |
| tips | String \| null | 조리 팁 → `Recipe.cookingTip` (optional) |
| imageUrl | String \| null | 대표 이미지 URL (optional) |
| nutrition | Nutrition \| null | 1인분 영양 — `Recipe.nutrition`과 동일 키 (optional) |
| cookingMethod | String \| null | 조리 방법 (optional) |
| dishType | String \| null | 요리 종류 (optional) |

**RetrievedIngredient** (`retrievedData.ingredients[]`)

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| rawName | String | 원문 재료명 (required) |
| normalizedName | String | 정규화 재료명 (required) |
| ingredientAlias | String | Ingredient 매칭용 canonical명 (required) |
| quantity | String \| null | 수량 (optional) |
| unit | String \| null | 단위 (optional) |
| categoryId | Number \| null | `IngredientCategory.id` (optional) |
| proposedCategory | { key, name } \| null | 재료 카테고리 매핑 제안 (optional) |

**인덱스**: `(sourceId)` unique, `(status)`, `(parseBatchId)`, `(embedBatchId)`, `(runId)`, `(status, retryCount)`, `(parseBatchId, status)`, `(embedBatchId, status)`, `(runId, status)`

**문서 구조 예시**

```json
{
  "_id": "...",
  "sourceId": 12345,
  "status": "parse_retrieved",
  "retryCount": 0,
  "runId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "rawData": { "RCP_SEQ": "12345", "RCP_NM": "김치찌개", "MANUAL01": "..." },
  "parseBatchId": "batch_abc123",
  "retrievedData": {
    "recipe": {
      "title": "김치찌개",
      "steps": [{ "content": "김치를 볶는다." }],
      "difficulty": 2,
      "cookingTimeMinutes": 30
    },
    "ingredients": [
      {
        "rawName": "김치 200g",
        "normalizedName": "김치",
        "ingredientAlias": "김치",
        "quantity": "200",
        "unit": "g"
      }
    ],
    "parseConfidence": "high"
  },
  "fetchedAt": "2025-01-25T00:00:00.000Z",
  "parseSubmittedAt": "2025-01-25T01:00:00.000Z",
  "parseRetrievedAt": "2025-01-25T02:00:00.000Z"
}
```

---

### 3.5 RecipeIngestionState

**컬렉션**: `recipe_ingestion_state`  
**TTL**: 없음  
**의미**

* 공공데이터 API **순번 페이징**(`startIdx`/`endIdx`) 커서를 보관하는 singleton 문서
* fetch job이 `lastEndIdx`를 읽어 다음 수집 구간을 계산하고, 성공 시 갱신
* job 멱등 키(`sourceId` = `RCP_SEQ`)와 역할이 분리됨 — API 순번은 커서, 레시피 중복 방지는 job upsert

**필드 설명** (Mongoose `RecipeIngestionState`)

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| key | String | singleton 문서 키 (required, unique, default `'singleton'`) |
| lastEndIdx | Number | 마지막으로 요청한 `endIdx` (required, default 0). 없으면 fetch 시 0으로 간주 |
| updatedAt | Date | 마지막 갱신 시각 (timestamps) |

**인덱스**: `(key)` unique

**문서 구조 예시**

```json
{
  "_id": "...",
  "key": "singleton",
  "lastEndIdx": 500,
  "updatedAt": "2025-01-25T00:00:00.000Z"
}
```

---

## 4. LLM 관점 통합 이해 요약

### 사용자 상태 이해

* **User (RDB)**: 정체성
* **Inventory (NoSQL)**: 현재 요리 가능성 + 선호(관심 재료/레시피) 상태

### 추천 및 추론

* Recipe + RecipeIngredient + Ingredient + UserRecipeRecommendation → 개인화 결과 제공
* Inventory → 필터링/개인화 조건
* RecipeEmbedding → semantic 검색·챗봇 `search_recipes` ANN 기반

### 레시피 수집 파이프라인

* RecipeIngestionState → 공공 API 다음 수집 구간
* RecipeIngestionJob → fetch→parse→persist→embed 단계별 상태·원본·LLM 변환 결과
* persist 완료 시 Recipe(`source: foodsafety`)·RecipeIngredient·Ingredient; embed 완료 시 RecipeEmbedding

### 대화 및 행동 분석

* ChatbotLog → 대화 맥락 기억
* EventLog → 사용자 행동 타임라인

---

## 5. 핵심 설계 의도 요약

* **정형 데이터**: 무결성, 조인, 검색 최적화 + 추천 결과 SSOT
* **비정형 데이터**: 유연성, 로그, LLM 친화적 컨텍스트
* **수집 파이프라인**: Mongo job SSOT + PostgreSQL 도메인 SSOT 분리, `sourceId`·`(source, sourceRecipeId)` 멱등
* **LLM 중심 설계**: 상태 + 맥락 + 이벤트를 모두 설명 가능
