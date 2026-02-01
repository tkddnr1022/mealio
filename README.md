# AI 기반 맞춤형 레시피 추천 서비스

## 개발 환경

- **Node.js**: 20+
- **패키지 매니저**: **pnpm**

### pnpm 설치

```bash
# Corepack 사용 (Node 16+)
corepack enable
corepack prepare pnpm@latest --activate

# 또는 https://pnpm.io/installation
```

### 설치 및 실행

```bash
# 루트에서 의존성 설치
pnpm install

# 서버 빌드 (shared → producer)
pnpm run build:server

# Producer 개발 서버
pnpm run start:producer
```

### 워크스페이스

| 경로 | 패키지명 | 설명 |
|------|----------|------|
| client | (Next.js) | 프론트엔드 |
| server/shared | @cook/shared | Producer/Consumer 공용 (config, DB, Redis, types) |
| server/producer | @cook/producer | NestJS API 서버 |
