import { findUnknownCliArgs } from '../cli-args.util';

describe('findUnknownCliArgs', () => {
  it('알려진 플래그와 값을 소비한다', () => {
    expect(
      findUnknownCliArgs(['--fetch-limit', '100'], {
        flags: [{ name: '--fetch-limit', takesValue: true }],
      }),
    ).toEqual([]);
  });

  it('알 수 없는 플래그를 반환한다', () => {
    expect(
      findUnknownCliArgs(['--fetch-limit', '100', '--unknown'], {
        flags: [{ name: '--fetch-limit', takesValue: true }],
      }),
    ).toEqual(['--unknown']);
  });

  it('허용 개수를 초과한 위치 인자를 반환한다', () => {
    expect(
      findUnknownCliArgs(['2026-05-22', 'extra'], { maxPositionals: 1 }),
    ).toEqual(['extra']);
  });

  it('복수 플래그를 처리한다', () => {
    expect(
      findUnknownCliArgs(
        ['--retry-failed', '--submit-batch-size', '50', '--foo'],
        {
          flags: [
            { name: '--submit-batch-size', takesValue: true },
            { name: '--retry-failed' },
          ],
        },
      ),
    ).toEqual(['--foo']);
  });
});
