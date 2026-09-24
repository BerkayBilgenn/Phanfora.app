import type { Locale } from '@/lib/copy'

type PricePoint = { time: string; value: number }

type PriceLineChartProps = {
  series: readonly PricePoint[]
  symbol: string
  locale: Locale
}

export function PriceLineChart({ series, symbol, locale }: PriceLineChartProps) {
  const values = series.map((point) => point.value).filter(Number.isFinite)
  const safeValues = values.length > 0 ? values : [0]
  const minimum = Math.min(...safeValues)
  const maximum = Math.max(...safeValues)
  const range = maximum - minimum || 1
  const width = 640
  const height = 220
  const points = safeValues.map((value, index) => {
    const x = safeValues.length === 1 ? width / 2 : (index / (safeValues.length - 1)) * width
    const y = height - ((value - minimum) / range) * height
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  const start = safeValues[0]
  const end = safeValues[safeValues.length - 1]
  const label = locale === 'tr-TR'
    ? `${symbol} fiyat grafiği, başlangıç ${number.format(start)}, bitiş ${number.format(end)}, minimum ${number.format(minimum)}, maksimum ${number.format(maximum)}`
    : `${symbol} price chart, start ${number.format(start)}, end ${number.format(end)}, minimum ${number.format(minimum)}, maximum ${number.format(maximum)}`

  return (
    <figure className="price-chart">
      <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="chart-edge-values numeric">
        <span>{number.format(start)}</span>
        <span>{number.format(end)}</span>
      </figcaption>
    </figure>
  )
}
