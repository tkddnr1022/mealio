# 통합 데이터 스키마 설명 (Relational + NoSQL)

본 문서는 **레시피 추천/요리 보조 서비스**의 데이터 스키마를 LLM이 이해하고 활용할 수 있도록 **의미 중심(Semantic)** 으로 설명한 통합 스키마 문서이다.

시스템은 다음 두 가지 데이터 저장 방식을 혼합하여 사용한다.

* **RDB (정형 데이터)**: 사용자, 레시피, 재료, 레시피-재료 관계
* **NoSQL (비정형/이벤트 데이터)**: 유저 재료 상태, 챗봇 대화 로그, 이벤트 로그

---

## 1. 전체 도메인 개요

### 핵심 도메인 엔티티

* **User**: 서비스를 이용하는 사용자
* **Recipe**: 요리 레시피
* **Ingredient**: 재료 마스터 데이터
* **RecipeIngredient**: 레시피와 재료 간의 다대다 관계

### 행동/상태/로그 도메인 (NoSQL)

* **UserIngredient**: 사용자가 현재 보유하거나 선호하는 재료 상태
* **ChatbotLog**: LLM 기반 챗봇과의 대화 기록
* **EventLog**: 시스템 전반의 이벤트 스트림 (CQRS / Event Sourcing 친화)

---

## 2. RDB 스키마 (정형 데이터)

### 2.1 User

**의미**

* 서비스 사용자 계정 정보
* 소셜 로그인 기반 사용자를 고려한 구조

**필드 설명**

| 필드            | 타입           | 의미                           |
| ------------- | ------------ | ---------------------------- |
| id            | BIGINT       | 사용자 고유 ID (PK)               |
| email         | VARCHAR(100) | 사용자 이메일                      |
| nickname      | VARCHAR(20)  | 사용자 닉네임                      |
| platform_name | VARCHAR(10)  | 로그인 플랫폼 (e.g. google, apple) |
| platform_id   | VARCHAR(100) | 플랫폼 내 사용자 ID                 |
| created_at    | TIMESTAMP    | 계정 생성 시각                     |
| updated_at    | TIMESTAMP    | 계정 수정 시각                     |

---

### 2.2 Recipe

**의미**

* 요리 레시피의 메타 정보와 조리 절차를 포함

**특징**

* `instructions` 는 JSON 구조로 저장 → 단계별 조리 설명

**필드 설명**

| 필드           | 타입           | 의미                   |
| ------------ | ------------ | -------------------- |
| id           | BIGINT       | 레시피 ID (PK)          |
| title        | VARCHAR(100) | 레시피 제목               |
| description  | TEXT         | 레시피 요약 설명            |
| instructions | JSON         | 조리 단계 (순서/텍스트/타이머 등) |
| difficulty   | TINYINT      | 난이도 (1~5 등)          |
| cook_time    | INT          | 예상 조리 시간 (분)         |
| image_url    | TEXT         | 레시피 이미지 URL          |
| created_at   | TIMESTAMP    | 생성 시각                |

---

### 2.3 Ingredient

**의미**

* 재료 마스터 데이터

**필드 설명**

| 필드         | 타입           | 의미                   |
| ---------- | ------------ | -------------------- |
| id         | BIGINT       | 재료 ID (PK)           |
| name       | VARCHAR(100) | 재료명                  |
| category   | INT          | 재료 카테고리 (채소/육류/양념 등) |
| created_at | TIMESTAMP    | 생성 시각                |

---

### 2.4 RecipeIngredient

**의미**

* 레시피와 재료 간의 다대다 관계
* 특정 레시피에서 재료가 어떻게 사용되는지 정의

**필드 설명**

| 필드            | 타입          | 의미              |
| ------------- | ----------- | --------------- |
| id            | BIGINT      | 관계 ID (PK)      |
| recipe_id     | BIGINT      | 레시피 ID (FK)     |
| ingredient_id | BIGINT      | 재료 ID (FK)      |
| amount        | FLOAT       | 필요 수량           |
| unit          | VARCHAR(10) | 단위 (g, ml, 개 등) |
| is_optional   | BOOLEAN     | 선택 재료 여부        |

---

## 3. NoSQL 스키마 (비정형 데이터)

> 아래 스키마들은 **문서 기반 저장소 (MongoDB 등)** 를 전제로 하며,
> 구조는 유연하고 이벤트/상태 추적에 초점을 둔다.

---

### 3.1 UserIngredient

**의미**

* 사용자가 현재 보유한 재료 상태
* 즐겨찾는 재료 목록

**LLM 활용 포인트**

* "사용자 보유 재료 및 관심 재료 기반 레시피 추천"
* "없는 재료 알려주기"

**문서 구조 예시**

```json
{
  "_id": "ui_123",
  "userId": 1,
  "ingredients": {
    "1": { "name": "양파", "quantity": 2 },
    "5": { "name": "계란", "quantity": 6 }
  },
  "favoriteIngredients": {
    "3": { "name": "감자" },
    "5": { "name": "계란" }
  }
}
```

---

### 3.2 ChatbotLog

**의미**

* 사용자와 LLM 간의 모든 대화 기록
* 추론 맥락(Context), 모델 정보, 성능 측정 포함

**LLM 활용 포인트**

* 이전 대화 맥락 복원
* 실패 케이스 학습
* 응답 품질 평가

**문서 구조 예시**

```json
{
  "_id": "cb_456",
  "userId": 1,
  "role": "assistant",
  "message": "이 재료로 만들 수 있는 요리를 추천해드릴게요",
  "context": { "ingredients": ["양파", "계란"] },
  "llm": { "model": "gpt-4.1", "temperature": 0.7 },
  "latency": 820,
  "success": true,
  "createdAt": 1737000000
}
```

---

### 3.3 EventLog

**의미**

* 시스템에서 발생하는 모든 도메인 이벤트 기록
* CQRS / 이벤트 소싱 / 감사 로그 용도

**LLM 활용 포인트**

* 사용자 행동 분석
* 이벤트 기반 요약 생성
* 시나리오 재현

**문서 구조 예시**

```json
{
  "_id": "ev_789",
  "type": "RECIPE_VIEW",
  "actor": { "userId": 1 },
  "entity": { "recipeId": 10 },
  "payload": { "source": "recommendation" },
  "metadata": { "ip": "127.0.0.1" },
  "occurredAt": 1737000100,
  "processedAt": null
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
