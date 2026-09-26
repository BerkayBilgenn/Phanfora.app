import { describe, expect, it } from 'vitest';

import type { PricePoint } from '@phanfora/domain';

import { buildChartModel, simpleMovingAverage } from './chart-math';

function candle(open: string, high: string, low: string, close: string, volume: string): PricePoint {
  return { time: '2026-09-24T12:00:00.000Z', open, high, low, close, volume };
}

describe('chart math', () => {
  it('calculates a simple moving average only after a full period', () => {
    expect(simpleMovingAverage([10, 20, 30, 40], 3)).toEqual([null, null, 20, 30]);
  });

  it('builds finite candle geometry for flat prices and zero volume', () => {
    const flat = buildChartModel([
      candle('10', '10', '10', '10', '0'),
      candle('10', '10', '10', '10', '0'),
    ], { width: 800, height: 360 });

    expect(flat.candles.every((item) => Object.entries(item)
      .filter(([key]) => key !== 'rising')
      .every(([, value]) => Number.isFinite(value)))).toBe(true);
    expect(flat.priceDomain[1]).toBeGreaterThan(flat.priceDomain[0]);
    expect(flat.volumeMax).toBe(1);
  });

  it('maps real highs, lows and volumes into the plot bounds', () => {
    const model = buildChartModel([
      candle('98', '102', '97', '101', '900'),
      candle('101', '104', '99', '100', '1200'),
    ], { width: 800, height: 360 });

    expect(model.candles).toHaveLength(2);
    expect(model.priceDomain[0]).toBeLessThan(97);
    expect(model.priceDomain[1]).toBeGreaterThan(104);
    expect(model.volumeMax).toBe(1200);
    expect(model.candles[0]?.highY).toBeLessThan(model.candles[0]?.lowY ?? 0);
  });
});
