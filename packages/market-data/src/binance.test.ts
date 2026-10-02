import { describe, expect, it, vi } from 'vitest';
import { BinanceMarketDataProvider, MarketDataError } from './index';

const klines = [
  [1_780_000_000_000, '100', '103', '99', '102', '12'],
  [1_780_000_900_000, '102', '106', '101', '105', '15'],
  [1_780_001_800_000, '105', '108', '104', '107', '18'],
  [1_780_002_700_000, '107', '109', '105', '108', '21'],
];

describe('BinanceMarketDataProvider', () => {
  it('maps public klines into live USDT-quoted candidates', async () => {
    const fetcher = vi.fn(async (input: URL | RequestInfo) => {
      const url = new URL(String(input));
      expect(url.hostname).toBe('api.binance.com');
      expect(url.pathname).toBe('/api/v3/klines');
      expect(url.searchParams.get('interval')).toBe('15m');
      return new Response(JSON.stringify(klines), { status: 200 });
    });
    const provider = new BinanceMarketDataProvider({
      fetch: fetcher as typeof fetch,
      clock: () => '2026-05-28T08:20:00.000Z',
    });
    const result = await provider.getCandidates('daily');
    expect(result.some((item) => item.asset.assetClass === 'crypto')).toBe(true);
    expect(result.some((item) => item.asset.assetClass === 'forex')).toBe(true);
    expect(result.some((item) => item.asset.assetClass === 'commodity')).toBe(true);
    const bnb = result.find((item) => item.asset.symbol === 'BNB');
    expect(bnb).toMatchObject({
      price: { amount: '108', currency: 'USDT' },
      source: 'Binance',
      dataMode: 'live',
      quality: { freshness: 'live' },
    });
    expect(bnb?.changePercent).toBe('5.8824');
  });

  it('rejects inverted candles instead of inventing a close', async () => {
    const provider = new BinanceMarketDataProvider({
      fetch: async () => new Response(JSON.stringify([[1, '10', '9', '8', '10', '1']]), { status: 200 }),
    });
    await expect(provider.getCandidates('daily')).rejects.toMatchObject({
      code: 'MARKET_DATA_UNAVAILABLE',
    } satisfies Partial<MarketDataError>);
  });
});
