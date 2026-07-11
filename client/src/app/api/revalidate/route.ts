import { timingSafeEqual } from 'node:crypto';

import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { parseRevalidateTags } from '@/lib/constants/cache-tags.constants';

interface RevalidateRequestBody {
  secret?: unknown;
  tags?: unknown;
}

function isValidSecret(provided: unknown, expected: string): boolean {
  if (typeof provided !== 'string' || provided.length === 0) {
    return false;
  }

  if (expected.length === 0) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expectedSecret = process.env.REVALIDATE_SECRET?.trim() ?? '';

  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: 'Revalidation is not configured' },
      { status: 500 },
    );
  }

  let body: RevalidateRequestBody;
  try {
    body = (await request.json()) as RevalidateRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  if (!isValidSecret(body.secret, expectedSecret)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid secret' },
      { status: 401 },
    );
  }

  const tags = parseRevalidateTags(body.tags);
  if (tags === null) {
    return NextResponse.json(
      { ok: false, error: 'Invalid tags' },
      { status: 400 },
    );
  }

  for (const tag of tags) {
    revalidateTag(tag, 'max');
  }

  return NextResponse.json({
    ok: true,
    revalidated: true,
    tags,
    now: Date.now(),
  });
}
