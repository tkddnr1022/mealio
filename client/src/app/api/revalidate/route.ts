import { timingSafeEqual } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

interface RevalidateRequestBody {
  secret?: unknown;
  id?: unknown;
}

function parseRecipeId(raw: unknown): number | null {
  const parsed =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number.parseInt(raw, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
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

  const recipeId = parseRecipeId(body.id);
  if (recipeId === null) {
    return NextResponse.json(
      { ok: false, error: 'Invalid recipe id' },
      { status: 400 },
    );
  }

  const path = `/recipe/${recipeId}`;
  revalidatePath(path);

  return NextResponse.json({
    ok: true,
    revalidated: true,
    path,
    now: Date.now(),
  });
}
