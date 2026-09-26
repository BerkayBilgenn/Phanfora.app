'use client';

import { useId, useState } from 'react';

import type { Horizon, PricePoint } from '@phanfora/domain';

import { buildChartModel, simpleMovingAverage } from '../lib/chart-math';

interface MarketChartProps {
  name: string;
  horizon: Horizon;
  series: readonly PricePoint[];
  indicators?: readonly (20 | 50)[];
}

const horizonLabel: Record<Horizon, string> = {
  daily: 'günlük',
  weekly: 'haftalık',
  monthly: 'aylık',
};

const numberFormat = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 4 });
const dateFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Istanbul' });

function format(value: string | number) {
  return numberFormat.format(Number(value));
}

export function MarketChart({ name, horizon, series, indicators = [] }: MarketChartProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, series.length - 1));
  const model = buildChartModel(series, { width: 1000, height: 440 });
  const selected = series[selectedIndex] ?? series.at(-1);
  const first = series.at(0);
  const last = series.at(-1);
  const minimum = series.length ? Math.min(...series.map((point) => Number(point.low))) : 0;
  const maximum = series.length ? Math.max(...series.map((point) => Number(point.high))) : 0;
  const summary = `${name}: ${series.length} veri noktası, ilk kapanış ${format(first?.close ?? 0)}, son kapanış ${format(last?.close ?? 0)}, en düşük ${format(minimum)}, en yüksek ${format(maximum)}.`;
  const priceHeight = model.plot.bottom - model.plot.top;
  const toY = (value: number) => model.plot.top
    + ((model.priceDomain[1] - value) / (model.priceDomain[1] - model.priceDomain[0])) * priceHeight;
  const closes = series.map((point) => Number(point.close));

  if (series.length === 0) {
    return <section className="market-chart-empty" role="status">Bu varlık için gösterilebilir piyasa serisi yok.</section>;
  }

  return (
    <figure className="market-chart">
      <svg
        viewBox="0 0 1000 440"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        preserveAspectRatio="none"
      >
        <title id={titleId}>{name} {horizonLabel[horizon]} mum grafiği</title>
        <desc id={descriptionId}>{summary}</desc>
        {[0, 0.5, 1].map((ratio) => {
          const y = model.plot.top + (model.plot.bottom - model.plot.top) * ratio;
          const value = model.priceDomain[1] - (model.priceDomain[1] - model.priceDomain[0]) * ratio;
          return (
            <g key={ratio}>
              <line x1={model.plot.left} x2={model.plot.right} y1={y} y2={y} className="chart-grid" />
              <text x={model.plot.right + 8} y={y + 4} className="chart-axis-label">{format(value)}</text>
            </g>
          );
        })}

        {model.candles.map((candle) => (
          <g key={series[candle.index]?.time} className={candle.rising ? 'candle candle-up' : 'candle candle-down'}>
            <line x1={candle.x} x2={candle.x} y1={candle.highY} y2={candle.lowY} className="candle-wick" vectorEffect="non-scaling-stroke" />
            <rect
              x={candle.x - candle.width / 2}
              y={Math.min(candle.openY, candle.closeY)}
              width={candle.width}
              height={Math.max(1.5, Math.abs(candle.closeY - candle.openY))}
              className="candle-body"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={candle.x - candle.width / 2}
              y={candle.volumeY}
              width={candle.width}
              height={candle.volumeHeight}
              className="volume-bar"
            />
          </g>
        ))}

        {indicators.map((period) => {
          const averages = simpleMovingAverage(closes, period);
          const points = averages.flatMap((value, index) => {
            const candle = model.candles[index];
            return value === null || !candle ? [] : [`${candle.x},${toY(value)}`];
          }).join(' ');
          return points ? <polyline key={period} points={points} className={`sma-line sma-${period}`} vectorEffect="non-scaling-stroke" /> : null;
        })}
      </svg>

      <figcaption>{summary}</figcaption>
      <div className="sr-only" aria-label="Mum ayrıntıları">
        {series.map((point, index) => (
          <button key={point.time} type="button" onClick={() => setSelectedIndex(index)}>
            {dateFormat.format(new Date(point.time))} mumu
          </button>
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {selected ? `${dateFormat.format(new Date(selected.time))}. Açılış ${format(selected.open)}. Yüksek ${format(selected.high)}. Düşük ${format(selected.low)}. Kapanış ${format(selected.close)}. Hacim ${format(selected.volume)}.` : ''}
      </p>
    </figure>
  );
}
