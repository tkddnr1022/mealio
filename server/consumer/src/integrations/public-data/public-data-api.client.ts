import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAX_RECIPE_FETCH_LIMIT } from '@mealio/shared';

export const PUBLIC_DATA_API_BASE_URL =
  'http://openapi.foodsafetykorea.go.kr/api';

/** 식품의약품안전처 조리식품 레시피 DB Open API serviceId */
export const PUBLIC_DATA_SERVICE_ID = 'COOKRCP01';

/** 공공 API 응답 형식 (ingestion은 json 고정) */
export const PUBLIC_DATA_TYPE = 'json';

/** 공공 API RESULT.CODE — recoverable 여부 */
const RECOVERABLE_RESULT_CODES = new Set([
  'INFO-300',
  'ERROR-500',
  'ERROR-601',
]);

export class PublicDataApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly recoverable: boolean,
  ) {
    super(message);
    this.name = 'PublicDataApiError';
  }
}

export class PublicDataFetchLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicDataFetchLimitError';
  }
}

export interface PublicDataFetchSuccess {
  kind: 'success';
  code: 'INFO-000';
  rows: Record<string, unknown>[];
}

export interface PublicDataFetchEmpty {
  kind: 'empty';
  code: 'INFO-200';
}

export type PublicDataFetchResult =
  | PublicDataFetchSuccess
  | PublicDataFetchEmpty;

export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

/**
 * 식품의약품안전처 공공데이터 Open API (COOKRCP01) HTTP 클라이언트
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §4
 */
@Injectable()
export class PublicDataApiClient {
  constructor(
    private readonly config: ConfigService,
    private readonly fetchFn: FetchLike = fetch,
  ) {}

  /**
   * fetchLimit 및 startIdx/endIdx 구간이 API 1000건 한도 이내인지 검증
   */
  assertFetchRangeValid(
    startIdx: number,
    endIdx: number,
    fetchLimit?: number,
  ): void {
    if (startIdx < 1) {
      throw new PublicDataFetchLimitError(
        `startIdx must be >= 1, received ${startIdx}`,
      );
    }
    if (endIdx < startIdx) {
      throw new PublicDataFetchLimitError(
        `endIdx (${endIdx}) must be >= startIdx (${startIdx})`,
      );
    }

    const rangeCount = endIdx - startIdx + 1;
    if (rangeCount > MAX_RECIPE_FETCH_LIMIT) {
      throw new PublicDataFetchLimitError(
        `Request range exceeds API limit (${MAX_RECIPE_FETCH_LIMIT}): ${rangeCount} rows (ERROR-336)`,
      );
    }

    if (fetchLimit !== undefined && fetchLimit > MAX_RECIPE_FETCH_LIMIT) {
      throw new PublicDataFetchLimitError(
        `fetchLimit (${fetchLimit}) exceeds maximum ${MAX_RECIPE_FETCH_LIMIT} (ERROR-336)`,
      );
    }
  }

  buildUrl(startIdx: number, endIdx: number): string {
    const keyId = this.config.getOrThrow<string>('PUBLIC_DATA_API_KEY');

    return `${PUBLIC_DATA_API_BASE_URL}/${encodeURIComponent(keyId)}/${encodeURIComponent(PUBLIC_DATA_SERVICE_ID)}/${encodeURIComponent(PUBLIC_DATA_TYPE)}/${startIdx}/${endIdx}`;
  }

  async fetchRecipes(
    startIdx: number,
    endIdx: number,
  ): Promise<PublicDataFetchResult> {
    this.assertFetchRangeValid(startIdx, endIdx);

    const url = this.buildUrl(startIdx, endIdx);
    let response: Response;
    try {
      response = await this.fetchFn(url, { method: 'GET' });
    } catch (error) {
      throw new PublicDataApiError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network request failed',
        true,
      );
    }

    if (!response.ok) {
      throw new PublicDataApiError(
        `HTTP_${response.status}`,
        `Public data API HTTP ${response.status}`,
        response.status >= 500,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new PublicDataApiError(
        'INVALID_JSON',
        'Public data API returned invalid JSON',
        true,
      );
    }

    return this.parseResponseBody(body);
  }

  parseResponseBody(body: unknown): PublicDataFetchResult {
    const envelope = this.extractEnvelope(body, PUBLIC_DATA_SERVICE_ID);
    const code = envelope.resultCode;
    const message = envelope.resultMessage;

    if (code === 'INFO-000') {
      return {
        kind: 'success',
        code: 'INFO-000',
        rows: envelope.rows,
      };
    }

    if (code === 'INFO-200') {
      return { kind: 'empty', code: 'INFO-200' };
    }

    const recoverable = RECOVERABLE_RESULT_CODES.has(code);
    throw new PublicDataApiError(
      code,
      message ?? `Public data API error: ${code}`,
      recoverable,
    );
  }

  private extractEnvelope(
    body: unknown,
    serviceId: string,
  ): {
    resultCode: string;
    resultMessage?: string;
    rows: Record<string, unknown>[];
  } {
    if (typeof body !== 'object' || body === null) {
      throw new PublicDataApiError(
        'INVALID_RESPONSE',
        'Public data API response is not an object',
        false,
      );
    }

    const root = body as Record<string, unknown>;
    const serviceBlock = root[serviceId];
    if (typeof serviceBlock !== 'object' || serviceBlock === null) {
      throw new PublicDataApiError(
        'INVALID_RESPONSE',
        `Missing service block "${serviceId}" in API response`,
        false,
      );
    }

    const block = serviceBlock as Record<string, unknown>;
    const result = block.RESULT;
    if (typeof result !== 'object' || result === null) {
      throw new PublicDataApiError(
        'INVALID_RESPONSE',
        'Missing RESULT in API response',
        false,
      );
    }

    const resultObj = result as Record<string, unknown>;
    const resultCode = this.toScalarString(resultObj.CODE);
    const resultMessage =
      resultObj.MSG !== undefined
        ? this.toScalarString(resultObj.MSG)
        : undefined;

    const rawRow = block.row;
    const rows = this.normalizeRows(rawRow);

    return { resultCode, resultMessage, rows };
  }

  private normalizeRows(rawRow: unknown): Record<string, unknown>[] {
    if (rawRow === undefined || rawRow === null) {
      return [];
    }
    if (Array.isArray(rawRow)) {
      return rawRow.filter(
        (row): row is Record<string, unknown> =>
          typeof row === 'object' && row !== null,
      );
    }
    if (typeof rawRow === 'object') {
      return [rawRow as Record<string, unknown>];
    }
    return [];
  }

  private toScalarString(value: unknown): string {
    if (value === undefined || value === null) {
      return '';
    }
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }
    return '';
  }
}
