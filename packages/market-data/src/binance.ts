import type { CanonicalAsset, Horizon, MarketCandidate } from '@phanfora/domain';
import type { MarketDataProvider } from './index';
import { candidateFromOhlc } from './ohlc';
import { MarketDataError } from './twelve-data';

type ProviderOptions = { fetch?: typeof fetch; clock?: () => string; ttlMs?: number };
type BinanceAsset = CanonicalAsset & { pair: string };

const ASSETS = [
  { id: 'crypto:bnb-usdt', symbol: 'BNB', name: 'BNB', assetClass: 'crypto', exchangeOrVenue: 'Binance', quoteCurrency: 'USDT', liquidityTier: 'high', pair: 'BNBUSDT' },
  { id: 'crypto:doge-usdt', symbol: 'DOGE', name: 'Dogecoin', assetClass: 'crypto', exchangeOrVenue: 'Binance', quoteCurrency: 'USDT', liquidityTier: 'high', pair: 'DOGEUSDT' },
  { id: 'crypto:avax-usdt', symbol: 'AVAX', name: 'Avalanche', assetClass: 'crypto', exchangeOrVenue: 'Binance', quoteCurrency: 'USDT', liquidityTier: 'high', pair: 'AVAXUSDT' },
  { id: 'crypto:link-usdt', symbol: 'LINK', name: 'Chainlink', assetClass: 'crypto', exchangeOrVenue: 'Binance', quoteCurrency: 'USDT', liquidityTier: 'high', pair: 'LINKUSDT' },
  { id: 'crypto:dot-usdt', symbol: 'DOT', name: 'Polkadot', assetClass: 'crypto', exchangeOrVenue: 'Binance', quoteCurrency: 'USDT', liquidityTier: 'high', pair: 'DOTUSDT' },
  { id: 'crypto:ltc-usdt', symbol: 'LTC', name: 'Litecoin', assetClass: 'crypto', exchangeOrVenue: 'Binance', quoteCurrency: 'USDT', liquidityTier: 'high', pair: 'LTCUSDT' },
  { id: 'forex:eur-usdt', symbol: 'EUR/USDT', name: 'Euro / Tether', assetClass: 'forex', exchangeOrVenue: 'Binance', quoteCurrency: 'USDT', liquidityTier: 'high', pair: 'EURUSDT' },
  { id: 'forex:gbp-usdt', symbol: 'GBP/USDT', name: 'Sterlin / Tether', assetClass: 'forex', exchangeOrVenue: 'Binance', quoteCurrency: 'USDT', liquidityTier: 'high', pair: 'GBPUSDT' },
  { id: 'forex:usdt-try', symbol: 'USDT/TRY', name: 'Tether / Türk Lirası', assetClass: 'forex', exchangeOrVenue: 'Binance', quoteCurrency: 'TRY', liquidityTier: 'high', pair: 'USDTTRY' },
  { id: 'forex:eur-try', symbol: 'EUR/TRY', name: 'Euro / Türk Lirası', assetClass: 'forex', exchangeOrVenue: 'Binance', quoteCurrency: 'TRY', liquidityTier: 'high', pair: 'EURTRY' },
  { id: 'forex:gbp-try', symbol: 'GBP/TRY', name: 'Sterlin / Türk Lirası', assetClass: 'forex', exchangeOrVenue: 'Binance', quoteCurrency: 'TRY', liquidityTier: 'high', pair: 'GBPTRY' },
  { id: 'commodity:paxg-usdt', symbol: 'PAXG', name: 'PAX Gold', assetClass: 'commodity', exchangeOrVenue: 'Binance', quoteCurrency: 'USDT', liquidityTier: 'high', pair: 'PAXGUSDT' },
] as const satisfies readonly BinanceAsset[];

const INTERVAL: Record<Horizon, string> = { daily: '15m', weekly: '1h', monthly: '1d' };
const BAR_COUNT: Record<Horizon, number> = { daily: 97, weekly: 169, monthly: 31 };

export class BinanceMarketDataProvider implements MarketDataProvider {
  private readonly fetcher: typeof fetch;
  private readonly clock: () => string;
  private readonly ttlMs: number;
  private readonly cache = new Map<Horizon, { expires: number; value: readonly MarketCandidate[] }>();
  private readonly pending = new Map<Horizon, Promise<readonly MarketCandidate[]>>();

  constructor(options: ProviderOptions = {}) {
    this.fetcher = options.fetch ?? fetch;
    this.clock = options.clock ?? (() => new Date().toISOString());
    this.ttlMs = options.ttlMs ?? 60_000;
  }

  async listAssets() {
    return ASSETS.map(({ pair: _pair, ...asset }) => asset);
  }

  async getAsset(id: string) {
    const asset = ASSETS.find((item) => item.id === id);
    if (!asset) throw new Error('ASSET_NOT_FOUND');
    const { pair: _pair, ...canonical } = asset;
    return canonical;
  }

  async getCandidates(horizon: Horizon): Promise<readonly MarketCandidate[]> {
    const now = Date.parse(this.clock());
    const cached = this.cache.get(horizon);
    if (cached && now < cached.expires) return cached.value;
    const pending = this.pending.get(horizon);
    if (pending) return pending;
    const task = this.load(horizon).then((value) => {
      this.cache.set(horizon, { expires: now + this.ttlMs, value });
      return value;
    }).finally(() => this.pending.delete(horizon));
    this.pending.set(horizon, task);
    return task;
  }

  private async load(horizon: Horizon): Promise<readonly MarketCandidate[]> {
    const results = await Promise.allSettled(ASSETS.map((asset) => this.loadAsset(asset, horizon)));
    const candidates = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    if (!candidates.length) {
      const limited = results.some((result) => result.status === 'rejected' && result.reason instanceof MarketDataError && result.reason.code === 'MARKET_DATA_RATE_LIMITED');
      throw new MarketDataError(limited ? 'MARKET_DATA_RATE_LIMITED' : 'MARKET_DATA_UNAVAILABLE');
    }
    return candidates;
  }

  private async loadAsset(asset: BinanceAsset, horizon: Horizon): Promise<MarketCandidate> {
    const url = new URL('https://api.binance.com/api/v3/klines');
    url.searchParams.set('symbol', asset.pair);
    url.searchParams.set('interval', INTERVAL[horizon]);
    url.searchParams.set('limit', String(BAR_COUNT[horizon]));
    let response: Response;
    try {
      response = await this.fetcher(url, { signal: AbortSignal.timeout(8000) });
    } catch {
      throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    }
    if (response.status === 429) throw new MarketDataError('MARKET_DATA_RATE_LIMITED');
    if (!response.ok) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const payload = await response.json() as unknown;
    if (!Array.isArray(payload) || payload.length < 4) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const { pair: _pair, ...canonical } = asset;
    const bars = payload.map((row) => {
      if (!Array.isArray(row) || row.length < 6) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
      const time = new Date(Number(row[0])).toISOString();
      if (Number.isNaN(Date.parse(time))) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
      return {
        time,
        open: String(row[1]),
        high: String(row[2]),
        low: String(row[3]),
        close: String(row[4]),
        volume: String(row[5]),
      };
    });
    return candidateFromOhlc({
      asset: canonical,
      bars,
      horizon,
      now: this.clock(),
      source: 'Binance',
      snapshotPrefix: 'binance',
      marketStatus: asset.assetClass === 'crypto' ? 'continuous' : asset.assetClass === 'forex' ? 'open' : 'unknown',
    });
  }
}
