import {
  parseJobIdCliArg,
  parseForceCliArg,
  parseForceCliFlag,
  parseNoKafkaCliFlag,
  RECIPE_INGESTION_FORCE_REQUIRES_TARGET_MESSAGE,
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

describe('parseForceCliFlag', () => {
  it('returns false when --force is absent', () => {
    expect(parseForceCliFlag([])).toBe(false);
  });

  it('returns true when --force is present', () => {
    expect(parseForceCliFlag(['--force'])).toBe(true);
    expect(parseForceCliFlag(['--run-id', 'run-1', '--force'])).toBe(true);
  });
});

describe('parseForceCliArg', () => {
  const createError = (message: string) => new Error(message);

  it('returns false when --force is absent', () => {
    expect(parseForceCliArg([], createError)).toBe(false);
  });

  it('returns true with --job-id', () => {
    expect(
      parseForceCliArg(
        ['--job-id', '507f1f77bcf86cd799439011', '--force'],
        createError,
      ),
    ).toBe(true);
  });

  it('returns true with --run-id', () => {
    expect(
      parseForceCliArg(['--run-id', 'run-1', '--force'], createError),
    ).toBe(true);
  });

  it('rejects --force without --job-id or --run-id', () => {
    expect(() => parseForceCliArg(['--force'], createError)).toThrow(
      RECIPE_INGESTION_FORCE_REQUIRES_TARGET_MESSAGE,
    );
    expect(() =>
      parseForceCliArg(['--run-id-count', '2', '--force'], createError),
    ).toThrow(RECIPE_INGESTION_FORCE_REQUIRES_TARGET_MESSAGE);
  });
});

describe('parseNoKafkaCliFlag', () => {
  it('returns false when --no-kafka is absent', () => {
    expect(parseNoKafkaCliFlag([])).toBe(false);
    expect(parseNoKafkaCliFlag(['--run-id', 'run-1'])).toBe(false);
  });

  it('returns true when --no-kafka is present', () => {
    expect(parseNoKafkaCliFlag(['--no-kafka'])).toBe(true);
    expect(
      parseNoKafkaCliFlag(['--run-id', 'run-1', '--no-kafka']),
    ).toBe(true);
  });
});
