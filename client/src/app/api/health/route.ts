import { NextResponse } from 'next/server';

/**
 * 프론트 배포 liveness.
 *
 * Sentry Uptime 등 외부 모니터는 `/`·`/recipe` 대신 이 경로를 사용한다.
 * ISR 페이지·백엔드 의존 없이 200만 반환한다.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      now: Date.now(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
