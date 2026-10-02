import type { MarketCandidate } from '@phanfora/domain';
import type { MarketTab } from './market-tabs';

export type TapeLayout = 'tape' | 'book' | 'board';

export type TapeQuote = {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
};

export function tapeLayout(tab: MarketTab): TapeLayout {
  if (tab === 'forex') return 'book';
  if (tab === 'tr') return 'board';
  return 'tape';
}

export function tapeHeadline(tab: MarketTab) {
  if (tab === 'crypto') return 'Kraken · Binance';
  if (tab === 'forex') return 'Parite · resmi kur';
  if (tab === 'tr') return 'Borsa İstanbul';
  if (tab === 'us') return 'NASDAQ · NYSE';
  if (tab === 'commodity') return 'XAU · PAXG';
  return 'Tüm kanallar';
}

export function tapeQuotes(items: readonly MarketCandidate[]): TapeQuote[] {
  return items.map((item) => {
    const change = Number(item.changePercent);
    return {
      symbol: item.asset.symbol,
      price: `${item.price.amount} ${item.price.currency}`,
      change: `${change >= 0 ? '+' : ''}${change.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}%`,
      up: change >= 0,
    };
  });
}
