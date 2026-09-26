import { describe, expect, it } from 'vitest';

import {
  convertMoney,
  formatMoney,
  parseMoneyInput,
  searchCurrencies,
} from './index';

const usdSnapshot = {
  id: 'fx-2026-09-24',
  baseCurrency: 'USD',
  rates: { USD: '1', EUR: '0.85', TRY: '42.5' },
  provider: 'Phanfora Fixture',
  observedAt: '2026-09-24T09:00:00.000Z',
  freshness: 'fixture',
  dataMode: 'fixture',
} as const;

describe('currency behavior', () => {
  it('normalizes a Turkish-formatted money input', () => {
    expect(parseMoneyInput('12.345,67', 'TRY', 'tr-TR')).toEqual({
      amount: '12345.67',
      currency: 'TRY',
    });
  });

  it('converts from a snapshot base currency without floating-point drift', () => {
    expect(
      convertMoney({ amount: '100.00', currency: 'USD' }, 'TRY', usdSnapshot),
    ).toEqual({ amount: '4250', currency: 'TRY' });
  });

  it('cross-converts through the immutable base snapshot', () => {
    expect(
      convertMoney({ amount: '100', currency: 'EUR' }, 'TRY', usdSnapshot),
    ).toEqual({ amount: '5000', currency: 'TRY' });
  });

  it('rejects unsupported conversions instead of estimating a value', () => {
    expect(() =>
      convertMoney({ amount: '100', currency: 'USD' }, 'ZZZ', usdSnapshot),
    ).toThrow('FX_RATE_UNAVAILABLE');
  });

  it('finds currencies by localized name', () => {
    expect(searchCurrencies('türk').map((item) => item.code)).toContain('TRY');
  });

  it('formats currencies with the requested locale', () => {
    expect(formatMoney({ amount: '1234.5', currency: 'TRY' }, 'tr-TR')).toContain(
      '1.234,50',
    );
  });

  it.each(['0', '-1', '1e3', 'foo', ''])('rejects invalid amount %s', (value) => {
    expect(() => parseMoneyInput(value, 'USD', 'en-US')).toThrow(
      'INVALID_AMOUNT',
    );
  });
});
