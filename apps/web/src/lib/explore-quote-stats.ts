import type { MarketCandidate } from '@phanfora/domain';

export type QuoteStat = { label: string; value: string };

function finite(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: value < 2 ? 4 : 2 }).format(value);
  } catch {
    return `${value.toLocaleString('tr-TR', { maximumFractionDigits: value < 2 ? 4 : 2 })} ${currency}`;
  }
}

function seriesRange(item: MarketCandidate) {
  let high = Number.NEGATIVE_INFINITY;
  let low = Number.POSITIVE_INFINITY;
  for (const bar of item.series) {
    const close = finite(bar.close);
    const peak = finite(bar.high) ?? close;
    const trough = finite(bar.low) ?? close;
    if (peak != null) high = Math.max(high, peak);
    if (trough != null) low = Math.min(low, trough);
  }
  if (!Number.isFinite(high) || !Number.isFinite(low)) return null;
  return { high, low };
}

export function exploreQuoteStats(item: MarketCandidate): QuoteStat[] {
  const rows: QuoteStat[] = [];
  const range = seriesRange(item);
  if (range) {
    rows.push({ label: 'Yüksek', value: money(range.high, item.asset.quoteCurrency) });
    rows.push({ label: 'Düşük', value: money(range.low, item.asset.quoteCurrency) });
  }
  const volume = finite(item.series.at(-1)?.volume);
  if (volume != null && volume > 0) {
    rows.push({ label: 'Hacim', value: volume.toLocaleString('tr-TR') });
  }
  if (Number.isFinite(item.volatility)) {
    rows.push({ label: 'Oynaklık', value: `${item.volatility.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%` });
  }
  if (item.source) rows.push({ label: 'Kaynak', value: item.source });
  const observed = Date.parse(item.observedAt);
  if (Number.isFinite(observed)) {
    rows.push({
      label: 'Gözlem',
      value: new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(observed),
    });
  }
  return rows;
}
