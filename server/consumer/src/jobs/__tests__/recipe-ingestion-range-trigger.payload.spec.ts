import {
  createRecipeIngestionRangeTriggerPayload,
  isValidRecipeIngestionRangeTriggerPayload,
  recipeIngestionRangeTriggerKey,
} from '../recipe-ingestion-range-trigger.payload';

describe('recipe-ingestion-range-trigger.payload', () => {
  it('should validate a well-formed payload', () => {
    const payload = createRecipeIngestionRangeTriggerPayload({
      startSourceId: 1,
      endSourceId: 10,
      fetchedCount: 5,
    });

    expect(isValidRecipeIngestionRangeTriggerPayload(payload)).toBe(true);
    expect(recipeIngestionRangeTriggerKey(1, 10)).toBe('1:10');
  });

  it('should reject invalid payloads', () => {
    expect(isValidRecipeIngestionRangeTriggerPayload(null)).toBe(false);
    expect(
      isValidRecipeIngestionRangeTriggerPayload({
        startSourceId: 1,
        endSourceId: 10,
        fetchedCount: 0,
        triggeredAt: '2026-06-21T00:00:00.000Z',
      }),
    ).toBe(false);
  });
});
