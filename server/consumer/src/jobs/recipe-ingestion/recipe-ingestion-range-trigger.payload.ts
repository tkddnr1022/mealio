/**
 * recipe-ingestion trigger 공통 payload.
 */
export interface RecipeIngestionRunTriggerPayload {
  runId: string;
  fetchedCount: number;
  triggeredAt: string;
}

export type RecipeIngestionFetchToParseSubmitPayload =
  RecipeIngestionRunTriggerPayload;
export type RecipeIngestionParseRetrieveToPersistPayload =
  RecipeIngestionRunTriggerPayload;
export type RecipeIngestionPersistToEmbedSubmitPayload =
  RecipeIngestionRunTriggerPayload;

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
