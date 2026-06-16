/**
 * GitHub 사용자·저장소·Pages URL SSOT.
 * docs 패키지 내 설정(docusaurus.config.ts) 및 문서 본문에서 동일 값을 쓸 때 이 파일을 import한다.
 */
export const GITHUB_USERNAME = 'tkddnr1022' as const;

export const GITHUB_REPO = 'mealio' as const;

export const GITHUB_PAGES_BASE_URL = `https://${GITHUB_USERNAME}.github.io`;

export const GITHUB_REPO_URL = `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}`;

export const GITHUB_REPO_CLONE_URL = `${GITHUB_REPO_URL}.git`;

export const GITHUB_PAGES_DOCS_URL = `${GITHUB_PAGES_BASE_URL}/${GITHUB_REPO}`;
