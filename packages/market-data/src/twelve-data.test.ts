import { describe, expect, it, vi } from 'vitest';

import { MarketDataError, TwelveDataProvider } from './twelve-data';

const values = [
  { datetime: '2026-09-24 12:00:00', open: '108', high: '112', low: '107', close: '110', volume: '1200' },
  { datetime: '2026-09-24 11:45:00', open: '99', high: '108', low: '98', close: '100', volume: '1000' },
  { datetime: '2026-09-24 11:30:00', open: '96', high: '101', low: '95', close: '98', volume: '900' },
];

const symbols = ['BTC/USD', 'ETH/USD', 'AAPL', 'MSFT', 'EUR/USD', 'XAU/USD'] as const;

function success(symbol: string) {
  return {
    meta: {
      symbol,
      interval: '15min',
      currency: symbol.includes('/') ? undefined : 'USD',
      currency_quote: symbol.includes('/') ? 'US Dollar' : undefined,
      exchange: symbol.includes('/') ? 'Global' : 'NASDAQ',
      type: symbol.includes('/') ? 'Digital Currency' : 'Common Stock',
    },
    values,
    status: 'ok',
  };
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function provider(fetcher: typeof fetch, clock = () => '2026-09-24T12:05:00.000Z') {
  return new TwelveDataProvider({
    apiKey: 'server-only-test-key',
    fetch: fetcher,
    clock,
    ttlMs: 60_000,
  });
}

describe('TwelveDataProvider market data', () => {
  it('normalizes newest-first batch series and returns the live free universe', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(
      Object.fromEntries(symbols.map((symbol) => [symbol, success(symbol)])),
    ));

    const candidates = await provider(fetcher).getCandidates('daily');

    expect(candidates).toHaveLength(6);
    expect(new Set(candidates.map(({ asset }) => asset.assetClass))).toEqual(
      new Set(['crypto', 'stock', 'forex', 'commodity']),
    );
    expect(candidates[0]).toMatchObject({
      asset: { id: 'crypto:btc-usd', symbol: 'BTC', quoteCurrency: 'USD' },
      price: { amount: '110', currency: 'USD' },
      changePercent: '10.0000',
      source: 'Twelve Data',
      dataMode: 'live',
      quality: { freshness: 'live', integrity: 'verified' },
    });
    expect(candidates[0]?.series.map(({ close }) => close)).toEqual(['98', '100', '110']);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const requested = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(requested.pathname).toBe('/time_series');
    expect(requested.searchParams.get('symbol')).toBe(symbols.join(','));
    expect(requested.searchParams.get('interval')).toBe('15min');
    expect(requested.searchParams.get('outputsize')).toBe('48');
  });

  it('keeps valid symbols when a batch member is unavailable', async () => {
    const payload: Record<string, unknown> = Object.fromEntries(
      symbols.map((symbol) => [symbol, success(symbol)]),
    );
    payload['MSFT'] = { status: 'error', code: 403, message: 'plan access denied' };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(payload));

    const candidates = await provider(fetcher).getCandidates('weekly');

    expect(candidates).toHaveLength(5);
    expect(candidates.some(({ asset }) => asset.symbol === 'MSFT')).toBe(false);
    expect(new URL(String(fetcher.mock.calls[0]?.[0])).searchParams.get('interval')).toBe('1h');
  });

  it('coalesces concurrent requests and reuses successful data inside the TTL', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(
      Object.fromEntries(symbols.map((symbol) => [symbol, success(symbol)])),
    ));
    const live = provider(fetcher);

    const [first, second] = await Promise.all([
      live.getCandidates('daily'),
      live.getCandidates('daily'),
    ]);
    const third = await live.getCandidates('daily');

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('sanitizes rate limits and upstream failures', async () => {
    const limited = provider(vi.fn<typeof fetch>().mockResolvedValue(response({
      status: 'error', code: 429, message: 'credits exhausted for secret account',
    }, 429)));
    const unavailable = provider(vi.fn<typeof fetch>().mockRejectedValue(new Error('socket leaked secret')));

    await expect(limited.getCandidates('daily')).rejects.toMatchObject({
      name: 'MarketDataError', code: 'MARKET_DATA_RATE_LIMITED',
    });
    await expect(unavailable.getCandidates('daily')).rejects.toMatchObject({
      name: 'MarketDataError', code: 'MARKET_DATA_UNAVAILABLE',
    });
    await expect(unavailable.getCandidates('daily')).rejects.not.toThrow('socket leaked secret');
  });
});

describe('TwelveDataProvider FX rates', () => {
  it('returns identity USD without an external request', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const snapshot = await provider(fetcher).getRates('USD', ['USD']);

    expect(snapshot.rates).toEqual({ USD: '1' });
    expect(snapshot.dataMode).toBe('live');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fetches only the requested USD cross and caches it', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({
      symbol: 'USD/TRY', rate: 42.75, timestamp: 1790251200,
    }));
    const live = provider(fetcher);

    const first = await live.getRates('USD', ['TRY']);
    const second = await live.getRates('USD', ['TRY']);

    expect(first.rates).toEqual({ USD: '1', TRY: '42.75' });
    expect(first.provider).toBe('Twelve Data');
    expect(second).toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const requested = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(requested.pathname).toBe('/exchange_rate');
    expect(requested.searchParams.get('symbol')).toBe('USD/TRY');
  });

  it('rejects unsupported or missing quote currencies without fixture rates', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({
      status: 'error', code: 400, message: 'invalid symbol',
    }));
    const live = provider(fetcher);

    await expect(live.getRates('USD', [])).rejects.toEqual(
      new MarketDataError('FX_RATE_UNAVAILABLE'),
    );
    await expect(live.getRates('USD', ['ZZZ'])).rejects.toMatchObject({
      code: 'FX_RATE_UNAVAILABLE',
    });
  });
});
