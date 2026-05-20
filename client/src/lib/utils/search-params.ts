export type SearchParamValue = string | string[] | undefined;

export type SearchParamRecord = Record<string, SearchParamValue>;

export async function resolveSearchParams(
  searchParams?: Promise<SearchParamRecord>,
): Promise<SearchParamRecord | undefined> {
  return searchParams ? await searchParams : undefined;
}

export function getSingleSearchParam(
  value: SearchParamValue,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getMultiSearchParam(value: SearchParamValue): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value] : [];
}

export function getTrimmedSearchParam(
  value: SearchParamValue,
): string | undefined {
  const normalized = getSingleSearchParam(value);
  const trimmed = normalized?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function getFirstTrimmedSearchParam(
  searchParams: SearchParamRecord | undefined,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = getTrimmedSearchParam(searchParams?.[key]);
    if (value) {
      return value;
    }
  }
  return undefined;
}

export function buildCurrentUrlFromSearchParams(
  pathname: string,
  searchParams?: SearchParamRecord,
): string {
  if (!searchParams) return pathname;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) qs.append(key, item);
      }
      continue;
    }
    if (value != null) qs.append(key, value);
  }

  const query = qs.toString();
  return query ? `${pathname}?${query}` : pathname;
}
