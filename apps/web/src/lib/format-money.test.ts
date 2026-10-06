import { describe, expect, it } from 'vitest';
import { formatMoney } from './format-money';

describe('formatMoney', () => {
  it('formats ISO currencies with Intl', () => {
    expect(formatMoney(105, 'USD')).toMatch(/105/);
  });

  it('does not throw for quote currencies that are not ISO codes', () => {
    expect(() => formatMoney(778.5, 'USDT')).not.toThrow();
    expect(formatMoney(778.5, 'USDT')).toMatch(/778/);
    expect(formatMoney(778.5, 'USDT')).toMatch(/USDT/);
  });
});
