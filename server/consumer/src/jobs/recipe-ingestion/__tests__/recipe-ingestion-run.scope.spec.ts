import {
  RecipeIngestionRunScopeError,
  assertRunScopeAndJobIdMutuallyExclusive,
  resolveRecipeIngestionRunScope,
  resolveRunIdCount,
} from '../recipe-ingestion-run.scope';

describe('recipe-ingestion-run.scope', () => {
  it('defaults runIdCount to 1', () => {
    expect(resolveRecipeIngestionRunScope({})).toEqual({
      mode: 'count',
      runIdCount: 1,
    });
  });

  it('resolves single runId mode', () => {
    expect(resolveRecipeIngestionRunScope({ runId: 'run-1' })).toEqual({
      mode: 'single',
      runId: 'run-1',
    });
  });

  it('rejects mutual exclusion of runId and runIdCount', () => {
    expect(() =>
      resolveRecipeIngestionRunScope({ runId: 'run-1', runIdCount: 2 }),
    ).toThrow(RecipeIngestionRunScopeError);
  });

  it('rejects runIdCount above maximum', () => {
    expect(() => resolveRunIdCount(4)).toThrow(RecipeIngestionRunScopeError);
  });

  it('rejects mutual exclusion of jobId and run scope', () => {
    expect(() =>
      assertRunScopeAndJobIdMutuallyExclusive({
        jobId: '507f1f77bcf86cd799439011',
        runId: 'run-1',
      }),
    ).toThrow(RecipeIngestionRunScopeError);
    expect(() =>
      assertRunScopeAndJobIdMutuallyExclusive({
        jobId: '507f1f77bcf86cd799439011',
        runIdCount: 2,
      }),
    ).toThrow(RecipeIngestionRunScopeError);
  });
});
