import { afterEach, describe, expect, it } from 'vitest';

import type { FxRateProvider, MarketDataProvider } from '@phanfora/market-data';
import {
  FixtureFxRateProvider,
  FixtureMarketDataProvider,
  MarketDataError,
} from '@phanfora/market-data';

import { buildApp } from './app';

const apps: ReturnType<typeof buildApp>[] = [];
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

function app() {
  const instance = buildApp({
    logger: false,
    marketData: new FixtureMarketDataProvider(),
    fxRates: new FixtureFxRateProvider(),
    providerMode: 'fixture',
  });
  apps.push(instance);
  return instance;
}

const validBody = {
  amount: '25000',
  currency: 'TRY',
  horizon: 'weekly',
  riskProfile: 'balanced',
  locale: 'tr-TR',
};

describe('Phanfora API', () => {
  it('reports process and fixture-provider health', async () => {
    const response = await app().inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok', dataMode: 'fixture', provider: 'Fixture',
    });
  });

  it('returns the localized currency catalog', async () => {
    const response = await app().inject({ method: 'GET', url: '/v1/currencies?locale=tr-TR' });
    expect(response.statusCode).toBe(200);
    expect(response.json().items.length).toBeGreaterThan(150);
  });

  it('returns the real fixture market overview', async () => {
    const response = await app().inject({ method: 'GET', url: '/v1/market/overview' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      assetCount: 7,
      byAssetClass: { stock: 2, crypto: 2, commodity: 1, forex: 1, index: 1 },
      provider: 'Phanfora deterministic fixture',
      dataMode: 'fixture',
      observedAt: '2026-09-24T09:00:00.000Z',
    });
  });

  it('returns a requested asset OHLCV series and validates the horizon', async () => {
    const response = await app().inject({
      method: 'GET',
      url: '/v1/assets/stock%3Aaapl-xnas/series?horizon=weekly',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      asset: { id: 'stock:aapl-xnas' },
      horizon: 'weekly',
      dataMode: 'fixture',
      quality: { completeness: 1, integrity: 'verified' },
    });
    expect(response.json().series[0]).toMatchObject({
      open: expect.any(String), high: expect.any(String), low: expect.any(String),
      close: expect.any(String), volume: expect.any(String),
    });

    const invalidHorizon = await apps.at(-1)!.inject({
      method: 'GET',
      url: '/v1/assets/stock%3Aaapl-xnas/series?horizon=yearly',
    });
    expect(invalidHorizon.statusCode).toBe(400);
  });

  it('returns 404 for an unknown asset series', async () => {
    const response = await app().inject({
      method: 'GET',
      url: '/v1/assets/missing/series?horizon=weekly',
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('ASSET_NOT_FOUND');
  });

  it('creates and idempotently replays an analysis', async () => {
    const first = await app().inject({
      method: 'POST', url: '/v1/analyses',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'browser-request-1' },
      payload: validBody,
    });
    expect(first.statusCode).toBe(201);
    expect(first.json().dataMode).toBe('fixture');
    expect(first.json().scanSummary).toEqual({
      scanned: 7,
      eligible: 6,
      excluded: 1,
      byAssetClass: { stock: 2, crypto: 2, commodity: 1, forex: 1, index: 1 },
    });

    const second = await apps.at(-1)!.inject({
      method: 'POST', url: '/v1/analyses',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'browser-request-1' },
      payload: validBody,
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().id).toBe(first.json().id);
  });

  it('rejects invalid amounts', async () => {
    const response = await app().inject({
      method: 'POST', url: '/v1/analyses',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'browser-request-2' },
      payload: { ...validBody, amount: '-20' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('requires an idempotency key', async () => {
    const response = await app().inject({
      method: 'POST', url: '/v1/analyses',
      headers: { 'content-type': 'application/json' },
      payload: validBody,
    });
    expect(response.statusCode).toBe(400);
  });

  it('rejects unsupported content types', async () => {
    const response = await app().inject({
      method: 'POST', url: '/v1/analyses',
      headers: { 'content-type': 'text/plain', 'idempotency-key': 'browser-request-3' },
      payload: JSON.stringify(validBody),
    });
    expect(response.statusCode).toBe(415);
  });

  it('reports degraded health and refuses analysis without a configured provider', async () => {
    const instance = buildApp({ logger: false });
    apps.push(instance);

    const health = await instance.inject({ method: 'GET', url: '/health' });
    const analysis = await instance.inject({
      method: 'POST', url: '/v1/analyses',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'missing-provider' },
      payload: validBody,
    });

    expect(health.json()).toMatchObject({
      status: 'degraded', error: 'MARKET_DATA_NOT_CONFIGURED',
    });
    expect(analysis.statusCode).toBe(503);
    expect(analysis.json().error.code).toBe('MARKET_DATA_NOT_CONFIGURED');
  });

  it('maps provider rate limits to a sanitized retryable response', async () => {
    const fixtureMarket = new FixtureMarketDataProvider();
    const marketData: MarketDataProvider = {
      listAssets: () => fixtureMarket.listAssets(),
      getAsset: (id) => fixtureMarket.getAsset(id),
      getSeries: (id, horizon) => fixtureMarket.getSeries(id, horizon),
      getOverview: () => fixtureMarket.getOverview(),
      getCandidates: async () => { throw new MarketDataError('MARKET_DATA_RATE_LIMITED'); },
    };
    const fxRates: FxRateProvider = new FixtureFxRateProvider();
    const instance = buildApp({ logger: false, marketData, fxRates, providerMode: 'live' });
    apps.push(instance);

    const response = await instance.inject({
      method: 'POST', url: '/v1/analyses',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'rate-limited' },
      payload: validBody,
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: {
        code: 'MARKET_DATA_RATE_LIMITED',
        message: 'Canlı veri kotası dolu. Kısa süre sonra yeniden dene.',
      },
    });
  });
});
