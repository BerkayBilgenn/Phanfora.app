import type {
  CanonicalAsset,
  DataMode,
  Freshness,
  Horizon,
  MarketCandidate,
  MarketStatus,
  PricePoint,
} from '@phanfora/domain';
import { MarketDataError } from './twelve-data';

const BAR_COUNT: Record<Horizon, number> = { daily: 97, weekly: 169, monthly: 31 };

function score(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function number(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
  return parsed;
}

export function freshnessFromAge(horizon: Horizon, observedAt: string, now: string): Freshness {
  const age = Date.parse(now) - Date.parse(observedAt);
  const INTERVAL: Record<Horizon, number> = { daily: 15, weekly: 60, monthly: 1440 };
  if (horizon === 'monthly') return age <= 72 * 3600_000 ? 'end-of-day' : 'stale';
  return age <= INTERVAL[horizon] * 60_000 * 2 ? 'live' : age <= 72 * 3600_000 ? 'delayed' : 'stale';
}

export function dataModeFromFreshness(freshness: Freshness): DataMode {
  if (freshness === 'live') return 'live';
  if (freshness === 'end-of-day' || freshness === 'fixture') return freshness === 'fixture' ? 'fixture' : 'end-of-day';
  return 'delayed';
}

export function candidateFromOhlc(options: {
  asset: CanonicalAsset;
  bars: readonly { time: string; open: string; high: string; low: string; close: string; volume: string }[];
  horizon: Horizon;
  now: string;
  source: string;
  snapshotPrefix: string;
  marketStatus: MarketStatus;
}): MarketCandidate {
  const { asset, horizon, now, source, snapshotPrefix, marketStatus } = options;
  const series: PricePoint[] = options.bars.map((bar) => {
    const values = [bar.open, bar.high, bar.low, bar.close, bar.volume].map(number);
    if (
      values[2]! > values[1]!
      || values[0]! < values[2]!
      || values[0]! > values[1]!
      || values[3]! < values[2]!
      || values[3]! > values[1]!
      || values[4]! < 0
      || values[3]! <= 0
    ) {
      throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    }
    return { time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume };
  });
  if (series.length < 4) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
  const first = number(series[0]?.close);
  const previous = number(series.at(-2)?.close);
  const current = number(series.at(-1)?.close);
  const change = ((current - first) / first) * 100;
  const momentumChange = ((current - previous) / previous) * 100;
  const trendChange = ((current - first) / first) * 100;
  const returns = series.slice(1).map((point, index) => (number(point.close) / number(series[index]?.close) - 1) * 100);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const intervalMinutes = horizon === 'daily' ? 15 : horizon === 'weekly' ? 60 : 1440;
  const volatility = Math.sqrt(returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length)
    * Math.sqrt(365 * 24 * 60 / intervalMinutes);
  const averageTurnover = series.reduce((sum, point) => sum + number(point.close) * number(point.volume), 0) / series.length;
  const observedAt = series.at(-1)!.time;
  const freshness = freshnessFromAge(horizon, observedAt, now);
  return {
    asset,
    price: { amount: series.at(-1)!.close, currency: asset.quoteCurrency },
    changePercent: change.toFixed(4),
    dimensions: {
      trend: score(50 + trendChange * 4),
      momentum: score(50 + momentumChange * 5),
      liquidity: score(10 + Math.log10(1 + averageTurnover) * 10),
      riskFit: score(100 - volatility * 1.5),
      marketConditions: score((trendChange + momentumChange) / 2 + 50),
    },
    volatility: Number(volatility.toFixed(2)),
    quality: { freshness, completeness: Math.min(1, series.length / BAR_COUNT[horizon]), integrity: 'verified' },
    marketStatus,
    series,
    source,
    observedAt,
    snapshotId: `${snapshotPrefix}:${asset.symbol}:${observedAt}`,
    dataMode: dataModeFromFreshness(freshness),
  };
}
