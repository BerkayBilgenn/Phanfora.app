import type { Opportunity } from './analysis-contract'

const dates = [
  '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06',
  '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12',
  '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18',
  '2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24',
] as const

function makeSeries(base: number, slope: number, variation: number) {
  return dates.map((time, index) => ({
    time,
    value: Number((base + slope * index + ((index % 5) - 2) * variation).toFixed(2)),
  }))
}

export const fixtureOpportunities: readonly Opportunity[] = [
  {
    assetId: 'apple-stock', symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stock', venue: 'NASDAQ', quoteCurrency: 'USD',
    price: 238.14, changePercent: 1.82, totalScore: 88, confidence: 'high',
    dimensions: { trend: 90, momentum: 84, liquidity: 94, risk: 78, market: 82 },
    reasons: ['Haftalık trend ana ortalamaların üzerinde.', 'Likidite güçlü ve fiyatlama istikrarlı.', 'Momentum pozitif bölgede korunuyor.'],
    primaryRisk: 'Değerleme çarpanları tarihsel ortalamanın üzerinde.', methodologyVersion: 'fixture-v1',
    observedAt: '2026-09-24T12:00:00.000Z', quality: { freshness: 'fresh', completeness: 1 },
    series: makeSeries(218, 0.9, 1.2),
  },
  {
    assetId: 'gold-commodity', symbol: 'XAU', name: 'Gold Spot', assetClass: 'commodity', venue: 'OTC', quoteCurrency: 'USD',
    price: 2684.2, changePercent: 0.74, totalScore: 84, confidence: 'high',
    dimensions: { trend: 82, momentum: 76, liquidity: 88, risk: 90, market: 84 },
    reasons: ['Haftalık trend yukarı yönünü koruyor.', 'Risk boyutu dengeli profil ile uyumlu.', 'Piyasa koşulları savunmacı talebi destekliyor.'],
    primaryRisk: 'Dolar güçlenmesi kısa vadeli baskı yaratabilir.', methodologyVersion: 'fixture-v1',
    observedAt: '2026-09-24T12:00:00.000Z', quality: { freshness: 'fresh', completeness: 0.99 },
    series: makeSeries(2560, 5.5, 8),
  },
  {
    assetId: 'bitcoin-crypto', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', venue: 'Global composite', quoteCurrency: 'USD',
    price: 74280, changePercent: 3.18, totalScore: 82, confidence: 'medium',
    dimensions: { trend: 84, momentum: 94, liquidity: 86, risk: 52, market: 78 },
    reasons: ['Momentum haftalık vadede güçlü kalıyor.', 'Küresel likidite derinliği yüksek.', 'Trend yapısı daha yüksek dipler üretiyor.'],
    primaryRisk: 'Yüksek oynaklık sert geri çekilme yaratabilir.', methodologyVersion: 'fixture-v1',
    observedAt: '2026-09-24T12:00:00.000Z', quality: { freshness: 'fresh', completeness: 1 },
    series: makeSeries(67100, 320, 540),
  },
  {
    assetId: 'euro-dollar', symbol: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'forex', venue: 'Global FX', quoteCurrency: 'USD',
    price: 1.1842, changePercent: -0.21, totalScore: 72, confidence: 'medium',
    dimensions: { trend: 70, momentum: 66, liquidity: 96, risk: 92, market: 68 },
    reasons: ['Likidite haftalık uygulama için güçlü.', 'Oynaklık dengeli risk profiline uyuyor.'],
    primaryRisk: 'Merkez bankası iletişimi yönü hızla değiştirebilir.', methodologyVersion: 'fixture-v1',
    observedAt: '2026-09-24T12:00:00.000Z', quality: { freshness: 'delayed', completeness: 1 },
    series: makeSeries(1.16, 0.001, 0.004),
  },
  {
    assetId: 'high-volatility', symbol: 'SOL', name: 'Solana', assetClass: 'crypto', venue: 'Global composite', quoteCurrency: 'USD',
    price: 212.45, changePercent: 6.92, totalScore: 86, confidence: 'medium',
    dimensions: { trend: 100, momentum: 100, liquidity: 100, risk: 20, market: 100 },
    reasons: ['Momentum seçili vadede güçlü.', 'Trend yapısı pozitif bölgede.'],
    primaryRisk: 'Oynaklık düşük risk profiliyle uyumsuz olabilir.', methodologyVersion: 'fixture-v1',
    observedAt: '2026-09-24T12:00:00.000Z', quality: { freshness: 'fresh', completeness: 0.99 },
    series: makeSeries(168, 2.1, 9),
  },
  {
    assetId: 'stale-leader', symbol: 'SPX', name: 'S&P 500 Index', assetClass: 'index', venue: 'S&P DJI', quoteCurrency: 'USD',
    price: 6584.1, changePercent: 1.1, totalScore: 96, confidence: 'high',
    dimensions: { trend: 98, momentum: 96, liquidity: 99, risk: 93, market: 97 },
    reasons: ['Ham skor güçlü görünüyor.'], primaryRisk: 'Veri zamanı güvenilir değil.', methodologyVersion: 'fixture-v1',
    observedAt: '2026-09-20T12:00:00.000Z', quality: { freshness: 'stale', completeness: 1 },
    series: makeSeries(6200, 18, 24),
  },
  {
    assetId: 'incomplete-stock', symbol: 'MCR', name: 'Microcap Research', assetClass: 'stock', venue: 'OTC', quoteCurrency: 'USD',
    price: 8.42, changePercent: 12.4, totalScore: 92, confidence: 'low',
    dimensions: { trend: 94, momentum: 95, liquidity: 32, risk: 28, market: 64 },
    reasons: ['Ham momentum yüksek.'], primaryRisk: 'Veri kapsamı karar için yetersiz.', methodologyVersion: 'fixture-v1',
    observedAt: '2026-09-24T12:00:00.000Z', quality: { freshness: 'fresh', completeness: 0.9 },
    series: makeSeries(5.2, 0.15, 0.6),
  },
] as const
