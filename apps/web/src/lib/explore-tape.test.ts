import { describe, expect, it } from 'vitest';
import type { MarketCandidate } from '@phanfora/domain';
import { tapeHeadline, tapeLayout, tapeQuotes } from './explore-tape';

const quote = (symbol: string, amount: string, change: string, assetClass: MarketCandidate['asset']['assetClass'] = 'crypto'): MarketCandidate => ({
  asset: { id: symbol, symbol, name: symbol, assetClass, exchangeOrVenue: 'Test', quoteCurrency: 'USD', liquidityTier: 'high' },
  price: { amount, currency: 'USD' },
  changePercent: change,
  dimensions: { trend: 50, momentum: 50, liquidity: 50, riskFit: 50, marketConditions: 50 },
  volatility: 1,
  quality: { freshness: 'live', completeness: 1, integrity: 'verified' },
  marketStatus: 'open',
  series: [{ time: '2026-10-02T00:00:00.000Z', close: amount, volume: '1' }],
  source: 'Test',
  observedAt: '2026-10-02T00:00:00.000Z',
  snapshotId: 't',
  dataMode: 'live',
});

describe('explore tape', () => {
  it('maps each market to a feed layout', () => {
    expect(tapeLayout('forex')).toBe('book');
    expect(tapeLayout('tr')).toBe('board');
    expect(tapeLayout('crypto')).toBe('tape');
    expect(tapeLayout('us')).toBe('tape');
    expect(tapeLayout('commodity')).toBe('tape');
    expect(tapeLayout('all')).toBe('tape');
  });

  it('prints live symbols with price and signed change', () => {
    const rows = tapeQuotes([quote('BTC', '86420.5', '1.24'), quote('ETH', '2749.3', '-0.18')]);
    expect(rows).toEqual([
      { symbol: 'BTC', price: '86420.5 USD', change: '+1,24%', up: true },
      { symbol: 'ETH', price: '2749.3 USD', change: '-0,18%', up: false },
    ]);
  });

  it('names the cut after the venue, not a decoration', () => {
    expect(tapeHeadline('crypto')).toBe('Kraken · Binance');
    expect(tapeHeadline('forex')).toBe('Parite · resmi kur');
    expect(tapeHeadline('tr')).toBe('Borsa İstanbul');
    expect(tapeHeadline('us')).toBe('NASDAQ · NYSE');
    expect(tapeHeadline('commodity')).toBe('XAU · PAXG');
    expect(tapeHeadline('all')).toBe('Tüm kanallar');
  });
});
