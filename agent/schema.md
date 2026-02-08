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
* **Recipe**: 요리 레시피
* **Ingredient**: 재료 마스터 데이터
* **RecipeIngredient**: 레시피와 재료 간의 다대다 관계

### 행동/상태/로그 도메인 (NoSQL / Mongoose)

* **UserIngredient**: 사용자가 보유·선호하는 재료 ID 목록 (`user_ingredients` 컬렉션)
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

### 2.2 Recipe

**의미**

* 요리 레시피의 메타 정보와 조리 절차를 포함

**특징**

* `instructions`: JSON 구조 → 단계별 조리 설명

**필드 설명** (Prisma `Recipe` ↔ DB 컬럼)

| 필드 (Prisma)   | DB 컬럼      | 타입            | 의미                             |
| --------------- | ------------ | --------------- | -------------------------------- |
| id              | id           | INT / SERIAL    | 레시피 ID (PK)                   |
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

**인덱스**: `(difficulty, cook_time, created_at)`, `(created_at DESC)`

---

### 2.3 Ingredient

**의미**

* 재료 마스터 데이터

**필드 설명** (Prisma `Ingredient` ↔ DB 컬럼)

| 필드 (Prisma) | DB 컬럼    | 타입         | 의미                             |
| ------------- | ---------- | ------------ | -------------------------------- |
| id            | id         | INT / SERIAL | 재료 ID (PK)                     |
| name          | name       | VARCHAR(100) | 재료명                           |
| category      | category   | INT          | 재료 카테고리 (채소/육류/양념 등) |
| createdAt     | created_at | TIMESTAMP    | 생성 시각                        |

**인덱스**: `(category, name)`

---

### 2.4 RecipeIngredient

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

### 3.1 UserIngredient

**컬렉션**: `user_ingredients`  
**의미**

* 사용자별 보유 재료 ID·즐겨찾기 재료 ID 목록
* `Ingredient` 마스터와 JOIN하여 상세 정보 조회

**LLM 활용 포인트**

* 사용자 보유·관심 재료 기반 레시피 추천
* 부족 재료 안내

**필드 설명** (Mongoose `UserIngredient`)

| 필드                  | 타입     | 의미                             |
| --------------------- | -------- | -------------------------------- |
| userId                | Number   | 사용자 ID (required, unique, index) |
| ingredientsIds        | [Number] | 보유 재료 ID 배열 (기본 [])      |
| favoriteIngredientIds | [Number] | 즐겨찾기 재료 ID 배열 (기본 [])  |
| lastSyncedAt          | Date     | 마지막 동기화 시각 (optional)    |
| createdAt             | Date     | 생성 시각 (timestamps)           |
| updatedAt             | Date     | 수정 시각 (timestamps)           |

**인덱스**: `ingredientsIds`, `favoriteIngredientIds`

**문서 구조 예시**

```json
{
  "_id": "...",
  "userId": 1,
  "ingredientsIds": [1, 5, 12],
  "favoriteIngredientIds": [3, 5],
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
* `user.signup`, `user.login`
* `user.nickname.update`
* `ingredient.add`, `ingredient.remove`
* `user.ingredient.bulk_update`, `user.ingredient.favorites_update`, `user.ingredient.favorites_add`, `user.ingredient.favorites_remove`
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
* **UserIngredient (NoSQL)**: 현재 요리 가능성 상태

### 추천 및 추론

* Recipe + RecipeIngredient + Ingredient → 조합 추론
* UserIngredient → 필터링 조건

### 대화 및 행동 분석

* ChatbotLog → 대화 맥락 기억
* EventLog → 사용자 행동 타임라인

---

## 5. 핵심 설계 의도 요약

* **정형 데이터**: 무결성, 조인, 검색 최적화
* **비정형 데이터**: 유연성, 로그, LLM 친화적 컨텍스트
* **LLM 중심 설계**: 상태 + 맥락 + 이벤트를 모두 설명 가능

---

## 6. RAG 관점 데이터 활용 설계

본 섹션은 LLM 기반 챗봇이 **유저, 재료, 레시피, 유저 보유 재료, 유저 관심 재료, 챗봇 로그, 이벤트 로그**를 RAG 형태로 어떻게 조회·조합하는지에 대한 **설계 가이드를 LLM이 이해할 수 있도록** 정리한다.

### 6.1 대표 RAG 시나리오: “내가 가진 재료로 만들 수 있는 요리 추천”

1. **유저 컨텍스트 조회**
   - RDB `User`:
     - `id`, `email`, `nickname`, `createdAt` 등 기본 프로필
   - NoSQL `UserIngredient`:
     - `ingredientsIds` = 사용자가 현재 보유한 재료 ID 목록
     - `favoriteIngredientIds` = 사용자가 선호하는 재료 ID 목록
2. **레시피 후보군 조회 (RDB)**
   - `RecipeIngredient` 를 이용해 **보유 재료와 많이 겹치는 레시피**를 우선 조회:
     - `RecipeIngredient.ingredientId IN UserIngredient.ingredientsIds`
     - 겹치는 재료 수, 부족 재료 수 등을 계산할 수 있는 쿼리/로직 설계
   - `Recipe` 에서 다음 정보를 함께 가져온다.
     - `title`, `description`, `difficulty`, `cookTime`, `imageUrl`, `servings`
3. **재료 메타 정보 조회 (RDB)**
   - `Ingredient`:
     - `name`, `category` 를 통해 LLM이 **“채소/육류/양념” 등 자연어 설명**을 만들 수 있도록 지원
4. **대화/행동 이력 조회 (NoSQL)**
   - `ChatbotLog`:
     - `userId`, `conversationId`(context.conversationId) 기준으로 최근 N개 메시지를 조회
     - 이전에 언급된 재료/레시피, 사용자가 이미 거절한 제안 등을 파악
   - `EventLog`:
     - 최근 `recipe.view`, `search.query`, `search.click` 등을 조회
     - 사용자가 실제로 관심을 보인 레시피/검색어를 LLM에게 전달
5. **LLM 입력용 RAG 컨텍스트 예시 구조 (개념)**
   - LLM에 전달할 때는 아래와 같은 JSON 구조로 요약/축약해서 전달하는 것을 권장:
   - (실제 필드명/구조는 `spec/backend_architecture_spec.md` 의 RAG 컨텍스트 레이어 구현을 따른다.)

```json
{
  "userProfile": {
    "id": 1,
    "nickname": "홍길동",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "inventory": {
    "haveIngredientIds": [1, 5, 12],
    "favoriteIngredientIds": [3, 5]
  },
  "candidateRecipes": [
    {
      "id": 10,
      "title": "김치찌개",
      "mainIngredients": ["김치", "돼지고기", "두부"],
      "difficulty": 2,
      "cookTime": 30,
      "missingIngredientNames": ["파"]
    }
  ],
  "recentDialogSummary": "...자연어 요약...",
  "recentEvents": [
    { "type": "recipe.view", "recipeId": 10, "occurredAt": "..." }
  ]
}
```

### 6.2 도메인 확장을 고려한 RAG 설계 원칙

1. **도메인별로 독립된 “컨텍스트 소스” 개념 유지**
   - 현재 도메인:
     - `User` + `UserIngredient` → 사용자 상태
     - `Recipe` + `RecipeIngredient` + `Ingredient` → 레시피/재료 지식
     - `ChatbotLog` + `EventLog` → 대화/행동 이력
   - 향후 도메인(예: 건강 정보, 쇼핑, 식단 플랜 등)을 추가할 때도,  
     “특정 도메인 데이터베이스를 조회하여 **LLM이 이해하기 쉬운 JSON 조각**으로 변환하는 컨텍스트 소스”를 하나씩 추가하는 패턴을 그대로 유지한다.
   - 어떤 컨텍스트 소스를 사용할지 결정하는 **의도 분류/도메인 태깅은 LLM 프롬프트 기반으로 수행**되며,  
     사용자의 자연어 입력을 LLM에 전달해 `"domain"`, `"task"` 등의 필드를 가진 JSON을 응답받는 형태로 구현된다.
2. **스키마 문서에서 LLM 관점 필드 의미를 명시적으로 유지**
   - 새 엔티티/필드를 추가할 때,
     - “이 필드는 LLM이 어떤 추론/추천을 할 때 어떻게 사용될 수 있는지”를 본 문서에 함께 기술한다.
   - 예: “식단 플랜” 도메인이 추가되면,  
     `MealPlan` 엔티티의 각 필들에게 “칼로리/영양소/식단 유형” 등 LLM이 활용할 의미를 설명.
3. **RAG 쿼리는 “원시 데이터” 보다 “요약/집계 결과” 위주로 제공**
   - LLM에게 너무 많은 원시 행(row)을 그대로 던지지 않고,
     - 재료/레시피는 **핵심 요약 정보(이름, 카테고리, 주요 재료, 난이도, 시간)** 위주로 제공
     - 로그/이벤트는 **최근 행동 흐름을 압축한 타임라인** 형태로 제공
   - 이는 토큰 비용을 줄이고, LLM이 더 안정적으로 추론하도록 돕는다.
4. **RDB/NoSQL 선택은 LLM/RAG 관점에서도 일관되게 유지**
   - RDB:
     - 자주 조합/검색되는 마스터 데이터(유저, 레시피, 재료, 관계)
     - RAG에서 “정확한 기준 정보/카탈로그” 역할
   - NoSQL:
     - 변동이 잦은 상태/로그(보유 재료, 대화, 이벤트)
     - RAG에서 “최근 상태/맥락/행동 이력” 역할

### 6.3 LLM이 이 스키마를 사용할 때의 요약 지침

- **User / UserIngredient**  
  → “누가 어떤 재료를 갖고 있고, 무엇을 선호하는지”를 이해하는 데 사용.
- **Recipe / RecipeIngredient / Ingredient**  
  → “어떤 요리를 어떤 재료로, 어느 정도 난이도/시간으로 만들 수 있는지”를 이해하는 데 사용.
- **ChatbotLog**  
  → “이 사용자와 이전에 어떤 대화를 나눴는지, 어떤 맥락이 이어지고 있는지”를 복원하는 데 사용.
- **EventLog**  
  → “사용자가 실제로 무엇을 클릭/조회/검색했는지”를 행동 타임라인으로 이해하는 데 사용.

이 원칙에 따라, 챗봇은 데이터베이스를 단순 조회가 아니라 **의미 있는 컨텍스트 조각들의 집합(RAG 컨텍스트)** 으로 활용할 수 있다.
