# 기획

## Subject

AI 기반 맞춤형 레시피 추천 서비스

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

- Frontend: Next.js, React Native
 	- Next.js로 페이지를 구성하고 React Native에서 웹뷰 구성
- Backend: Nest.js, Mongoose, Prisma (공용: @cook/shared 패키지에 Prisma/Mongoose 스키마·Redis·설정·타입)
- Database: PostgreSQL, MongoDB
 	- 데이터 **정의와 상태**, 구조, 쿼리 패턴에 따라 구분한다.
 	- SQL: 유저, 재료, 레시피, 레시피-재료 등
 	- NoSQL: 유저 보유 재료, 유저 관심 재료, 챗봇 로그, 이벤트 로그 등
- Cache: Redis
- Message Broker: Kafka
- Metric: Sentry, Google Analysis
- Documentation: Storybook, OpenAPI
- LLM: OpenAI

## Deployment

- Frontend: Vercel
- Backend: AWS EC2
 	- 초기에는 비용 절감을 위해 단일 인스턴스에서 Producer/Consumer 런타임 분리하여 운영
- Database: AWS RDS, MongoDB Atlas
- Cache: AWS ElastiCache
- Message Broker: AWS MSK
- Storage: AWS S3
- Domain: AWS Route53
- CDN: CloudFlare

## Tool

- Git, GitHub Actions
 	- 모노레포 구조 (pnpm 워크스페이스: client, server/shared, server/producer, server/consumer)
 	- 공용 코드는 `server/shared` 패키지(`@cook/shared`)로 분리, Producer/Consumer에서 import
- 패키지 매니저: pnpm (모노레포 의존성 해석 이슈 방지)
- Docker or k8s
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
