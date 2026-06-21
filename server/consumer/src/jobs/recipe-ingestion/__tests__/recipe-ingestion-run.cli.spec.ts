import {
  parseJobIdCliArg,
  parseRecipeIngestionRunCliArgs,
  parseRecipeIngestionTargetCliArgs,
} from '../recipe-ingestion-run.cli';

describe('parseRecipeIngestionRunCliArgs', () => {
  const createError = (message: string) => new Error(message);

  it('defaults runIdCount to 1 when no run flags are provided', () => {
    expect(parseRecipeIngestionRunCliArgs([], createError)).toEqual({
      runIdCount: 1,
    });
  });

  it('parses --run-id', () => {
    expect(
      parseRecipeIngestionRunCliArgs(['--run-id', 'run-1'], createError),
    ).toEqual({ runId: 'run-1' });
  });

  it('parses --run-id-count', () => {
    expect(
      parseRecipeIngestionRunCliArgs(['--run-id-count', '3'], createError),
    ).toEqual({ runIdCount: 3 });
  });

  it('rejects using --run-id and --run-id-count together', () => {
    expect(() =>
      parseRecipeIngestionRunCliArgs(
        ['--run-id', 'run-1', '--run-id-count', '2'],
        createError,
      ),
    ).toThrow('--run-id and --run-id-count cannot be used together');
  });

  it('rejects run-id-count above maximum', () => {
    expect(() =>
      parseRecipeIngestionRunCliArgs(['--run-id-count', '4'], createError),
    ).toThrow('--run-id-count (4) exceeds maximum 3');
  });
});

describe('parseJobIdCliArg', () => {
  const createError = (message: string) => new Error(message);

  it('parses --job-id', () => {
    expect(
      parseJobIdCliArg(['--job-id', '507f1f77bcf86cd799439011'], createError),
    ).toBe('507f1f77bcf86cd799439011');
  });

  it('rejects empty --job-id value', () => {
    expect(() => parseJobIdCliArg(['--job-id'], createError)).toThrow(
      '--job-id requires a non-empty value',
    );
  });
});

describe('parseRecipeIngestionTargetCliArgs', () => {
  const createError = (message: string) => new Error(message);

  it('parses --job-id without default run scope', () => {
    expect(
      parseRecipeIngestionTargetCliArgs(
        ['--job-id', '507f1f77bcf86cd799439011'],
        createError,
      ),
    ).toEqual({ jobId: '507f1f77bcf86cd799439011' });
  });

  it('rejects --job-id with --run-id', () => {
    expect(() =>
      parseRecipeIngestionTargetCliArgs(
        ['--job-id', '507f1f77bcf86cd799439011', '--run-id', 'run-1'],
        createError,
      ),
    ).toThrow('--job-id cannot be used with --run-id or --run-id-count');
  });

  it('rejects --job-id with --run-id-count', () => {
    expect(() =>
      parseRecipeIngestionTargetCliArgs(
        ['--job-id', '507f1f77bcf86cd799439011', '--run-id-count', '2'],
        createError,
      ),
    ).toThrow('--job-id cannot be used with --run-id or --run-id-count');
  });
});
