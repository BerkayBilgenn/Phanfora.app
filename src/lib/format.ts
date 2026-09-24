export function normalizeLocalizedAmount(value: string, locale: 'tr-TR' | 'en-US') {
  const compact = value.trim().replace(/\s/g, '')
  const normalized =
    locale === 'tr-TR'
      ? compact.replace(/\./g, '').replace(',', '.')
      : compact.replace(/,/g, '')

  if (!/^(?!0+(?:\.0+)?$)\d+(?:\.\d{1,2})?$/.test(normalized)) return null
  return normalized
}

export function formatMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    signDisplay: 'always',
    maximumFractionDigits: 2,
  }).format(value / 100)
}
