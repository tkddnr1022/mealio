# Mealio Client

Next.js 기반 프론트엔드 앱

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)

## 소개

- 레시피 검색·상세·필터, 재료 관리, 챗봇 UI
- App Router, TanStack Query, Storybook
- 모노레포 루트 [README.md](../README.md)의 설치·인프라 절차를 먼저 따릅니다.

## 폴더 구조

```text
client/
├─ src/app/           # App Router 페이지·Route Handler
├─ src/components/    # UI·도메인 컴포넌트
├─ src/lib/           # API·설정·쿼리·유틸
└─ .env.example
```

## Configuration

```bash
cp .env.example .env          # 호스트 개발
cp .env.example .env.docker   # Docker Compose
```

| 변수 | 설명 | 기본값(예시) |
| --- | --- | --- |
| `APP_ENV` | 실행 환경 | `development` |
| `PORT` | 개발·프로덕션 서버 포트 | `4000` |
| `INTERNAL_API_BASE_URL` | SSR·Route Handler 전용 내부 API URL (비우면 `NEXT_PUBLIC_API_BASE_URL` 사용) | (비움) |
| `NEXT_PUBLIC_API_BASE_URL` | 브라우저·CSR용 백엔드 API base URL (비우면 same-origin) | (비움) |
| `NEXT_PUBLIC_API_PREFIX` | REST API prefix | `/api/v1` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID | (비움) |
| `NEXT_PUBLIC_SENTRY_ENABLED` | Sentry 활성화 (`true` / `false`) | (비움) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry 브라우저 DSN | (비움) |
| `NEXT_PUBLIC_SITE_URL` | 메타·OG용 사이트 URL | (비움) |
| `REVALIDATE_SECRET` | `/api/revalidate` ISR 재검증 시크릿 | (비움) |

## 사용 방법

모노레포 루트에서 실행합니다.

```bash
pnpm run start:client
```

```bash
pnpm run build:client
pnpm run start:storybook
```

기본 접속: `http://localhost:4000`
