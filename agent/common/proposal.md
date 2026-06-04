# 기획

## Subject

**Mealio** — AI 기반 맞춤형 레시피 추천 서비스

## Features

- 보유 재료 관리
- 관심 재료 관리
- 관심 레시피 관리
- 맞춤 레시피 제공
- 레시피 검색
- 레시피 추천 챗봇

## LLM & Chatbot

- 유저, 레시피, 재료, 유저 보유/관심 재료 등 **서비스 도메인 데이터를 OpenAI Function Calling(도메인 함수 호출)으로 조회·활용**하는 레시피 추천 챗봇
- 대화 컨텍스트와 이벤트 로그를 기반으로 한 **개인화된 레시피 추천·요리 가이드 대화 흐름**
- 추후 레시피 외 **다른 도메인(쇼핑, 건강, 플랜 등) 데이터 소스를 추가로 연결**할 수 있도록, **Function Calling 도구(tools) 확장**으로 유연하게 도메인 데이터를 조회하는 구조로 설계

## Stack

- Frontend: Next.js
- Backend: Nest.js, Mongoose, Prisma
- Database: PostgreSQL, MongoDB
- Cache: Redis
- Message Broker: Kafka
- Metric: Sentry, Google Analysis
- Documentation: Storybook, OpenAPI
- LLM: OpenAI

## Deployment

- Frontend: Vercel
- Backend: AWS EC2
- Database: MongoDB Atlas (MongoDB), Neon (PostgreSQL)
- Cache: Upstash (Redis)
- Message Broker: AWS EC2 (Kafka)
- Storage: AWS S3
- Domain: AWS Route53
- CDN: CloudFlare

## Tool

- Git, GitHub Actions
- pnpm
- Docker Compose
- Apidog

## Data

- 레시피 데이터를 어떻게 확보할 것인가?

## Message Broker

- Producer/Consumer 구조
- 맞춤 레시피 생성
- 조회 및 검색 로그 수집
- 사용자 행동 이벤트 수집 및 처리(Event-driven)
- 업데이트 발생 시 Redis 캐시 무효화
- 보유 재료 추가 등 업데이트 시 Optimistic UI + Revalidation
- 챗봇 요청 및 응답
