/**
 * recipe-ingestion-fetch-completed · recipe-ingestion-retrieved Kafka 트리거 공통 payload.
 * Consumer 패키지 내부 SSOT — @mealio/shared에는 두지 않는다.
 */
export interface RecipeIngestionRunTriggerPayload {
  runId: string;
  fetchedCount: number;
  triggeredAt: string;
}

/** fetch-completed 토픽 payload (구조 동일) */
export type RecipeIngestionFetchCompletedPayload = RecipeIngestionRunTriggerPayload;

/** retrieved 토픽 payload (구조 동일) */
export type RecipeIngestionRetrievedPayload = RecipeIngestionRunTriggerPayload;

export function isValidRecipeIngestionRunTriggerPayload(
  obj: unknown,
): obj is RecipeIngestionRunTriggerPayload {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const o = obj as Record<string, unknown>;
  return (
    typeof o.runId === 'string' &&
    o.runId.length > 0 &&
    typeof o.fetchedCount === 'number' &&
    Number.isFinite(o.fetchedCount) &&
    o.fetchedCount > 0 &&
    typeof o.triggeredAt === 'string' &&
    o.triggeredAt.length > 0
  );
}

export function recipeIngestionRunTriggerKey(runId: string): string {
  return runId;
}

export function createRecipeIngestionRunTriggerPayload(params: {
  runId: string;
  fetchedCount: number;
}): RecipeIngestionRunTriggerPayload {
  return {
    runId: params.runId,
    fetchedCount: params.fetchedCount,
    triggeredAt: new Date().toISOString(),
  };
}
