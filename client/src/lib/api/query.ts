/**
 * 쿼리스트링 유틸.
 *
 * - {@link Query}는 `HttpClient`가 받아들이는 표준 query 객체 shape이다.
 * - {@link objectToQuery}는 타입 파라미터 객체(예: `RecipeListQuery`)에서
 *   `undefined`/`null`을 걸러낸 뒤 {@link Query}로 변환한다 — API 모듈의 중복 보일러플레이트 제거용.
 * - {@link buildQueryString}은 `HttpClient` 내부에서 최종 URL을 만들 때 사용된다.
 */

export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue | QueryValue[]>;

/**
 * 임의의 레코드(undefined/null 필드 허용)에서 null-ish 값을 제거해 `Query`로 좁힌다.
 * 서버에 보내지 않을 필드를 일일이 분기할 필요를 없애준다.
 *
 * 인자는 "문자열 키 객체면 무엇이든" 받도록 관대한 시그니처를 사용한다
 * (좁은 `Record<string, unknown>`은 선택 필드(`?:`)로 선언된 DTO와 할당 비호환).
 *
 * @example
 * httpClient.get(url, { query: objectToQuery(params) });
 */
export function objectToQuery(params: object): Query {
  const query: Query = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    query[key] = value as Query[string];
  }
  return query;
}

/**
 * `Query` 객체를 `URLSearchParams`로 직렬화한다.
 * 배열은 동일 key로 반복 append되며(`?id=1&id=2`), null-ish 값은 제외된다.
 */
export function buildQueryString(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) continue;
        params.append(key, String(item));
      }
    } else {
      params.append(key, String(value));
    }
  }
  return params.toString();
}
