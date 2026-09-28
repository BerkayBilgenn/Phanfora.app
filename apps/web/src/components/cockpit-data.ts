export function formatDecimal(value: number, digits = 2) {
  return value.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
