# Mealio Docs (Docusaurus)

Mealio 문서 사이트

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
| `sidebars.ts` | 문서 사이드바 목차 |
| `sidebars-openapi.ts` | OpenAPI 레퍼런스 사이드바 (생성된 `openapi/sidebar.ts` 병합) |
| `docusaurus.config.ts` | 사이트 설정 (`docusaurus-plugin-openapi-docs` 포함) |
| `docs/` | Markdown 문서 본문 |
| `openapi/` | OpenAPI 명세에서 자동 생성된 API 레퍼런스 MDX (`/openapi` 경로) |

## OpenAPI 레퍼런스 생성

Producer API 문서는 `agent/common/openapi_spec_backend.yaml`을 소스로 `docusaurus-plugin-openapi-docs`가 MDX를 생성합니다. `start`·`build` 시 자동 실행되며, 명세만 갱신할 때는 아래를 실행합니다.

```bash
pnpm --filter mealio-docs gen-api-docs
```

## slug 매핑

주요 페이지 doc ID 예시:

- `로컬 개발/온보딩` → `project/getting-started`
- `프로젝트 개요` → `project/overview`
- `도메인` → `project/domain`
- `인증 (client)` → `client/auth`
- `Producer API` → `producer/api`

전체 목차는 `sidebars.ts`를 참고하세요.
