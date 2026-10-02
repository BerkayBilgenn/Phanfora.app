import { describe, expect, it } from 'vitest';
import type { CanonicalAsset, Horizon, MarketCandidate } from '@phanfora/domain';
import { CompositeMarketDataProvider, MarketDataError, type MarketDataProvider } from './index';

const asset = (id: string, symbol: string): CanonicalAsset => ({
  id, symbol, name: symbol, assetClass: 'crypto', exchangeOrVenue: 'Test', quoteCurrency: 'USD', liquidityTier: 'high',
});

function candidate(id: string, source: string, freshness: MarketCandidate['quality']['freshness'] = 'live'): MarketCandidate {
  const item = asset(id, id.split(':')[1] ?? id);
  return {
    asset: item,
    price: { amount: '1', currency: 'USD' },
    changePercent: '0',
    dimensions: { trend: 50, momentum: 50, liquidity: 50, riskFit: 50, marketConditions: 50 },
    volatility: 1,
    quality: { freshness, completeness: 1, integrity: 'verified' },
    marketStatus: 'continuous',
    series: [{ time: '2026-09-28T00:00:00.000Z', close: '1', volume: '1' }],
    source,
    observedAt: '2026-09-28T00:00:00.000Z',
    snapshotId: `${source}:${id}`,
    dataMode: freshness === 'live' ? 'live' : freshness === 'end-of-day' ? 'end-of-day' : 'delayed',
  };
}

class Stub implements MarketDataProvider {
  constructor(private readonly items: readonly MarketCandidate[], private readonly fail = false) {}
  async listAssets() { return this.items.map((item) => item.asset); }
  async getAsset(id: string) {
    const found = this.items.find((item) => item.asset.id === id);
    if (!found) throw new Error('ASSET_NOT_FOUND');
    return found.asset;
  }
  async getCandidates(_horizon: Horizon) {
    if (this.fail) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    return this.items;
  }
}

describe('CompositeMarketDataProvider', () => {
  it('merges providers and keeps the first unique asset id', async () => {
    const composite = new CompositeMarketDataProvider([
      new Stub([candidate('crypto:btc-usd', 'Kraken', 'live')]),
      new Stub([candidate('crypto:btc-usd', 'Twelve Data', 'delayed'), candidate('stock:aapl-xnas', 'Twelve Data', 'delayed')]),
    ]);
    const result = await composite.getCandidates('daily');
    expect(result).toHaveLength(2);
    expect(result.find((item) => item.asset.id === 'crypto:btc-usd')?.source).toBe('Kraken');
    expect(result.find((item) => item.asset.id === 'stock:aapl-xnas')?.source).toBe('Twelve Data');
  });

  it('survives a failed provider when another still returns quotes', async () => {
    const composite = new CompositeMarketDataProvider([
      new Stub([], true),
      new Stub([candidate('crypto:eth-usd', 'Binance')]),
    ]);
    const result = await composite.getCandidates('daily');
    expect(result.map((item) => item.asset.symbol)).toEqual(['eth-usd']);
  });
});
