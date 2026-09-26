import { listCurrencies } from '@phanfora/currency';
import type {
  AssetClass,
  AssetSeries,
  CanonicalAsset,
  CurrencyDefinition,
  DataMode,
  DimensionScores,
  Freshness,
  FxRateSnapshot,
  Horizon,
  MarketCandidate,
  MarketOverview,
  MarketStatus,
  PricePoint,
} from '@phanfora/domain';

import type { FxRateProvider, MarketDataProvider } from './index';

export type MarketDataErrorCode =
  | 'MARKET_DATA_NOT_CONFIGURED'
  | 'MARKET_DATA_RATE_LIMITED'
  | 'MARKET_DATA_UNAVAILABLE'
  | 'FX_RATE_UNAVAILABLE';

export class MarketDataError extends Error {
  override readonly name = 'MarketDataError';

  constructor(readonly code: MarketDataErrorCode) {
    super(code);
  }
}

interface TwelveDataProviderOptions {
  apiKey: string;
  fetch?: typeof fetch;
  clock?: () => string;
  ttlMs?: number;
}

interface TwelveDataValue {
  datetime: string;
  open?: string;
  high?: string;
  low?: string;
  close: string;
  volume?: string;
}

interface TwelveDataSeries {
  status?: string;
  code?: number;
  message?: string;
  meta?: {
    symbol?: string;
    exchange?: string;
    currency?: string;
    currency_quote?: string;
  };
  values?: TwelveDataValue[];
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

interface LiveAsset extends CanonicalAsset {
  providerSymbol: string;
}

const LIVE_ASSETS = Object.freeze([
  { id: 'crypto:btc-usd', providerSymbol: 'BTC/USD', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', exchangeOrVenue: 'Binance', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'crypto:eth-usd', providerSymbol: 'ETH/USD', symbol: 'ETH', name: 'Ethereum', assetClass: 'crypto', exchangeOrVenue: 'Binance', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'stock:aapl-xnas', providerSymbol: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'stock:msft-xnas', providerSymbol: 'MSFT', symbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'forex:eur-usd', providerSymbol: 'EUR/USD', symbol: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'forex', exchangeOrVenue: 'Global FX', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'commodity:xau-usd', providerSymbol: 'XAU/USD', symbol: 'XAU', name: 'Gold Spot', assetClass: 'commodity', exchangeOrVenue: 'Global spot', quoteCurrency: 'USD', liquidityTier: 'high' },
] satisfies readonly LiveAsset[]);

const horizonRequest = Object.freeze({
  daily: { interval: '15min', outputsize: '48' },
  weekly: { interval: '1h', outputsize: '60' },
  monthly: { interval: '1day', outputsize: '90' },
} satisfies Record<Horizon, { interval: string; outputsize: string }>);

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function toIso(datetime: string) {
  const normalized = datetime.includes('T') ? datetime : datetime.replace(' ', 'T');
  const parsed = new Date(normalized.endsWith('Z') ? normalized : `${normalized}Z`);
  if (Number.isNaN(parsed.valueOf())) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
  return parsed.toISOString();
}

function freshnessFor(horizon: Horizon, observedAt: string, now: string): Freshness {
  const ageMs = Math.max(0, Date.parse(now) - Date.parse(observedAt));
  const hour = 60 * 60 * 1000;
  if (horizon === 'monthly') return ageMs <= 72 * hour ? 'end-of-day' : 'stale';
  if (horizon === 'weekly') {
    if (ageMs <= 2 * hour) return 'live';
    return ageMs <= 72 * hour ? 'delayed' : 'stale';
  }
  if (ageMs <= 30 * 60 * 1000) return 'live';
  return ageMs <= 48 * hour ? 'delayed' : 'stale';
}

function dataModeFor(freshness: Freshness): DataMode {
  if (freshness === 'live') return 'live';
  if (freshness === 'end-of-day') return 'end-of-day';
  return 'delayed';
}

function marketStatusFor(assetClass: AssetClass): MarketStatus {
  if (assetClass === 'crypto') return 'continuous';
  if (assetClass === 'forex') return 'open';
  return 'unknown';
}

function percentageChange(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
  }
  return ((current - previous) / previous) * 100;
}

export function assertValidCandle(point: PricePoint): void {
  const open = Number(point.open);
  const high = Number(point.high);
  const low = Number(point.low);
  const close = Number(point.close);
  const volume = Number(point.volume);
  if ([open, high, low, close, volume].some((value) => !Number.isFinite(value))
    || volume < 0
    || low > high
    || open < low
    || open > high
    || close < low
    || close > high) {
    throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
  }
}

function volatility(closes: readonly number[]) {
  if (closes.length < 3) return 100;
  const returns = closes.slice(1).map((close, index) => percentageChange(close, closes[index] ?? close));
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252);
}

function deriveDimensions(closes: readonly number[], assetClass: AssetClass): DimensionScores {
  const first = closes[0];
  const previous = closes.at(-2);
  const current = closes.at(-1);
  if (first === undefined || previous === undefined || current === undefined) {
    throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
  }
  const trendChange = percentageChange(current, first);
  const momentumChange = percentageChange(current, previous);
  const measuredVolatility = volatility(closes);
  const trend = Math.round(clamp(50 + trendChange * 4));
  const momentum = Math.round(clamp(50 + momentumChange * 5));
  const liquidity = assetClass === 'commodity' ? 91 : 96;
  const riskFit = Math.round(clamp(100 - measuredVolatility * 1.5));
  const marketConditions = Math.round(clamp((trend + momentum) / 2));
  return Object.freeze({ trend, momentum, liquidity, riskFit, marketConditions });
}

function freezeAsset(asset: LiveAsset): CanonicalAsset {
  const { providerSymbol: _providerSymbol, ...canonical } = asset;
  return Object.freeze(canonical);
}

function errorFromStatus(status: number | undefined, code: number | undefined) {
  if (status === 429 || code === 429) return new MarketDataError('MARKET_DATA_RATE_LIMITED');
  return new MarketDataError('MARKET_DATA_UNAVAILABLE');
}

export class TwelveDataProvider implements MarketDataProvider, FxRateProvider {
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;
  private readonly clock: () => string;
  private readonly ttlMs: number;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly pending = new Map<string, Promise<unknown>>();

  constructor(options: TwelveDataProviderOptions) {
    if (!options.apiKey.trim()) throw new MarketDataError('MARKET_DATA_NOT_CONFIGURED');
    this.apiKey = options.apiKey;
    this.fetcher = options.fetch ?? fetch;
    this.clock = options.clock ?? (() => new Date().toISOString());
    this.ttlMs = options.ttlMs ?? 60_000;
  }

  async listAssets(): Promise<readonly CanonicalAsset[]> {
    return Object.freeze(LIVE_ASSETS.map(freezeAsset));
  }

  async getAsset(id: string): Promise<CanonicalAsset> {
    const asset = LIVE_ASSETS.find((candidate) => candidate.id === id);
    if (!asset) throw new Error('ASSET_NOT_FOUND');
    return freezeAsset(asset);
  }

  async getSeries(id: string, horizon: Horizon): Promise<AssetSeries> {
    const asset = await this.getAsset(id);
    const candidate = (await this.getCandidates(horizon)).find((item) => item.asset.id === id);
    if (!candidate) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    return Object.freeze({
      asset,
      horizon,
      series: candidate.series,
      source: candidate.source,
      observedAt: candidate.observedAt,
      freshness: candidate.quality.freshness,
      dataMode: candidate.dataMode,
      quality: candidate.quality,
    });
  }

  async getOverview(): Promise<MarketOverview> {
    const candidates = await this.getCandidates('daily');
    const counts: Record<AssetClass, number> = { stock: 0, crypto: 0, commodity: 0, forex: 0, index: 0 };
    for (const candidate of candidates) counts[candidate.asset.assetClass] += 1;
    const first = candidates[0];
    if (!first) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const observedAt = candidates.reduce(
      (latest, candidate) => candidate.observedAt > latest ? candidate.observedAt : latest,
      first.observedAt,
    );
    return Object.freeze({
      assetCount: candidates.length,
      byAssetClass: Object.freeze(counts),
      provider: first.source,
      dataMode: first.dataMode,
      observedAt,
    });
  }

  async listCurrencies(locale: string): Promise<readonly CurrencyDefinition[]> {
    return listCurrencies(locale);
  }

  async getCandidates(horizon: Horizon): Promise<readonly MarketCandidate[]> {
    return this.cached(`market:${horizon}`, async () => {
      const request = horizonRequest[horizon];
      const url = this.url('/time_series', {
        symbol: LIVE_ASSETS.map(({ providerSymbol }) => providerSymbol).join(','),
        interval: request.interval,
        outputsize: request.outputsize,
        timezone: 'UTC',
        format: 'JSON',
      });
      const payload = await this.request<Record<string, TwelveDataSeries>>(url);
      const now = this.clock();
      const candidates = LIVE_ASSETS.flatMap((asset) => {
        const series = payload[asset.providerSymbol];
        if (!series || series.status === 'error' || !series.values || series.values.length < 3) return [];
        let normalized: readonly PricePoint[];
        try {
          normalized = [...series.values].reverse().map((point): PricePoint => {
            const candle = Object.freeze({
              time: toIso(point.datetime),
              open: point.open ?? '',
              high: point.high ?? '',
              low: point.low ?? '',
              close: point.close,
              volume: point.volume ?? '0',
            });
            assertValidCandle(candle);
            return candle;
          });
        } catch (error) {
          if (error instanceof MarketDataError) return [];
          throw error;
        }
        const latest = normalized.at(-1);
        const previous = normalized.at(-2);
        if (!latest || !previous) return [];
        const closes = normalized.map(({ close }) => Number(close));
        if (closes.some((value) => !Number.isFinite(value))) return [];
        const observedAt = latest.time;
        const freshness = freshnessFor(horizon, observedAt, now);
        const naturalAsset = freezeAsset(asset);
        const candidate: MarketCandidate = Object.freeze({
          asset: naturalAsset,
          price: Object.freeze({ amount: latest.close, currency: naturalAsset.quoteCurrency }),
          changePercent: percentageChange(Number(latest.close), Number(previous.close)).toFixed(4),
          dimensions: deriveDimensions(closes, naturalAsset.assetClass),
          volatility: Number(volatility(closes).toFixed(2)),
          quality: Object.freeze({
            freshness,
            completeness: Math.min(1, normalized.length / Number(request.outputsize)),
            integrity: 'verified' as const,
          }),
          marketStatus: marketStatusFor(naturalAsset.assetClass),
          series: Object.freeze(normalized),
          source: 'Twelve Data',
          observedAt,
          snapshotId: `twelve-data:${asset.providerSymbol}:${observedAt}`,
          dataMode: dataModeFor(freshness),
        });
        return [candidate];
      });
      if (candidates.length === 0) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
      return Object.freeze(candidates);
    });
  }

  async getRates(baseCurrency: string, quoteCurrencies: readonly string[] = []): Promise<FxRateSnapshot> {
    const uniqueQuotes = [...new Set(quoteCurrencies.map((code) => code.toUpperCase()))];
    if (uniqueQuotes.length === 0) throw new MarketDataError('FX_RATE_UNAVAILABLE');
    if (uniqueQuotes.length > 1) throw new MarketDataError('FX_RATE_UNAVAILABLE');
    const normalizedBase = baseCurrency.toUpperCase();
    const quote = uniqueQuotes[0];
    if (!quote) throw new MarketDataError('FX_RATE_UNAVAILABLE');
    return this.cached(`fx:${normalizedBase}:${quote}`, async () => {
      const observedAt = this.clock();
      if (normalizedBase === quote) {
        return Object.freeze({
          id: `twelve-data-fx:${normalizedBase}:${quote}:${observedAt}`,
          baseCurrency: normalizedBase,
          rates: Object.freeze({ [normalizedBase]: '1' }),
          provider: 'Twelve Data',
          observedAt,
          freshness: 'live',
          dataMode: 'live',
        });
      }
      const url = this.url('/exchange_rate', { symbol: `${normalizedBase}/${quote}` });
      let payload: { rate?: number | string; timestamp?: number; status?: string; code?: number };
      try {
        payload = await this.request(url);
      } catch (error) {
        if (error instanceof MarketDataError && error.code === 'MARKET_DATA_RATE_LIMITED') throw error;
        throw new MarketDataError('FX_RATE_UNAVAILABLE');
      }
      const rate = Number(payload.rate);
      if (!Number.isFinite(rate) || rate <= 0) throw new MarketDataError('FX_RATE_UNAVAILABLE');
      const rateObservedAt = payload.timestamp
        ? new Date(payload.timestamp * 1000).toISOString()
        : observedAt;
      return Object.freeze({
        id: `twelve-data-fx:${normalizedBase}:${quote}:${rateObservedAt}`,
        baseCurrency: normalizedBase,
        rates: Object.freeze({ [normalizedBase]: '1', [quote]: String(rate) }),
        provider: 'Twelve Data',
        observedAt: rateObservedAt,
        freshness: 'live',
        dataMode: 'live',
      });
    });
  }

  private url(path: string, parameters: Readonly<Record<string, string>>) {
    const url = new URL(path, 'https://api.twelvedata.com');
    for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
    url.searchParams.set('apikey', this.apiKey);
    return url;
  }

  private async request<T>(url: URL): Promise<T> {
    try {
      const response = await this.fetcher(url);
      const payload = await response.json() as T & { status?: string; code?: number };
      if (!response.ok || payload.status === 'error') {
        throw errorFromStatus(response.status, payload.code);
      }
      return payload;
    } catch (error) {
      if (error instanceof MarketDataError) throw error;
      throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    }
  }

  private async cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const now = Date.parse(this.clock());
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > now) return cached.value;
    const inFlight = this.pending.get(key) as Promise<T> | undefined;
    if (inFlight) return inFlight;
    const promise = load().then((value) => {
      this.cache.set(key, { expiresAt: now + this.ttlMs, value });
      return value;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, promise);
    return promise;
  }
}
