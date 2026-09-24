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
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
    const y = 54 - ((value - min) / range) * 44;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  const first = values.at(0) ?? 0;
  const last = values.at(-1) ?? 0;
  const direction = last >= first ? 'yukarı' : 'aşağı';

  return (
    <figure className="price-chart">
      <svg viewBox="0 0 100 60" role="img" aria-label={`${name} fiyat eğilimi`} preserveAspectRatio="none">
        <title>{name} fiyat eğilimi</title>
        <desc>Seri {first.toLocaleString('tr-TR')} seviyesinden {last.toLocaleString('tr-TR')} seviyesine {direction} hareket etti.</desc>
        <line x1="0" y1="10" x2="100" y2="10" className="chart-grid" />
        <line x1="0" y1="32" x2="100" y2="32" className="chart-grid" />
        <line x1="0" y1="54" x2="100" y2="54" className="chart-grid" />
        <polyline points={points} className="chart-line" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption>{name}, gösterilen dönemde genel olarak {direction} yönlü hareket etti. En düşük {min.toLocaleString('tr-TR')}, en yüksek {max.toLocaleString('tr-TR')}.</figcaption>
    </figure>
  );
}
