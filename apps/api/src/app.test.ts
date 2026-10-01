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

  it('serves provider prices and observed timestamps without replacing them with demo values', async () => {
    const response = await app().inject({ method: 'GET', url: '/v1/market/quotes?horizon=weekly' });
    expect(response.statusCode).toBe(200);
    expect(response.json().dataMode).toBe('fixture');
    expect(response.json().items[0]).toMatchObject({
      asset: { symbol: 'BTC' }, price: { amount: '67420.18' },
      source: 'Phanfora deterministic fixture', observedAt: '2026-09-24T09:00:00.000Z',
    });
  });

  it('passes a personal asset selection to the quote provider', async () => {
    const fixtureMarket = new FixtureMarketDataProvider();
    let receivedIds: readonly string[] | undefined;
    const marketData: MarketDataProvider = {
      listAssets: () => fixtureMarket.listAssets(),
      getAsset: (id) => fixtureMarket.getAsset(id),
      getCandidates: (horizon, assetIds) => {
        receivedIds = assetIds;
        return fixtureMarket.getCandidates(horizon);
      },
    };
    const instance = buildApp({
      logger: false,
      marketData,
      fxRates: new FixtureFxRateProvider(),
      providerMode: 'fixture',
    });
    apps.push(instance);
    const response = await instance.inject({
      method: 'POST', url: '/v1/market/quotes',
      payload: { horizon: 'daily', assetIds: ['crypto:doge-usd'] },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().dataMode).toBe('fixture');
    expect(receivedIds).toEqual(['crypto:doge-usd']);
  });

  it('serves source attributed news through the public endpoint', async () => {
    const instance = buildApp({
      logger: false,
      news: { getNews: async () => ({
        items: [{ title: 'A real headline', url: 'https://www.eia.gov/story', publishedAt: '2026-10-01T08:00:00.000Z', category: 'commodity' as const, source: 'EIA' }],
        updatedAt: '2026-10-01T08:01:00.000Z', stale: false, unavailableSources: [],
      }) },
    });
    apps.push(instance);
    const response = await instance.inject({ method: 'GET', url: '/v1/news' });
    expect(response.statusCode).toBe(200);
    expect(response.json().items[0]).toMatchObject({ source: 'EIA', category: 'commodity' });
  });

  it('rejects unsupported quote horizons and unavailable providers', async () => {
    const invalid = await app().inject({ method: 'GET', url: '/v1/market/quotes?horizon=yearly' });
    expect(invalid.statusCode).toBe(400);
    const instance = buildApp({ logger: false });
    apps.push(instance);
    const unavailable = await instance.inject({ method: 'GET', url: '/v1/market/quotes' });
    expect(unavailable.statusCode).toBe(503);
  });

  it('creates and idempotently replays an analysis', async () => {
    const first = await app().inject({
      method: 'POST', url: '/v1/analyses',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'browser-request-1' },
      payload: validBody,
    });
    expect(first.statusCode).toBe(201);
    expect(first.json().dataMode).toBe('fixture');

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
