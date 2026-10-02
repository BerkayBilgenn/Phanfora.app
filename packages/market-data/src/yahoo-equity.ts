import type { CanonicalAsset, Horizon, MarketCandidate } from '@phanfora/domain';
import type { MarketDataProvider } from './index';
import { candidateFromOhlc } from './ohlc';
import { MarketDataError } from './twelve-data';

type ProviderOptions = { fetch?: typeof fetch; clock?: () => string; ttlMs?: number };
type YahooAsset = CanonicalAsset & { yahooSymbol: string };

const ASSETS = [
  { id: 'stock:aapl-xnas', symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high', yahooSymbol: 'AAPL' },
  { id: 'stock:msft-xnas', symbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high', yahooSymbol: 'MSFT' },
  { id: 'stock:nvda-xnas', symbol: 'NVDA', name: 'NVIDIA Corp.', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high', yahooSymbol: 'NVDA' },
  { id: 'stock:googl-xnas', symbol: 'GOOGL', name: 'Alphabet Inc.', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high', yahooSymbol: 'GOOGL' },
  { id: 'stock:amzn-xnas', symbol: 'AMZN', name: 'Amazon.com Inc.', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high', yahooSymbol: 'AMZN' },
  { id: 'stock:tsla-xnas', symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high', yahooSymbol: 'TSLA' },
  { id: 'stock:meta-xnas', symbol: 'META', name: 'Meta Platforms', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high', yahooSymbol: 'META' },
  { id: 'stock:thyao-xist', symbol: 'THYAO', name: 'Türk Hava Yolları', assetClass: 'stock', exchangeOrVenue: 'Borsa İstanbul', quoteCurrency: 'TRY', liquidityTier: 'high', yahooSymbol: 'THYAO.IS' },
  { id: 'stock:garan-xist', symbol: 'GARAN', name: 'Garanti BBVA', assetClass: 'stock', exchangeOrVenue: 'Borsa İstanbul', quoteCurrency: 'TRY', liquidityTier: 'high', yahooSymbol: 'GARAN.IS' },
  { id: 'stock:akbnk-xist', symbol: 'AKBNK', name: 'Akbank', assetClass: 'stock', exchangeOrVenue: 'Borsa İstanbul', quoteCurrency: 'TRY', liquidityTier: 'high', yahooSymbol: 'AKBNK.IS' },
  { id: 'stock:eregl-xist', symbol: 'EREGL', name: 'Ereğli Demir Çelik', assetClass: 'stock', exchangeOrVenue: 'Borsa İstanbul', quoteCurrency: 'TRY', liquidityTier: 'high', yahooSymbol: 'EREGL.IS' },
  { id: 'stock:bimas-xist', symbol: 'BIMAS', name: 'BİM Birleşik Mağazalar', assetClass: 'stock', exchangeOrVenue: 'Borsa İstanbul', quoteCurrency: 'TRY', liquidityTier: 'high', yahooSymbol: 'BIMAS.IS' },
  { id: 'stock:sise-xist', symbol: 'SISE', name: 'Şişecam', assetClass: 'stock', exchangeOrVenue: 'Borsa İstanbul', quoteCurrency: 'TRY', liquidityTier: 'high', yahooSymbol: 'SISE.IS' },
] as const satisfies readonly YahooAsset[];

const REQUEST: Record<Horizon, { interval: string; range: string }> = {
  daily: { interval: '15m', range: '5d' },
  weekly: { interval: '60m', range: '1mo' },
  monthly: { interval: '1d', range: '3mo' },
};

interface YahooChart {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ open?: Array<number | null>; high?: Array<number | null>; low?: Array<number | null>; close?: Array<number | null>; volume?: Array<number | null> }> };
    }> | null;
    error?: { description?: string } | null;
  };
}

function asDelayed(candidate: MarketCandidate): MarketCandidate {
  if (candidate.quality.freshness === 'stale' || candidate.quality.freshness === 'end-of-day') return candidate;
  return {
    ...candidate,
    quality: { ...candidate.quality, freshness: 'delayed' },
    dataMode: 'delayed',
  };
}

export class YahooDelayedEquityProvider implements MarketDataProvider {
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
    return ASSETS.map(({ yahooSymbol: _yahooSymbol, ...asset }) => asset);
  }

  async getAsset(id: string) {
    const asset = ASSETS.find((item) => item.id === id);
    if (!asset) throw new Error('ASSET_NOT_FOUND');
    const { yahooSymbol: _yahooSymbol, ...canonical } = asset;
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
    if (!candidates.length) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    return candidates;
  }

  private async loadAsset(asset: YahooAsset, horizon: Horizon): Promise<MarketCandidate> {
    const request = REQUEST[horizon];
    const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(asset.yahooSymbol)}`);
    url.searchParams.set('interval', request.interval);
    url.searchParams.set('range', request.range);
    url.searchParams.set('includePrePost', 'false');
    let response: Response;
    try {
      response = await this.fetcher(url, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 PhanforaMarketData/0.1' },
      });
    } catch {
      throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    }
    if (response.status === 429) throw new MarketDataError('MARKET_DATA_RATE_LIMITED');
    if (!response.ok) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const payload = await response.json() as YahooChart;
    const point = payload.chart?.result?.[0];
    const quote = point?.indicators?.quote?.[0];
    const stamps = point?.timestamp;
    if (!point || !quote || !stamps?.length) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const bars = stamps.flatMap((stamp, index) => {
      const open = quote.open?.[index];
      const high = quote.high?.[index];
      const low = quote.low?.[index];
      const close = quote.close?.[index];
      const volume = quote.volume?.[index] ?? 0;
      if ([open, high, low, close, volume].some((value) => value == null || !Number.isFinite(Number(value)))) return [];
      return [{
        time: new Date(stamp * 1000).toISOString(),
        open: String(open),
        high: String(high),
        low: String(low),
        close: String(close),
        volume: String(volume),
      }];
    });
    const { yahooSymbol: _yahooSymbol, ...canonical } = asset;
    return asDelayed(candidateFromOhlc({
      asset: canonical,
      bars,
      horizon,
      now: this.clock(),
      source: 'Yahoo Finance',
      snapshotPrefix: 'yahoo',
      marketStatus: 'unknown',
    }));
  }
}
