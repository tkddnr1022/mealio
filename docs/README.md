# Mealio Docs (Docusaurus)

Mealio 공식 문서 사이트. 사이드바 목차는 `docs/sidebars.ts`와 `docs/docs/` Markdown 파일이 1:1로 대응합니다.

## 로컬 실행

```bash
# 루트에서
pnpm install
pnpm start:docs

# 또는 docs 패키지에서
pnpm --filter mealio-docs start
```

## 빌드

```bash
pnpm build:docs
```

## 구조

| 경로 | 역할 |
| --- | --- |
| `sidebars.ts` | 사이드바 목차 |
| `docusaurus.config.ts` | 사이트 설정 |
| `docs/` | Markdown 문서 본문 |

## slug 매핑

주요 페이지 doc ID 예시:

- `로컬 개발/온보딩` → `project/getting-started`
- `프로젝트 개요` → `project/overview`
- `도메인 개요` → `project/domain`
- `인증 (client)` → `client/auth`
- `Producer API` → `producer/api`

전체 목차는 `sidebars.ts`를 참고하세요.
