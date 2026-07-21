import { describe, expect, it, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: <A extends unknown[], R>(fn: (...args: A) => R) => {
      let hit = false;
      let value: R;
      return (...args: A): R => {
        if (!hit) {
          value = fn(...args);
          hit = true;
        }
        return value;
      };
    },
  };
});

import {
  defaultCorrelationIdGenerator,
  getRequestCorrelationId,
  resolveCorrelationId,
} from './correlation-id';

describe('correlation-id', () => {
  it('defaultCorrelationIdGenerator returns distinct ids', () => {
    const first = defaultCorrelationIdGenerator();
    const second = defaultCorrelationIdGenerator();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(0);
  });

  it('getRequestCorrelationId reuses the same id within the cache scope', () => {
    expect(getRequestCorrelationId()).toBe(getRequestCorrelationId());
  });

  it('resolveCorrelationId uses request-scoped id on the server', () => {
    expect(typeof window).toBe('undefined');
    expect(resolveCorrelationId()).toBe(getRequestCorrelationId());
  });
});
