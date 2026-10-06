import { describe, expect, it } from 'vitest';
import type { MarketCandidate } from '@phanfora/domain';
import { radarLeaders, radarPoints } from './radar-plot';

function quote(id: string, change: string): MarketCandidate {
  return {
    asset: { id, symbol: id.slice(-3).toUpperCase(), name: id, assetClass: 'crypto', exchangeOrVenue: 'Test', quoteCurrency: 'USD', liquidityTier: 'high' },
    price: { amount: '10', currency: 'USD' },
    changePercent: change,
    dimensions: { trend: 50, momentum: 50, liquidity: 50, riskFit: 50, marketConditions: 50 },
    volatility: 1,
    quality: { freshness: 'live', completeness: 1, integrity: 'verified' },
    marketStatus: 'open',
    series: [{ time: '2026-10-02T00:00:00.000Z', close: '10', volume: '1' }],
    source: 'Test',
    observedAt: '2026-10-02T00:00:00.000Z',
    snapshotId: 't',
    dataMode: 'live',
  };
}

describe('radarPoints', () => {
  it('places gainers farther from center than flat quotes and keeps coordinates stable', () => {
    const flat = radarPoints([quote('crypto:aaa', '0')])[0];
    const up = radarPoints([quote('crypto:aaa', '12')])[0];
    const again = radarPoints([quote('crypto:aaa', '12')])[0];
    expect(up.up).toBe(true);
    expect(Math.hypot(up.x, up.y)).toBeGreaterThan(Math.hypot(flat.x, flat.y));
    expect(again).toEqual(up);
  });

  it('spreads a full book across the disc instead of clustering in the middle', () => {
    const points = radarPoints(Array.from({ length: 12 }, (_, index) => quote(`crypto:a${index}`, String(index))));
    const radii = points.map((point) => Math.hypot(point.x, point.y));
    expect(Math.min(...radii)).toBeLessThan(0.45);
    expect(Math.max(...radii)).toBeGreaterThan(0.75);
    expect(points.every((point) => point.label.length > 0)).toBe(true);
  });

  it('separates assets around the field instead of stacking them', () => {
    const points = radarPoints([quote('crypto:btc', '2'), quote('stock:aapl', '-3')]);
    expect(points[1].up).toBe(false);
    expect(Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)).toBeGreaterThan(0.2);
  });
});

describe('radarLeaders', () => {
  it('returns the three strongest weekly gainers and losers without mixing them', () => {
    const board = [
      quote('crypto:ada', '12'),
      quote('crypto:sol', '8'),
      quote('crypto:xrp', '5'),
      quote('crypto:btc', '0'),
      quote('stock:sise', '-1'),
      quote('stock:aapl', '-3'),
      quote('stock:thy', '-6'),
    ];
    const { gainers, losers } = radarLeaders(board);
    expect(gainers.map((item) => item.asset.symbol)).toEqual(['ADA', 'SOL', 'XRP']);
    expect(losers.map((item) => item.asset.symbol)).toEqual(['THY', 'APL', 'ISE']);
  });
});
