import type { AnalysisInput, AnalysisResult, CanonicalAsset, CurrencyDefinition, Horizon, MarketCandidate } from '@phanfora/domain';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000';

async function expectJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? 'Piyasa analizi tamamlanamadı.');
  }
  return response.json() as Promise<T>;
}

export async function fetchCurrencies(): Promise<CurrencyDefinition[]> {
  const response = await fetch(`${apiUrl}/v1/currencies?locale=tr-TR`, {
    cache: 'no-store',
  });
  const body = await expectJson<{ items: CurrencyDefinition[] }>(response);
  return body.items;
}

export interface MarketQuotes {
  items: MarketCandidate[];
  dataMode: 'live' | 'public' | 'fixture';
}

export async function fetchAssets(): Promise<CanonicalAsset[]> {
  const response = await fetch(`${apiUrl}/v1/assets`, { cache: 'no-store' });
  const body = await expectJson<{ items: CanonicalAsset[] }>(response);
  return body.items;
}

export async function fetchQuotes(horizon: Horizon = 'daily', assetIds: readonly string[] = []): Promise<MarketQuotes> {
  const response = assetIds.length
    ? await fetch(`${apiUrl}/v1/market/quotes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ horizon, assetIds }),
        cache: 'no-store',
      })
    : await fetch(`${apiUrl}/v1/market/quotes?horizon=${horizon}`, { cache: 'no-store' });
  return expectJson<MarketQuotes>(response);
}

export type NewsCategory = 'crypto' | 'stock' | 'commodity';

export interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  category: NewsCategory;
  source: string;
}

export interface NewsResponse {
  items: NewsItem[];
  updatedAt: string | null;
  stale: boolean;
  unavailableSources: string[];
}

export async function fetchNews(): Promise<NewsResponse> {
  const response = await fetch(`${apiUrl}/v1/news`, { cache: 'no-store' });
  return expectJson<NewsResponse>(response);
}

export async function createAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const response = await fetch(`${apiUrl}/v1/analyses`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      amount: input.amount.amount,
      currency: input.amount.currency,
      horizon: input.horizon,
      riskProfile: input.riskProfile,
      locale: input.locale,
    }),
  });
  return expectJson<AnalysisResult>(response);
}
