import { listCurrencies } from '@phanfora/currency';
import type { CanonicalAsset, CurrencyDefinition, Freshness, FxRateSnapshot, Horizon, MarketCandidate, PricePoint } from '@phanfora/domain';
import type { FxRateProvider, MarketDataProvider } from './index';
import { MarketDataError } from './twelve-data';

type ProviderOptions = { fetch?: typeof fetch; clock?: () => string; ttlMs?: number };
type KrakenBar = [number, string, string, string, string, string, string, number];
type KrakenResponse = { error?: string[]; result?: Record<string, KrakenBar[] | number> };
type KrakenPair = { base?: string; quote?: string; status?: string; aclass_base?: string };
type KrakenPairsResponse = { error?: string[]; result?: Record<string, KrakenPair> };

const ASSETS = [
  { id: 'crypto:btc-usd', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', exchangeOrVenue: 'Kraken', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'crypto:eth-usd', symbol: 'ETH', name: 'Ethereum', assetClass: 'crypto', exchangeOrVenue: 'Kraken', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'crypto:sol-usd', symbol: 'SOL', name: 'Solana', assetClass: 'crypto', exchangeOrVenue: 'Kraken', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'crypto:xrp-usd', symbol: 'XRP', name: 'XRP', assetClass: 'crypto', exchangeOrVenue: 'Kraken', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'crypto:ada-usd', symbol: 'ADA', name: 'Cardano', assetClass: 'crypto', exchangeOrVenue: 'Kraken', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'forex:eur-usd', symbol: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'forex', exchangeOrVenue: 'Kraken', quoteCurrency: 'USD', liquidityTier: 'high' },
] as const satisfies readonly CanonicalAsset[];
const POPULAR_NAMES: Record<string, string> = {
  DOGE: 'Dogecoin', AVAX: 'Avalanche', LINK: 'Chainlink', DOT: 'Polkadot',
  LTC: 'Litecoin', BCH: 'Bitcoin Cash', UNI: 'Uniswap', AAVE: 'Aave',
  ARB: 'Arbitrum', OP: 'Optimism', PEPE: 'Pepe', SHIB: 'Shiba Inu',
};

const INTERVAL: Record<Horizon, number> = { daily: 15, weekly: 60, monthly: 1440 };
const BAR_COUNT: Record<Horizon, number> = { daily: 97, weekly: 169, monthly: 31 };
function score(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function number(value: unknown) { const parsed = Number(value); if (!Number.isFinite(parsed)) throw new MarketDataError('MARKET_DATA_UNAVAILABLE'); return parsed; }
function krakenPair(asset: CanonicalAsset) {
  return asset.symbol.includes('/') ? asset.symbol : `${asset.symbol}/USD`;
}

export class KrakenMarketDataProvider implements MarketDataProvider {
  private readonly fetcher: typeof fetch;
  private readonly clock: () => string;
  private readonly ttlMs: number;
  private readonly cache = new Map<string, { expires: number; value: MarketCandidate }>();
  private readonly pending = new Map<string, Promise<MarketCandidate>>();
  private catalog: { expires: number; value: readonly CanonicalAsset[] } | null = null;
  private catalogPending: Promise<readonly CanonicalAsset[]> | null = null;
  constructor(options: ProviderOptions = {}) {
    this.fetcher = options.fetch ?? fetch;
    this.clock = options.clock ?? (() => new Date().toISOString());
    this.ttlMs = options.ttlMs ?? 60_000;
  }
  async listAssets(): Promise<readonly CanonicalAsset[]> {
    const now = Date.parse(this.clock());
    if (this.catalog && now < this.catalog.expires) return this.catalog.value;
    if (this.catalogPending) return this.catalogPending;
    const task = this.loadCatalog()
      .then((value) => { this.catalog = { expires: now + 3_600_000, value }; return value; })
      .finally(() => { this.catalogPending = null; });
    this.catalogPending = task;
    return task;
  }
  private async loadCatalog(): Promise<readonly CanonicalAsset[]> {
    const url = new URL('https://api.kraken.com/0/public/AssetPairs');
    url.searchParams.set('assetVersion', '1');
    let response: Response;
    try { response = await this.fetcher(url, { signal: AbortSignal.timeout(8000) }); }
    catch { throw new MarketDataError('MARKET_DATA_UNAVAILABLE'); }
    if (response.status === 429) throw new MarketDataError('MARKET_DATA_RATE_LIMITED');
    if (!response.ok) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const payload = await response.json() as KrakenPairsResponse;
    if (payload.error?.length || !payload.result) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const defaults = new Set<string>(ASSETS.map((asset) => asset.id));
    const additional = Object.values(payload.result).flatMap((pair): CanonicalAsset[] => {
      const symbol = pair.base?.toUpperCase();
      if (pair.quote !== 'USD' || pair.status !== 'online' || (pair.aclass_base && pair.aclass_base !== 'currency') || !symbol || !/^[A-Z0-9]{2,12}$/.test(symbol) || symbol === 'USD') return [];
      const id = `crypto:${symbol.toLowerCase()}-usd`;
      if (defaults.has(id)) return [];
      return [{ id, symbol, name: POPULAR_NAMES[symbol] ?? symbol, assetClass: 'crypto', exchangeOrVenue: 'Kraken', quoteCurrency: 'USD', liquidityTier: 'medium' }];
    });
    const unique = new Map(additional.map((asset) => [asset.id, asset]));
    return [...ASSETS, ...[...unique.values()].sort((a, b) => a.symbol.localeCompare(b.symbol))];
  }
  async getAsset(id: string) {
    const asset = ASSETS.find((item) => item.id === id) ?? (await this.listAssets()).find((item) => item.id === id);
    if (!asset) throw new Error('ASSET_NOT_FOUND');
    return asset;
  }
  async getCandidates(horizon: Horizon, assetIds: readonly string[] = []): Promise<readonly MarketCandidate[]> {
    let catalog: readonly CanonicalAsset[] = ASSETS;
    if (assetIds.length) {
      try { catalog = await this.listAssets(); }
      catch { catalog = this.catalog?.value ?? ASSETS; }
    }
    const requested = catalog.filter((asset) => assetIds.includes(asset.id) && !ASSETS.some((known) => known.id === asset.id));
    const results = await Promise.allSettled([...ASSETS, ...requested].map((asset) => this.cachedAsset(asset, horizon)));
    const candidates = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
    if (!candidates.length) {
      const limited = results.some((result) => result.status === 'rejected' && result.reason instanceof MarketDataError && result.reason.code === 'MARKET_DATA_RATE_LIMITED');
      throw new MarketDataError(limited ? 'MARKET_DATA_RATE_LIMITED' : 'MARKET_DATA_UNAVAILABLE');
    }
    return candidates;
  }
  private async cachedAsset(asset: CanonicalAsset, horizon: Horizon): Promise<MarketCandidate> {
    const key = `${horizon}:${asset.id}`;
    const now = Date.parse(this.clock());
    const cached = this.cache.get(key);
    if (cached && now < cached.expires) return cached.value;
    const pending = this.pending.get(key);
    if (pending) return pending;
    const task = this.loadAsset(asset, horizon)
      .then((value) => { this.cache.set(key, { expires: now + this.ttlMs, value }); return value; })
      .finally(() => { this.pending.delete(key); });
    this.pending.set(key, task);
    return task;
  }
  private async loadAsset(asset: CanonicalAsset, horizon: Horizon): Promise<MarketCandidate> {
    const url = new URL('https://api.kraken.com/0/public/OHLC');
    url.searchParams.set('pair', krakenPair(asset));
    url.searchParams.set('assetVersion', '1');
    url.searchParams.set('interval', String(INTERVAL[horizon]));
    let response: Response;
    try { response = await this.fetcher(url, { signal: AbortSignal.timeout(8000) }); }
    catch { throw new MarketDataError('MARKET_DATA_UNAVAILABLE'); }
    if (response.status === 429) throw new MarketDataError('MARKET_DATA_RATE_LIMITED');
    if (!response.ok) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const payload = await response.json() as KrakenResponse;
    if (payload.error?.length || !payload.result) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const bars = Object.values(payload.result).find(Array.isArray);
    if (!bars || bars.length < 4) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const series: PricePoint[] = bars.slice(-BAR_COUNT[horizon]).map((bar) => {
      if (!Array.isArray(bar) || bar.length < 7) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
      const [timestamp, open, high, low, close, , volume] = bar;
      const values = [open, high, low, close, volume].map(number);
      if (values[2]! > values[1]! || values[0]! < values[2]! || values[0]! > values[1]! || values[3]! < values[2]! || values[3]! > values[1]! || values[4]! < 0 || values[3]! <= 0) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
      const time = new Date(number(timestamp) * 1000).toISOString();
      return { time, open, high, low, close, volume };
    });
    const first = number(series[0]?.close);
    const previous = number(series.at(-2)?.close);
    const current = number(series.at(-1)?.close);
    const change = ((current - first) / first) * 100;
    const momentumChange = ((current - previous) / previous) * 100;
    const trendChange = ((current - first) / first) * 100;
    const returns = series.slice(1).map((point, index) => (number(point.close) / number(series[index]?.close) - 1) * 100);
    const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length) * Math.sqrt(365 * 24 * 60 / INTERVAL[horizon]);
    const averageTurnover = series.reduce((sum, point) => sum + number(point.close) * number(point.volume), 0) / series.length;
    const observedAt = series.at(-1)!.time;
    const age = Date.parse(this.clock()) - Date.parse(observedAt);
    const freshness: Freshness = horizon === 'monthly'
      ? age <= 72 * 3600_000 ? 'end-of-day' : 'stale'
      : age <= INTERVAL[horizon] * 60_000 * 2 ? 'live' : age <= 72 * 3600_000 ? 'delayed' : 'stale';
    const trend = score(50 + trendChange * 4);
    const momentum = score(50 + momentumChange * 5);
    return {
      asset,
      price: { amount: series.at(-1)!.close, currency: asset.quoteCurrency },
      changePercent: change.toFixed(4),
      dimensions: { trend, momentum, liquidity: score(10 + Math.log10(1 + averageTurnover) * 10), riskFit: score(100 - volatility * 1.5), marketConditions: score((trend + momentum) / 2) },
      volatility: Number(volatility.toFixed(2)),
      quality: { freshness, completeness: Math.min(1, series.length / BAR_COUNT[horizon]), integrity: 'verified' },
      marketStatus: asset.assetClass === 'crypto' ? 'continuous' : 'open', series, source: 'Kraken', observedAt,
      snapshotId: `kraken:${asset.symbol}:${observedAt}`, dataMode: freshness === 'live' ? 'live' : freshness === 'end-of-day' ? 'end-of-day' : 'delayed',
    };
  }
}

export class FrankfurterFxRateProvider implements FxRateProvider {
  private readonly fetcher: typeof fetch;
  constructor(options: ProviderOptions = {}) { this.fetcher = options.fetch ?? fetch; }
  async listCurrencies(locale: string): Promise<readonly CurrencyDefinition[]> { return listCurrencies(locale); }
  async getRates(baseCurrency: string, quoteCurrencies: readonly string[] = []): Promise<FxRateSnapshot> {
    const base = baseCurrency.toUpperCase();
    const quote = quoteCurrencies[0]?.toUpperCase();
    if (!quote || quoteCurrencies.length !== 1) throw new MarketDataError('FX_RATE_UNAVAILABLE');
    if (base === quote) {
      const observedAt = new Date().toISOString();
      return { id: `identity:${base}`, baseCurrency: base, rates: { [base]: '1' }, provider: 'Identity', observedAt, freshness: 'live', dataMode: 'live' };
    }
    try {
      const response = await this.fetcher(`https://api.frankfurter.dev/v2/rate/${base.toLowerCase()}/${quote.toLowerCase()}`, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('FX_RESPONSE');
      const payload = await response.json() as { date?: string; base?: string; quote?: string; rate?: number };
      if (payload.base?.toUpperCase() !== base || payload.quote?.toUpperCase() !== quote || !payload.date || !Number.isFinite(payload.rate) || payload.rate! <= 0) throw new Error('FX_INVALID');
      const observedAt = new Date(`${payload.date}T00:00:00.000Z`).toISOString();
      return { id: `frankfurter:${base}:${quote}:${payload.date}`, baseCurrency: base, rates: { [base]: '1', [quote]: String(payload.rate) }, provider: 'Frankfurter', observedAt, freshness: 'end-of-day', dataMode: 'end-of-day' };
    } catch { throw new MarketDataError('FX_RATE_UNAVAILABLE'); }
  }
}
