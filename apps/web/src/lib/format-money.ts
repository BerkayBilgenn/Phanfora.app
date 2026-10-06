export function formatMoney(value: number, currency: string) {
  const digits = value < 2 ? 4 : 2;
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `${value.toLocaleString('tr-TR', { maximumFractionDigits: digits })} ${currency}`;
  }
}
