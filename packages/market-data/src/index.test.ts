import { describe, expect, it } from 'vitest';

import { FixtureFxRateProvider, FixtureMarketDataProvider } from './index';

describe('fixture market data provider', () => {
  it('covers every MVP asset class with canonical identifiers', async () => {
    const assets = await new FixtureMarketDataProvider().listAssets();
    expect(new Set(assets.map((asset) => asset.assetClass))).toEqual(
      new Set(['stock', 'crypto', 'commodity', 'forex', 'index']),
    );
    expect(assets.every((asset) => asset.id.includes(':'))).toBe(true);
  });

  it('returns immutable, explicitly labeled fixture candidates', async () => {
    const candidates = await new FixtureMarketDataProvider().getCandidates('weekly');
    expect(candidates).toHaveLength(7);
    expect(candidates.every((candidate) => candidate.dataMode === 'fixture')).toBe(
      true,
    );
    expect(candidates.every((candidate) => candidate.quality.freshness === 'fixture')).toBe(
      true,
    );
    expect(Object.isFrozen(candidates[0])).toBe(true);
    expect(Object.isFrozen(candidates[0]?.series)).toBe(true);
  });

  it('rejects unknown asset IDs', async () => {
    await expect(
      new FixtureMarketDataProvider().getAsset('missing:asset'),
    ).rejects.toThrow('ASSET_NOT_FOUND');
  });
});

describe('fixture FX provider', () => {
  it('provides a consistent fixture rate for every catalog currency', async () => {
    const provider = new FixtureFxRateProvider();
    const currencies = await provider.listCurrencies('tr-TR');
    const snapshot = await provider.getRates('USD');
    expect(currencies.length).toBeGreaterThan(150);
    expect(currencies.every((currency) => snapshot.rates[currency.code])).toBe(true);
    expect(snapshot.dataMode).toBe('fixture');
    expect(snapshot.freshness).toBe('fixture');
  });
});
