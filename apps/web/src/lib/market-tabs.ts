import type { MarketCandidate } from '@phanfora/domain';

export type MarketTab = 'all' | 'crypto' | 'us' | 'tr' | 'forex' | 'commodity';

export const marketTabs: { id: MarketTab; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'crypto', label: 'Kripto' },
  { id: 'us', label: 'ABD' },
  { id: 'tr', label: 'Türkiye' },
  { id: 'forex', label: 'Döviz' },
  { id: 'commodity', label: 'Emtia' },
];

export function matchesMarketTab(item: MarketCandidate, tab: MarketTab) {
  if (tab === 'all') return true;
  if (tab === 'crypto') return item.asset.assetClass === 'crypto';
  if (tab === 'forex') return item.asset.assetClass === 'forex';
  if (tab === 'commodity') return item.asset.assetClass === 'commodity';
  if (tab === 'us') return item.asset.assetClass === 'stock' && /NASDAQ|NYSE|XNAS|XNYS/i.test(item.asset.exchangeOrVenue);
  return item.asset.assetClass === 'stock' && /XIST|BIST|İstanbul|Istanbul/i.test(item.asset.exchangeOrVenue);
}
