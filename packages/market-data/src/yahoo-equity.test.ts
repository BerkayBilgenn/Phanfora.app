import { describe, expect, it, vi } from 'vitest';
import { YahooDelayedEquityProvider, MarketDataError } from './index';

const chart = {
  chart: {
    result: [{
      meta: { currency: 'USD', exchangeName: 'NMS', symbol: 'AAPL', regularMarketPrice: 108 },
      timestamp: [1_780_000_000, 1_780_000_900, 1_780_001_800, 1_780_002_700],
      indicators: {
        quote: [{
          open: [100, 102, 105, 107],
          high: [103, 106, 108, 109],
          low: [99, 101, 104, 105],
          close: [102, 105, 107, 108],
          volume: [12, 15, 18, 21],
        }],
      },
    }],
    error: null,
  },
};

describe('YahooDelayedEquityProvider', () => {
  it('maps delayed US and BIST chart bars without inventing prices', async () => {
    const fetcher = vi.fn(async (input: URL | RequestInfo) => {
      const url = new URL(String(input));
      expect(url.hostname).toBe('query1.finance.yahoo.com');
      expect(url.pathname).toMatch(/\/v8\/finance\/chart\//);
      return new Response(JSON.stringify(chart), { status: 200 });
    });
    const provider = new YahooDelayedEquityProvider({ fetch: fetcher, clock: () => '2026-06-01T12:00:00.000Z' });
    const quotes = await provider.getCandidates('daily');
    const apple = quotes.find((item) => item.asset.symbol === 'AAPL');
    const thy = quotes.find((item) => item.asset.symbol === 'THYAO');
    expect(apple?.price.amount).toBe('108');
    expect(apple?.asset.exchangeOrVenue).toBe('NASDAQ');
    expect(apple?.source).toBe('Yahoo Finance');
    expect(apple?.dataMode).not.toBe('live');
    expect(thy?.asset.exchangeOrVenue).toMatch(/İstanbul|Istanbul|BIST|XIST/i);
    expect(fetcher).toHaveBeenCalled();
  });

  it('does not invent a quote when Yahoo returns an empty chart', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ chart: { result: [], error: null } }), { status: 200 }));
    const provider = new YahooDelayedEquityProvider({ fetch: fetcher, clock: () => '2026-06-01T12:00:00.000Z' });
    await expect(provider.getCandidates('daily')).rejects.toBeInstanceOf(MarketDataError);
  });
});
