import {
  createRecipeIngestionRunTriggerPayload,
  isValidRecipeIngestionRunTriggerPayload,
  recipeIngestionRunTriggerKey,
} from '../recipe-ingestion-range-trigger.payload';

describe('recipe-ingestion-range-trigger.payload', () => {
  it('should validate a well-formed payload', () => {
    const payload = createRecipeIngestionRunTriggerPayload({
      runId: 'run-1',
      fetchedCount: 5,
    });

    expect(isValidRecipeIngestionRunTriggerPayload(payload)).toBe(true);
    expect(recipeIngestionRunTriggerKey('run-1')).toBe('run-1');
  });

  it('should reject invalid payloads', () => {
    expect(isValidRecipeIngestionRunTriggerPayload(null)).toBe(false);
    expect(
      isValidRecipeIngestionRunTriggerPayload({
        runId: '',
        fetchedCount: 0,
        triggeredAt: '2026-06-21T00:00:00.000Z',
      }),
    ).toBe(false);
  });
});
