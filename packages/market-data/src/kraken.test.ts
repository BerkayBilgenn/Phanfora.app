import { describe, expect, it, vi } from 'vitest';
import { KrakenMarketDataProvider, FrankfurterFxRateProvider, MarketDataError } from './index';

const candles = [
  [1_780_000_000, '100', '103', '99', '102', '101', '12', 8],
  [1_780_000_900, '102', '106', '101', '105', '104', '15', 10],
  [1_780_001_800, '105', '108', '104', '107', '106', '18', 11],
  [1_780_002_700, '107', '109', '105', '108', '107', '21', 12],
];

describe('keyless market providers', () => {
  it('uses Kraken OHLC prices, volume and observation time as returned', async () => {
    const fetcher = vi.fn(async (input: URL | RequestInfo) => {
      const url = new URL(String(input));
      const pair = url.searchParams.get('pair');
      return new Response(JSON.stringify({ error: [], result: { [pair!]: candles, last: 1_780_002_700 } }), { status: 200 });
    });
    const provider = new KrakenMarketDataProvider({ fetch: fetcher as typeof fetch, clock: () => '2026-05-28T08:20:00.000Z' });
    const result = await provider.getCandidates('daily');
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result[0]).toMatchObject({
      price: { amount: '108', currency: 'USD' },
      source: 'Kraken',
      series: [{ close: '102', volume: '12' }, { close: '105', volume: '15' }, { close: '107', volume: '18' }, { close: '108', volume: '21' }],
    });
    expect(result[0]?.changePercent).toBe('5.8824');
    expect(fetcher).toHaveBeenCalledTimes(result.length);
  });

  it('discovers additional USD pairs and loads a selected asset beyond the defaults', async () => {
    const fetcher = vi.fn(async (input: URL | RequestInfo) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/AssetPairs')) {
        return new Response(JSON.stringify({ error: [], result: {
          'DOGE/USD': { base: 'DOGE', quote: 'USD', status: 'online' },
          'ETH/EUR': { base: 'ETH', quote: 'EUR', status: 'online' },
        } }));
      }
      const pair = url.searchParams.get('pair');
      return new Response(JSON.stringify({ error: [], result: { [pair!]: candles } }));
    });
    const provider = new KrakenMarketDataProvider({ fetch: fetcher as typeof fetch });
    expect(await provider.listAssets()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'crypto:doge-usd', symbol: 'DOGE' }),
    ]));
    const candidates = await provider.getCandidates('daily', ['crypto:doge-usd']);
    expect(candidates.some((item) => item.asset.id === 'crypto:doge-usd')).toBe(true);
    expect(candidates.some((item) => item.asset.symbol === 'ETH/EUR')).toBe(false);
    expect(fetcher.mock.calls.some(([input]) => new URL(String(input)).searchParams.get('pair') === 'DOGE/USD')).toBe(true);
  });

  it('keeps default prices available when the asset catalog temporarily fails', async () => {
    const provider = new KrakenMarketDataProvider({ fetch: async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/AssetPairs')) return new Response('', { status: 503 });
      const pair = url.searchParams.get('pair');
      return new Response(JSON.stringify({ error: [], result: { [pair!]: candles } }));
    } });
    const candidates = await provider.getCandidates('daily', ['crypto:doge-usd']);
    expect(candidates.map((item) => item.asset.id)).toContain('crypto:btc-usd');
  });

  it('rejects malformed Kraken bars instead of inventing a price', async () => {
    const provider = new KrakenMarketDataProvider({ fetch: async () => new Response(JSON.stringify({ error: [], result: { 'BTC/USD': [[1, '0', '0', '0', 'garbage', '0', '0', 1]] } })) });
    await expect(provider.getCandidates('daily')).rejects.toMatchObject({ code: 'MARKET_DATA_UNAVAILABLE' } satisfies Partial<MarketDataError>);
  });

  it('derives liquidity from returned traded volume', async () => {
    const makeProvider = (scale: number) => new KrakenMarketDataProvider({ fetch: async (input) => {
      const pair = new URL(String(input)).searchParams.get('pair');
      const values = candles.map((bar) => [...bar.slice(0, 6), String(Number(bar[6]) * scale), bar[7]]);
      return new Response(JSON.stringify({ error: [], result: { [pair!]: values } }));
    } });
    const low = (await makeProvider(1).getCandidates('daily'))[0]!;
    const high = (await makeProvider(100).getCandidates('daily'))[0]!;
    expect(high.dimensions.liquidity).toBeGreaterThan(low.dimensions.liquidity);
  });

  it('uses Frankfurter published daily FX rate and date', async () => {
    const provider = new FrankfurterFxRateProvider({ fetch: async () => new Response(JSON.stringify({ date: '2026-09-28', base: 'USD', quote: 'TRY', rate: 43.21 })) });
    const result = await provider.getRates('USD', ['TRY']);
    expect(result).toMatchObject({ rates: { USD: '1', TRY: '43.21' }, provider: 'Frankfurter', observedAt: '2026-09-28T00:00:00.000Z', freshness: 'end-of-day' });
  });
});
