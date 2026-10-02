import type { PricePoint } from '@phanfora/domain';

interface PriceChartProps {
  name: string;
  series: readonly PricePoint[];
}

export function PriceChart({ name, series }: PriceChartProps) {
  const values = series.map((point) => Number(point.close));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 400;
  const top = 16;
  const bottom = 144;
  const coords = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
    const y = bottom - ((value - min) / range) * (bottom - top);
    return { x, y };
  });
  const points = coords.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  const firstPoint = coords[0];
  const lastPoint = coords.at(-1);
  const area = firstPoint && lastPoint
    ? `${points} ${lastPoint.x.toFixed(2)},${bottom} ${firstPoint.x.toFixed(2)},${bottom}`
    : '';
  const first = values.at(0) ?? 0;
  const last = values.at(-1) ?? 0;
  const direction = last >= first ? 'yukarı' : 'aşağı';

  return (
    <figure className="price-chart">
      <svg viewBox="0 0 400 160" role="img" aria-label={`${name} fiyat eğilimi`} preserveAspectRatio="none">
        <title>{name} fiyat eğilimi</title>
        <desc>Seri {first.toLocaleString('tr-TR')} seviyesinden {last.toLocaleString('tr-TR')} seviyesine {direction} hareket etti.</desc>
        <line x1="0" y1="16" x2="400" y2="16" className="chart-grid" />
        <line x1="0" y1="80" x2="400" y2="80" className="chart-grid" />
        <line x1="0" y1="144" x2="400" y2="144" className="chart-grid" />
        {area && <polygon points={area} className="chart-fill" />}
        <polyline points={points} className="chart-line" />
      </svg>
      <figcaption>{name}, gösterilen dönemde genel olarak {direction} yönlü hareket etti. En düşük {min.toLocaleString('tr-TR')}, en yüksek {max.toLocaleString('tr-TR')}.</figcaption>
    </figure>
  );
}
