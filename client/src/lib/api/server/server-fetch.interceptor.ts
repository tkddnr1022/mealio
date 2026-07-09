import type { RequestInterceptor } from '@/lib/api/http-client';
import { INTERNAL_API_SECRET_HEADER } from '@/lib/constants/internal-api.constants';

/**
 * SSR·빌드 시 producer로 보내는 내부 API fetch에 `X-Internal-Api-Secret`을 주입한다.
 * 브라우저(CSR) 요청에는 적용하지 않는다.
 */
export const serverFetchRequestInterceptor: RequestInterceptor = (ctx) => {
  if (typeof window !== 'undefined') return ctx;

  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) return ctx;

  const headers = new Headers(ctx.headers);
  headers.set(INTERNAL_API_SECRET_HEADER, secret);
  return { ...ctx, headers };
};
