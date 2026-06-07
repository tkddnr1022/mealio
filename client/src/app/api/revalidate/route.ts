import { timingSafeEqual } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

interface RevalidateRequestBody {
  secret?: unknown;
  path?: unknown;
}

function parseRevalidatePath(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (!trimmed.startsWith('/')) {
    return null;
  }

  if (trimmed.startsWith('//') || trimmed.includes('..')) {
    return null;
  }

  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1);
  }

  return trimmed;
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

  const path = parseRevalidatePath(body.path);
  if (path === null) {
    return NextResponse.json(
      { ok: false, error: 'Invalid path' },
      { status: 400 },
    );
  }

  revalidatePath(path);

  return NextResponse.json({
    ok: true,
    revalidated: true,
    path,
    now: Date.now(),
  });
}
