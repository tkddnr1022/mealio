import { describe, expect, it } from 'vitest';

import { isBudgetExceeded, WEB_VITAL_BUDGET } from './web-vitals';

describe('WEB_VITAL_BUDGET', () => {
  it('matches frontend spec §4.1 targets (LCP 2.5s, INP 200ms, CLS 0.1)', () => {
    expect(WEB_VITAL_BUDGET.LCP).toBe(2500);
    expect(WEB_VITAL_BUDGET.INP).toBe(200);
    expect(WEB_VITAL_BUDGET.CLS).toBe(0.1);
  });
});

describe('isBudgetExceeded', () => {
  it('returns false when budget is undefined', () => {
    expect(isBudgetExceeded({ name: 'FCP', value: 9999 })).toBe(false);
  });

  it('returns true when value exceeds budget', () => {
    expect(isBudgetExceeded({ name: 'LCP', value: 2501 })).toBe(true);
    expect(isBudgetExceeded({ name: 'LCP', value: 2500 })).toBe(false);
    expect(isBudgetExceeded({ name: 'CLS', value: 0.11 })).toBe(true);
    expect(isBudgetExceeded({ name: 'CLS', value: 0.1 })).toBe(false);
  });
});
