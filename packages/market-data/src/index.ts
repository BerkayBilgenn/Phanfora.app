import { listCurrencies } from '@phanfora/currency';
import type {
  CanonicalAsset,
  CurrencyDefinition,
  FxRateSnapshot,
  Horizon,
  MarketCandidate,
} from '@phanfora/domain';

export interface MarketDataProvider {
  listAssets(): Promise<readonly CanonicalAsset[]>;
  getCandidates(horizon: Horizon): Promise<readonly MarketCandidate[]>;
  getAsset(id: string): Promise<CanonicalAsset>;
}

export interface FxRateProvider {
  listCurrencies(locale: string): Promise<readonly CurrencyDefinition[]>;
  getRates(baseCurrency: string): Promise<FxRateSnapshot>;
}

const assets = Object.freeze([
  { id: 'crypto:btc-usd', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', exchangeOrVenue: 'Global crypto', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'commodity:xau-usd', symbol: 'XAU', name: 'Gold', assetClass: 'commodity', exchangeOrVenue: 'Global spot', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'stock:aapl-xnas', symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stock', exchangeOrVenue: 'NASDAQ', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'index:spx', symbol: 'SPX', name: 'S&P 500', assetClass: 'index', exchangeOrVenue: 'Cboe', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'forex:eur-usd', symbol: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'forex', exchangeOrVenue: 'Global FX', quoteCurrency: 'USD', liquidityTier: 'high' },
  { id: 'stock:asml-xams', symbol: 'ASML', name: 'ASML Holding', assetClass: 'stock', exchangeOrVenue: 'Euronext Amsterdam', quoteCurrency: 'EUR', liquidityTier: 'medium' },
  { id: 'crypto:micro-usd', symbol: 'MICRO', name: 'Microcap Example', assetClass: 'crypto', exchangeOrVenue: 'Demo venue', quoteCurrency: 'USD', liquidityTier: 'low' },
] satisfies readonly CanonicalAsset[]);

const observedAt = '2026-09-24T09:00:00.000Z';

function makeSeries(start: number, slope: number) {
  return Object.freeze(
    Array.from({ length: 12 }, (_, index) =>
      Object.freeze({
        time: new Date(Date.UTC(2026, 8, 13 + index)).toISOString(),
        close: (start + slope * index + Math.sin(index) * slope * 0.25).toFixed(2),
        volume: String(1_000_000 + index * 84_000),
      }),
    ),
  );
}

const candidateInputs = [
  ['crypto:btc-usd', '67420.18', '3.42', [88, 84, 96, 68, 82], 64, 'continuous', 61000, 580],
  ['commodity:xau-usd', '2674.30', '1.14', [86, 76, 91, 86, 84], 28, 'open', 2520, 14],
  ['stock:aapl-xnas', '231.44', '1.87', [82, 79, 95, 78, 77], 34, 'closed', 211, 1.8],
  ['index:spx', '5824.10', '0.62', [79, 71, 98, 89, 81], 19, 'closed', 5650, 15],
  ['forex:eur-usd', '1.1842', '0.38', [72, 68, 97, 84, 74], 14, 'open', 1.14, 0.004],
  ['stock:asml-xams', '782.60', '-0.44', [66, 58, 82, 65, 69], 41, 'closed', 760, 3.2],
  ['crypto:micro-usd', '0.041', '12.80', [94, 92, 18, 22, 45], 92, 'continuous', 0.025, 0.001],
] as const;

function buildCandidates(): readonly MarketCandidate[] {
  return Object.freeze(candidateInputs.map((row, index) => {
    const asset = assets.find((item) => item.id === row[0]);
    if (!asset) throw new Error('FIXTURE_ASSET_MISSING');
    const dimensions = row[3];
    return Object.freeze({
      asset: Object.freeze({ ...asset }),
      price: Object.freeze({ amount: row[1], currency: asset.quoteCurrency }),
      changePercent: row[2],
      dimensions: Object.freeze({
        trend: dimensions[0],
        momentum: dimensions[1],
        liquidity: dimensions[2],
        riskFit: dimensions[3],
        marketConditions: dimensions[4],
      }),
      volatility: row[4],
      quality: Object.freeze({
        freshness: 'fixture' as const,
        completeness: 1,
        integrity: 'verified' as const,
      }),
      marketStatus: row[5],
      series: makeSeries(row[6], row[7]),
      source: 'Phanfora deterministic fixture',
      observedAt,
      snapshotId: `fixture-market-${index + 1}`,
      dataMode: 'fixture' as const,
    });
  }));
}

export class FixtureMarketDataProvider implements MarketDataProvider {
  async listAssets() {
    return assets;
  }

  async getCandidates(_horizon: Horizon) {
    return buildCandidates();
  }

  async getAsset(id: string) {
    const asset = assets.find((item) => item.id === id);
    if (!asset) throw new Error('ASSET_NOT_FOUND');
    return asset;
  }
}

const knownRates: Readonly<Record<string, string>> = Object.freeze({
  USD: '1', EUR: '0.85', TRY: '42.5', GBP: '0.74', JPY: '148.2', CHF: '0.79',
  CAD: '1.38', AUD: '1.52', CNY: '7.11', HKD: '7.81', INR: '88.2', BRL: '5.31',
});

function deterministicFixtureRate(code: string): string {
  const total = [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return ((total % 117) / 7 + 0.5).toFixed(6);
}

export class FixtureFxRateProvider implements FxRateProvider {
  async listCurrencies(locale: string) {
    return listCurrencies(locale);
  }

  async getRates(baseCurrency: string): Promise<FxRateSnapshot> {
    const catalog = listCurrencies('en-US');
    const usdRates = Object.fromEntries(
      catalog.map(({ code }) => [code, knownRates[code] ?? deterministicFixtureRate(code)]),
    );
    const baseRate = usdRates[baseCurrency];
    if (!baseRate) throw new Error('FX_BASE_UNAVAILABLE');

    const rates = Object.fromEntries(
      Object.entries(usdRates).map(([code, rate]) => [
        code,
        String(Number(rate) / Number(baseRate)),
      ]),
    );

    return Object.freeze({
      id: `fixture-fx-${baseCurrency.toLowerCase()}-2026-09-24`,
      baseCurrency,
      rates: Object.freeze(rates),
      provider: 'Phanfora deterministic fixture',
      observedAt,
      freshness: 'fixture',
      dataMode: 'fixture',
    });
  }
}
