# 기획

## Subject

**Mealio** — 보유·관심 재료와 행동 이력을 반영한 **AI 맞춤형 레시피 추천** 웹 서비스

- 진입: 루트에서 레시피 탭으로 바로 연결 (별도 마케팅 랜딩 없음)
- 앱 셸: 하단 4탭 — **레시피** · **챗봇** · **보관함** · **마이페이지**
- 모노레포: 프론트엔드 · API(Producer) · Worker(Consumer) · Shared · Docs

## Features

### 인증

- Google · Kakao · Naver **OAuth**(백엔드 주도) → JWT Access/Refresh 쿠키
- 세션 갱신, 로그아웃, 프론트 BFF를 통한 토큰 브리지
- OAuth 최초 로그인 시 회원가입 처리 — 별도 회원가입·이메일 로그인 없음

### 레시피

- 목록(최신·조회수·좋아요 정렬), 카테고리·필터, 키워드 검색, 상세
- 로그인 사용자 **맞춤 추천**
- 조회·검색 행동 기록 → 메시지 브로커로 비동기 집계
- 공개 페이지 ISR/온디맨드 ISR, 검색은 SSR, 태그 기반 재검증 지원

### 보관함 · 재료

- 보유 재료 · 관심 재료 · 관심 레시피 CRUD
- 재료 카테고리·검색, 보유/관심 필터 UI
- 프론트 Optimistic UI + 비동기 이벤트로 정합

### 챗봇

- 대화 목록·상세, **SSE 스트리밍** 응답
- LLM Function Calling으로 도메인 데이터 조회(아래 LLM 절)
- 토큰 기반 **크레딧 차감**(신규 기본 잔액·월간 한도 1000, 멱등 차감)
- Pub/Sub으로 Worker → API SSE 중계

### 마이페이지

- 프로필(닉네임), 활동 내역, 챗봇 크레딧 표시, 로그아웃

### 관측 · 분석

- GA4(레시피 조회·저장, 챗봇 메시지 등), Vercel Analytics, Web Vitals
- Sentry(프론트·백), Prometheus 메트릭, Grafana 대시보드·KPI 롤업

## LLM & Chatbot

- 대화 컨텍스트 + Function Calling으로 **서비스 도메인 데이터**를 조회·활용하는 레시피 추천·요리 가이드 챗봇
- 도구 예: 사용자 인벤토리 조회, 재료 카테고리, 레시피 검색(키워드·재료·카테고리·시간·인분 등), 추천 확정·로그 저장
- 요청은 메시지 브로커로 비동기 처리(재시도·DLQ). 임베딩(벡터 검색)은 챗봇 검색·인제스천 경로에서 활용
- Function Calling **도구 확장**으로 레시피 외 도메인 연결이 가능한 구조(현재 도구는 레시피·재료·인벤토리 중심)

## Screens

| 영역 | 화면 | 렌더링 |
| --- | --- | --- |
| 진입 | 루트 → 레시피 | SSR redirect |
| 인증 | 로그인, OAuth 콜백·에러 | CSR |
| 레시피 | 목록, 필터, 검색, 상세 | ISR / SSR / 온디맨드 ISR |
| 챗봇 | 대화 목록, 대화 상세 | CSR (인증 필요) |
| 재료 | 재료 필터 | ISR |
| 보관함 | 보유 재료, 관심 재료, 관심 레시피 | CSR (인증 필요) |
| 마이페이지 | 홈, 프로필, 활동 내역 | CSR |
| 법적 고지·안내 | 이용약관, 개인정보 처리방침, 도움말 | CSR |

인증 가드: 챗봇 · 보관함 · 마이페이지(루트 제외) — 세션 없으면 로그인으로 유도

## Stack

| 영역 | 기술 |
| --- | --- |
| Frontend | Next.js (App Router), React, TypeScript, TanStack Query, Tailwind CSS |
| Backend API | NestJS (Producer) — REST API, Swagger(local) |
| Worker | NestJS (Consumer) — 메시지 컨슈머 + CLI 배치 |
| Shared | Prisma, Mongoose, Redis, Kafka 상수·타입 |
| RDB | PostgreSQL + Prisma (+ pgvector) |
| NoSQL | MongoDB + Mongoose |
| Cache / Stream | Redis (Cache-Aside, rate limit, 챗봇 Pub/Sub) |
| Message Broker | Kafka |
| LLM | OpenAI (챗봇 Function Calling · 레시피 parse/embed) |
| Observability | Sentry, Prometheus, Grafana, GA4, Vercel Analytics |
| Docs / Contract | OpenAPI, Storybook, Docusaurus |

## Deployment

| 계층 | 구성 |
| --- | --- |
| Frontend | Next.js standalone — CI 빌드, Docker 또는 Vercel 배포 가능 |
| Backend | AWS EC2 — CI/CD → 컨테이너 배포(producer / consumer) |
| Data / Broker | PostgreSQL, MongoDB, Redis, Kafka — 로컬은 Docker Compose, 운영은 환경별 호스팅 |
| Observability | Prometheus · Pushgateway · Grafana |
| Package | pnpm workspaces, Node ≥ 20 |

로컬 Compose 포함 예: Postgres, MongoDB, Redis, Kafka, Kafka UI, Prometheus, Grafana, Pushgateway

## Tool

- Git, GitHub Actions (lint / build / test, server CD)
- pnpm
- Docker · Docker Compose
- Apidog (OpenAPI 연동)

## Data

### 레시피 원천 · ETL

- **원천**: 식품의약품안전처 조리식품 Open API
- **파이프라인**(Consumer CLI · 메시지 브로커 단계): fetch → LLM parse → persist → embed
- **저장**: 관계형 DB(레시피·재료·임베딩 등) + 문서 DB(인제스천 job·state)
- 이미지는 원천·외부 URL 참조(앱 내 객체 스토리지 업로드 없음)

### 폴리글롯 저장

| 저장소 | 역할 |
| --- | --- |
| PostgreSQL | 사용자·인증, 레시피·재료·추천·임베딩, 챗봇 크레딧 차감 |
| MongoDB | 인벤토리, 챗봇 대화·로그, 이벤트 로그, KPI 롤업, 인제스천 job |
| Redis | 도메인 캐시, API rate limit, 조회/검색 dedupe, 챗봇 SSE 채널 |

## Message Broker

Producer/Consumer 분리. API는 쓰기 성공 시 이벤트를 발행하고, Worker가 비동기 반영·집계·무효화를 수행한다.

| 이벤트 영역 | 용도 |
| --- | --- |
| 사용자 | 가입·로그인·닉네임, 인벤토리 변경, 추천 점수 갱신 |
| 활동 | 레시피 조회·검색 쿼리/클릭 등 |
| 챗봇 | 메시지 처리(LLM·도구·로그) |
| 캐시 | Redis 캐시 무효화 |
| 레시피 수집 | 수집 파이프라인 단계 트리거 |

부가 흐름:

- 맞춤 추천: 인벤토리·활동 이벤트 → Worker 추천 갱신
- 보관함 등 Optimistic UI 후 Worker·캐시 무효화로 정합
- KPI: 이벤트 로그 → 롤업 잡 → KPI 집계
