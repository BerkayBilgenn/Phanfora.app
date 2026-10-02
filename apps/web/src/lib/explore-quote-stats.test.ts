import { describe, expect, it } from 'vitest';
import type { MarketCandidate } from '@phanfora/domain';
import { exploreQuoteStats } from './explore-quote-stats';

const quote = (overrides: Partial<MarketCandidate> = {}): MarketCandidate => ({
  asset: { id: 'stock:aapl-xnas', symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high' },
  price: { amount: '108', currency: 'USD' },
  changePercent: '8',
  dimensions: { trend: 50, momentum: 50, liquidity: 50, riskFit: 50, marketConditions: 50 },
  volatility: 12.4,
  quality: { freshness: 'delayed', completeness: 1, integrity: 'verified' },
  marketStatus: 'unknown',
  series: [
    { time: '2026-06-01T11:00:00.000Z', open: '100', high: '103', low: '99', close: '102', volume: '12' },
    { time: '2026-06-01T11:15:00.000Z', open: '102', high: '106', low: '101', close: '105', volume: '15' },
    { time: '2026-06-01T11:30:00.000Z', open: '105', high: '108', low: '104', close: '107', volume: '18' },
    { time: '2026-06-01T11:45:00.000Z', open: '107', high: '109', low: '105', close: '108', volume: '21' },
  ],
  source: 'Yahoo Finance',
  observedAt: '2026-06-01T12:00:00.000Z',
  snapshotId: 't',
  dataMode: 'delayed',
  ...overrides,
});

function value(rows: ReturnType<typeof exploreQuoteStats>, label: string) {
  return rows.find((row) => row.label === label)?.value;
}

describe('exploreQuoteStats', () => {
  it('reads high, low, last volume and observation from the series without inventing prices', () => {
    const rows = exploreQuoteStats(quote());
    expect(value(rows, 'Yüksek')).toContain('109');
    expect(value(rows, 'Düşük')).toContain('99');
    expect(value(rows, 'Hacim')).toContain('21');
    expect(value(rows, 'Oynaklık')).toMatch(/12/);
    expect(value(rows, 'Kaynak')).toBe('Yahoo Finance');
    expect(value(rows, 'Gözlem')).toMatch(/15:00/);
  });

  it('omits volume when the last bar has no usable volume', () => {
    const rows = exploreQuoteStats(quote({
      series: [
        { time: '2026-06-01T11:00:00.000Z', high: '103', low: '99', close: '102', volume: '0' },
        { time: '2026-06-01T11:15:00.000Z', high: '106', low: '101', close: '105', volume: '0' },
      ],
    }));
    expect(rows.some((row) => row.label === 'Hacim')).toBe(false);
    expect(value(rows, 'Yüksek')).toContain('106');
  });

  it('does not invent a range when the series has no numeric prices', () => {
    const rows = exploreQuoteStats(quote({
      series: [{ time: '2026-06-01T11:00:00.000Z', close: 'n/a', volume: 'x' }],
      volatility: Number.NaN,
    }));
    expect(rows.some((row) => row.label === 'Yüksek' || row.label === 'Düşük')).toBe(false);
    expect(rows.some((row) => row.label === 'Oynaklık')).toBe(false);
    expect(value(rows, 'Kaynak')).toBe('Yahoo Finance');
  });
});
