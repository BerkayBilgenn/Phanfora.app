import { describe, expect, it } from 'vitest';
import type { MarketCandidate } from '@phanfora/domain';
import { matchesMarketTab } from './market-tabs';

const quote = (assetClass: MarketCandidate['asset']['assetClass'], venue: string): MarketCandidate => ({
  asset: { id: 'x', symbol: 'X', name: 'X', assetClass, exchangeOrVenue: venue, quoteCurrency: 'USD', liquidityTier: 'high' },
  price: { amount: '1', currency: 'USD' },
  changePercent: '0',
  dimensions: { trend: 50, momentum: 50, liquidity: 50, riskFit: 50, marketConditions: 50 },
  volatility: 1,
  quality: { freshness: 'live', completeness: 1, integrity: 'verified' },
  marketStatus: 'open',
  series: [{ time: '2026-09-29T00:00:00.000Z', close: '1', volume: '1' }],
  source: 'Test',
  observedAt: '2026-09-29T00:00:00.000Z',
  snapshotId: 't',
  dataMode: 'live',
});

describe('matchesMarketTab', () => {
  it('keeps NASDAQ stocks on ABD and BIST stocks on Türkiye', () => {
    expect(matchesMarketTab(quote('stock', 'NASDAQ'), 'us')).toBe(true);
    expect(matchesMarketTab(quote('stock', 'Borsa İstanbul'), 'tr')).toBe(true);
    expect(matchesMarketTab(quote('crypto', 'Kraken'), 'us')).toBe(false);
  });
});
