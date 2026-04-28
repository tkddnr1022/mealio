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
* **IngredientCategory**: 재료 카테고리 마스터 데이터
* **Ingredient**: 재료 마스터 데이터
* **RecipeIngredient**: 레시피와 재료 간의 다대다 관계

### 행동/상태/로그 도메인 (NoSQL / Mongoose)

* **Inventory**: 사용자가 보유 재료·관심 재료·관심 레시피 ID를 관리하는 상태 문서 (`inventories` 컬렉션)
* **ChatbotLog**: LLM 챗봇 대화 기록 (`chatbot_logs` 컬렉션, 30일 TTL)
* **EventLog**: 도메인 이벤트 스트림 (`event_logs` 컬렉션, 90일 TTL)

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

**인덱스**: `(platform_name, platform_id)`, `(email)`, `(created_at)`

---

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
| viewCount       | view_count   | INT             | 조회수 (기본값 0)                |
| isPublished     | is_published | BOOLEAN         | 공개 여부 (기본값 true)          |
| createdAt       | created_at   | TIMESTAMP       | 생성 시각                        |
| updatedAt       | updated_at   | TIMESTAMP       | 수정 시각                        |

**제약**: `FK(category) -> RecipeCategory(id)` (Prisma: `categoryId` → `@map("category")`)  
**인덱스**: `(category, difficulty, cook_time, created_at)`, `(difficulty, cook_time, created_at)`, `(created_at DESC)`

---

### 2.4 IngredientCategory

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

### 2.5 Ingredient

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

### 2.6 RecipeIngredient

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

* 사용자–LLM 대화 메시지 단위 로그
* 역할(role), 메시지, 컨텍스트, LLM 메타(토큰·모델), 지연·성공·에러 포함

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
| suggestedRecipeIds   | [Number]       | 추천된 레시피 ID     |

**LLMMetadata**

| 필드             | 타입    | 의미          |
| ---------------- | ------- | ------------- |
| model            | String  | 모델명 (required) |
| promptTokens     | Number  | (required)    |
| completionTokens | Number  | (required)    |
| totalTokens      | Number  | (required)    |
| temperature      | Number  | (optional)    |
| maxTokens        | Number  | (optional)    |

**인덱스**: `(userId, createdAt DESC)`, `(userId, context.conversationId, createdAt)`, `(success, createdAt DESC)`, `(llm.model, createdAt DESC)`, TTL `(createdAt, 30일)`

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
    "totalTokens": 150,
    "temperature": 0.7
  },
  "latency": 820,
  "success": true,
  "createdAt": "2025-01-25T00:00:00.000Z",
  "updatedAt": "2025-01-25T00:00:00.000Z"
}
```

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

* `recipe.view`, `recipe.like`, `recipe.share`
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

## 4. LLM 관점 통합 이해 요약

### 사용자 상태 이해

* **User (RDB)**: 정체성
* **Inventory (NoSQL)**: 현재 요리 가능성 + 선호(관심 재료/레시피) 상태

### 추천 및 추론

* Recipe + RecipeIngredient + Ingredient → 조합 추론
* Inventory → 필터링/개인화 조건

### 대화 및 행동 분석

* ChatbotLog → 대화 맥락 기억
* EventLog → 사용자 행동 타임라인

---

## 5. 핵심 설계 의도 요약

* **정형 데이터**: 무결성, 조인, 검색 최적화
* **비정형 데이터**: 유연성, 로그, LLM 친화적 컨텍스트
* **LLM 중심 설계**: 상태 + 맥락 + 이벤트를 모두 설명 가능
