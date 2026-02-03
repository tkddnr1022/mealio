/**
 * GPT 응답 본문의 JSON 파싱·검증
 * 레시피 생성 등 구조화된 JSON 응답을 파싱할 때 사용.
 */

export class OpenAIResponseParseError extends Error {
  constructor(
    message: string,
    public readonly raw: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'OpenAIResponseParseError';
  }
}

/**
 * 문자열에서 JSON 블록 추출 (마크다운 코드블록 포함)
 * GPT가 ```json ... ``` 형태로 반환하는 경우 대비.
 */
export function extractJsonBlock(text: string): string {
  const trimmed = text.trim();
  const codeBlockMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return trimmed;
}

/**
 * 문자열을 JSON으로 파싱. 실패 시 OpenAIResponseParseError.
 */
export function parseJson<T = unknown>(raw: string): T {
  const toParse = extractJsonBlock(raw);
  try {
    const parsed = JSON.parse(toParse) as T;
    return parsed;
  } catch (e) {
    throw new OpenAIResponseParseError(
      `Failed to parse JSON: ${(e as Error).message}`,
      raw,
      e,
    );
  }
}

/**
 * 파싱 후 검증 함수를 적용. 검증 실패 시 OpenAIResponseParseError.
 */
export function parseAndValidate<T>(
  raw: string,
  validate: (value: unknown) => value is T,
): T {
  const parsed = parseJson(raw);
  if (!validate(parsed)) {
    throw new OpenAIResponseParseError(
      'Parsed JSON did not pass validation',
      raw,
    );
  }
  return parsed;
}
