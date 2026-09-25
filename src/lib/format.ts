export function normalizeLocalizedAmount(value: string, locale: 'tr-TR' | 'en-US') {
  const compact = value.trim().replace(/\s/g, '')
  if (!/^\d+[.,]?\d*(?:[.,]\d+)*$/.test(compact)) return null

  const decimalSeparator = locale === 'tr-TR' ? ',' : '.'
  const groupingSeparator = locale === 'tr-TR' ? '.' : ','
  const decimalCount = compact.split(decimalSeparator).length - 1
  const groupingCount = compact.split(groupingSeparator).length - 1
  let normalized: string

  if (decimalCount > 0 && groupingCount > 0) {
    const pattern = locale === 'tr-TR'
      ? /^\d{1,3}(?:\.\d{3})+,\d{1,2}$/
      : /^\d{1,3}(?:,\d{3})+\.\d{1,2}$/
    if (!pattern.test(compact)) return null
    normalized = compact.split(groupingSeparator).join('').replace(decimalSeparator, '.')
  } else if (decimalCount === 1) {
    if (!/^\d+[.,]\d{1,2}$/.test(compact)) return null
    normalized = compact.replace(decimalSeparator, '.')
  } else if (groupingCount === 1) {
    const fractionLength = compact.length - compact.indexOf(groupingSeparator) - 1
    if (fractionLength <= 2) normalized = compact.replace(groupingSeparator, '.')
    else if (/^\d{1,3}[.,]\d{3}$/.test(compact)) normalized = compact.replace(groupingSeparator, '')
    else return null
  } else if (groupingCount > 1) {
    const pattern = locale === 'tr-TR' ? /^\d{1,3}(?:\.\d{3})+$/ : /^\d{1,3}(?:,\d{3})+$/
    if (!pattern.test(compact)) return null
    normalized = compact.split(groupingSeparator).join('')
  } else {
    normalized = compact
  }

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
