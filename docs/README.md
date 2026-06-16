# Mealio Docs (Docusaurus)

Mealio 공식 문서 사이트. 목차 SSOT는 `agent/docusaurus_documentation_plan.md`입니다.

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
| `sidebars.ts` | 사이드바 목차 (계획서와 1:1 대응) |
| `docusaurus.config.ts` | 사이트 설정 |
| `docs/` | Markdown 문서 본문 |

## slug 매핑

계획서 목차명 → Docusaurus doc ID:

- `로컬 개발/온보딩` → `project/getting-started`
- `프로젝트 개요` → `project/overview`
- `도메인 개요` → `project/domain`
- … (전체 매핑은 `agent/docusaurus_documentation_plan.md` §10 참고)
