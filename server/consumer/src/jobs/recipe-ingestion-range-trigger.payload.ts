/**
 * recipe-ingestion-fetch-completed · recipe-ingestion-retrieved Kafka 트리거 공통 payload.
 * Consumer 패키지 내부 SSOT — @mealio/shared에는 두지 않는다.
 */
export interface RecipeIngestionRangeTriggerPayload {
  startSourceId: number;
  endSourceId: number;
  fetchedCount: number;
  triggeredAt: string;
}

/** fetch-completed 토픽 payload (구조 동일) */
export type RecipeIngestionFetchCompletedPayload =
  RecipeIngestionRangeTriggerPayload;

/** retrieved 토픽 payload (구조 동일) */
export type RecipeIngestionRetrievedPayload = RecipeIngestionRangeTriggerPayload;

export function isValidRecipeIngestionRangeTriggerPayload(
  obj: unknown,
): obj is RecipeIngestionRangeTriggerPayload {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const o = obj as Record<string, unknown>;
  return (
    typeof o.startSourceId === 'number' &&
    Number.isFinite(o.startSourceId) &&
    typeof o.endSourceId === 'number' &&
    Number.isFinite(o.endSourceId) &&
    typeof o.fetchedCount === 'number' &&
    Number.isFinite(o.fetchedCount) &&
    o.fetchedCount > 0 &&
    typeof o.triggeredAt === 'string' &&
    o.triggeredAt.length > 0
  );
}

export function recipeIngestionRangeTriggerKey(
  startSourceId: number,
  endSourceId: number,
): string {
  return `${startSourceId}:${endSourceId}`;
}

export function createRecipeIngestionRangeTriggerPayload(params: {
  startSourceId: number;
  endSourceId: number;
  fetchedCount: number;
}): RecipeIngestionRangeTriggerPayload {
  return {
    startSourceId: params.startSourceId,
    endSourceId: params.endSourceId,
    fetchedCount: params.fetchedCount,
    triggeredAt: new Date().toISOString(),
  };
}
