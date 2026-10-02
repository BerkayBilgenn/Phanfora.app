import type { CanonicalAsset, Horizon, MarketCandidate } from '@phanfora/domain';
import type { MarketDataProvider } from './index';
import { MarketDataError } from './twelve-data';

type ProviderOptions = { fetch?: typeof fetch; clock?: () => string };

const CODES = [
  { code: 'USD', id: 'forex:usd-try-tcmb', symbol: 'USD/TRY', name: 'ABD Doları / Türk Lirası' },
  { code: 'EUR', id: 'forex:eur-try-tcmb', symbol: 'EUR/TRY', name: 'Euro / Türk Lirası' },
  { code: 'GBP', id: 'forex:gbp-try-tcmb', symbol: 'GBP/TRY', name: 'Sterlin / Türk Lirası' },
] as const;

function assetFor(code: (typeof CODES)[number]): CanonicalAsset {
  return {
    id: code.id,
    symbol: code.symbol,
    name: code.name,
    assetClass: 'forex',
    exchangeOrVenue: 'TCMB',
    quoteCurrency: 'TRY',
    liquidityTier: 'high',
  };
}

function parseDate(xml: string) {
  const turkish = xml.match(/\bTarih="(\d{2})\.(\d{2})\.(\d{4})"/);
  if (turkish) return `${turkish[3]}-${turkish[2]}-${turkish[1]}T00:00:00.000Z`;
  throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
}

function sellingRate(xml: string, code: string) {
  const block = xml.match(new RegExp(`<Currency[^>]*CurrencyCode="${code}"[^>]*>([\\s\\S]*?)</Currency>`, 'i'));
  const selling = block?.[1]?.match(/<ForexSelling>([^<]+)<\/ForexSelling>/);
  const raw = selling?.[1]?.trim().replace(',', '.');
  const rate = Number(raw);
  if (!raw || !Number.isFinite(rate) || rate <= 0) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
  return raw;
}

export class TcmbDailyFxProvider implements MarketDataProvider {
  private readonly fetcher: typeof fetch;
  private readonly clock: () => string;

  constructor(options: ProviderOptions = {}) {
    this.fetcher = options.fetch ?? fetch;
    this.clock = options.clock ?? (() => new Date().toISOString());
  }

  async listAssets() {
    return CODES.map(assetFor);
  }

  async getAsset(id: string) {
    const found = CODES.find((item) => item.id === id);
    if (!found) throw new Error('ASSET_NOT_FOUND');
    return assetFor(found);
  }

  async getCandidates(_horizon: Horizon): Promise<readonly MarketCandidate[]> {
    let response: Response;
    try {
      response = await this.fetcher('https://www.tcmb.gov.tr/kurlar/today.xml', { signal: AbortSignal.timeout(8000) });
    } catch {
      throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    }
    if (!response.ok) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    const xml = await response.text();
    const observedAt = parseDate(xml);
    const candidates: MarketCandidate[] = [];
    for (const code of CODES) {
      try {
        const amount = sellingRate(xml, code.code);
        const asset = assetFor(code);
        candidates.push({
          asset,
          price: { amount, currency: 'TRY' },
          changePercent: '0.0000',
          dimensions: { trend: 50, momentum: 50, liquidity: 80, riskFit: 70, marketConditions: 50 },
          volatility: 0,
          quality: { freshness: 'end-of-day', completeness: 1, integrity: 'verified' },
          marketStatus: 'closed',
          series: [{ time: observedAt, close: amount, volume: '0' }],
          source: 'TCMB',
          observedAt,
          snapshotId: `tcmb:${code.code}:${observedAt}`,
          dataMode: 'end-of-day',
        });
      } catch {
        // Keep other official prints if one currency is missing from the bulletin.
      }
    }
    if (!candidates.length) throw new MarketDataError('MARKET_DATA_UNAVAILABLE');
    return candidates;
  }
}
