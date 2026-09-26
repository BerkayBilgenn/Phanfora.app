import type { PricePoint } from '@phanfora/domain';

export interface ChartSize {
  width: number;
  height: number;
}

export interface CandleGeometry {
  index: number;
  x: number;
  width: number;
  openY: number;
  highY: number;
  lowY: number;
  closeY: number;
  volumeY: number;
  volumeHeight: number;
  rising: boolean;
}

export interface ChartModel {
  candles: readonly CandleGeometry[];
  priceDomain: readonly [number, number];
  volumeMax: number;
  plot: { left: number; top: number; right: number; bottom: number; volumeTop: number };
}

export function simpleMovingAverage(values: readonly number[], period: number): readonly (number | null)[] {
  if (!Number.isInteger(period) || period < 1) return values.map(() => null);
  let sum = 0;
  return values.map((value, index) => {
    sum += value;
    if (index >= period) sum -= values[index - period] ?? 0;
    return index >= period - 1 ? sum / period : null;
  });
}

export function buildChartModel(series: readonly PricePoint[], size: ChartSize): ChartModel {
  const plot = {
    left: 52,
    top: 18,
    right: Math.max(53, size.width - 54),
    bottom: Math.max(19, size.height * 0.7),
    volumeTop: Math.max(20, size.height * 0.78),
  };
  const lows = series.map((point) => Number(point.low));
  const highs = series.map((point) => Number(point.high));
  const volumes = series.map((point) => Number(point.volume));
  const rawMin = lows.length ? Math.min(...lows) : 0;
  const rawMax = highs.length ? Math.max(...highs) : 1;
  const rawRange = rawMax - rawMin;
  const safeRange = Math.max(rawRange, Math.abs(rawMax) * 0.01, 1e-8);
  const padding = safeRange * 0.02;
  const priceDomain = [rawMin - padding, rawMax + padding] as const;
  const priceRange = priceDomain[1] - priceDomain[0];
  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;
  const volumeBottom = Math.max(plot.volumeTop + 1, size.height - 24);
  const volumeMax = Math.max(...volumes, 1);
  const slot = plotWidth / Math.max(series.length, 1);

  const priceY = (value: number) => plot.top + ((priceDomain[1] - value) / priceRange) * plotHeight;
  const candles = series.map((point, index): CandleGeometry => {
    const volumeHeight = (Number(point.volume) / volumeMax) * (volumeBottom - plot.volumeTop);
    return Object.freeze({
      index,
      x: plot.left + slot * (index + 0.5),
      width: Math.max(2, Math.min(12, slot * 0.62)),
      openY: priceY(Number(point.open)),
      highY: priceY(Number(point.high)),
      lowY: priceY(Number(point.low)),
      closeY: priceY(Number(point.close)),
      volumeY: volumeBottom - volumeHeight,
      volumeHeight,
      rising: Number(point.close) >= Number(point.open),
    });
  });

  return Object.freeze({
    candles: Object.freeze(candles),
    priceDomain,
    volumeMax,
    plot: Object.freeze(plot),
  });
}
