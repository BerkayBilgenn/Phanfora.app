import { describe, expect, it, vi } from 'vitest';

import type { FxRateProvider, MarketDataProvider } from '@phanfora/market-data';
import { FixtureFxRateProvider, FixtureMarketDataProvider } from '@phanfora/market-data';

import { AnalysisService } from './index';

const input = {
  amount: { amount: '25000', currency: 'TRY' },
  horizon: 'weekly',
  riskProfile: 'balanced',
  locale: 'tr-TR',
} as const;

function service() {
  return new AnalysisService({
    marketData: new FixtureMarketDataProvider(),
    fxRates: new FixtureFxRateProvider(),
    clock: () => '2026-09-24T09:01:00.000Z',
    createId: () => 'analysis-fixed-id',
    idempotencyStore: new Map(),
  });
}

describe('analysis orchestration', () => {
  it('returns the same immutable analysis for a repeated idempotency key', async () => {
    const analysis = service();
    const first = await analysis.create(input, 'request-key-123');
    const second = await analysis.create(input, 'request-key-123');
    expect(second).toBe(first);
    expect(first.id).toBe('analysis-fixed-id');
    expect(Object.isFrozen(first)).toBe(true);
  });

  it('ranks one primary and two alternatives in descending score order', async () => {
    const result = await service().create(input, 'request-key-456');
    const scores = [result.primary, ...result.alternatives].map(
      (asset) => asset.totalScore,
    );
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(result.alternatives).toHaveLength(2);
  });

  it('uses one FX snapshot for every converted result price', async () => {
    const result = await service().create(input, 'request-key-789');
    expect(result.fxSnapshot.id).toBe('fixture-fx-usd-2026-09-24');
    expect([result.primary, ...result.alternatives].every(
      (asset) => asset.convertedPrice.currency === 'TRY',
    )).toBe(true);
    expect(result.primary.convertedPrice.amount).not.toBe(
      result.primary.price.amount,
    );
  });

  it('preserves structured exclusion reasons from quality gates', async () => {
    const result = await service().create(input, 'request-key-987');
    expect(result.excluded).toContainEqual({
      ok: false,
      assetId: 'crypto:micro-usd',
      reason: 'LOW_LIQUIDITY',
    });
  });

  it('requests only the selected currency rate and derives live result mode', async () => {
    const fixtureMarket = new FixtureMarketDataProvider();
    const fixtureFx = new FixtureFxRateProvider();
    const marketData: MarketDataProvider = {
      listAssets: () => fixtureMarket.listAssets(),
      getAsset: (id) => fixtureMarket.getAsset(id),
      getCandidates: async (horizon) => (await fixtureMarket.getCandidates(horizon)).map(
        (candidate) => Object.freeze({
          ...candidate,
          quality: Object.freeze({ ...candidate.quality, freshness: 'live' as const }),
          dataMode: 'live' as const,
        }),
      ),
    };
    const getRates = vi.fn<FxRateProvider['getRates']>(async (base, quotes) => {
      const snapshot = await fixtureFx.getRates(base);
      return Object.freeze({
        ...snapshot,
        rates: snapshot.rates,
        freshness: 'live' as const,
        dataMode: 'live' as const,
      });
    });
    const analysis = new AnalysisService({
      marketData,
      fxRates: { listCurrencies: (locale) => fixtureFx.listCurrencies(locale), getRates },
      clock: () => '2026-09-24T09:01:00.000Z',
      createId: () => 'live-analysis',
      idempotencyStore: new Map(),
    });

    const result = await analysis.create(input, 'live-request');

    expect(getRates).toHaveBeenCalledWith('USD', ['TRY']);
    expect(result.dataMode).toBe('live');
    expect(result.primary.dataMode).toBe('live');
  });
});
