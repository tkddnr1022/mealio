/**
 * 앱 메타 설정 (env·배포 환경 파생).
 *
 * 고정 브랜딩·문구는 `@/lib/constants/app.constants`를 사용한다.
 */
import { env } from '@/lib/config/env';

/**
 * Next.js `metadataBase`·Open Graph 절대 URL 해석.
 * 우선순위: `env.siteUrl` → Vercel 배포 URL → 로컬 기본값.
 */
export function getMetadataBase(): URL {
  if (env.siteUrl) {
    return new URL(env.siteUrl);
  }
  if (env.vercelHost) {
    return new URL(`https://${env.vercelHost}`);
  }
  return new URL('http://localhost:3000');
}
