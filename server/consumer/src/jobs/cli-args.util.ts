export type CliFlagDefinition = {
  name: string;
  takesValue?: boolean;
};

/**
 * 알려진 플래그·위치 인자를 소비한 뒤 남은 토큰을 반환한다.
 */
export function findUnknownCliArgs(
  args: string[],
  options: {
    flags?: CliFlagDefinition[];
    maxPositionals?: number;
  } = {},
): string[] {
  const flags = options.flags ?? [];
  const flagMap = new Map(
    flags.map((flag) => [flag.name, flag.takesValue ?? false]),
  );
  const maxPositionals = options.maxPositionals ?? 0;

  const unknown: string[] = [];
  let positionals = 0;
  let index = 0;

  while (index < args.length) {
    const arg = args[index];
    if (arg === undefined) {
      break;
    }
    if (arg.startsWith('--')) {
      if (flagMap.has(arg)) {
        const takesValue = flagMap.get(arg)!;
        index += 1;
        if (takesValue) {
          index += 1;
        }
        continue;
      }
      unknown.push(arg);
      index += 1;
      continue;
    }

    if (positionals < maxPositionals) {
      positionals += 1;
      index += 1;
      continue;
    }

    unknown.push(arg);
    index += 1;
  }

  return unknown;
}
