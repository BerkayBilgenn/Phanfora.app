import { formatMoney } from '@phanfora/currency';
import type { ScoreResult } from '@phanfora/domain';
import { AssetLogoBadge } from './asset-logo';

const assetClassLabel = {
  stock: 'Hisse', crypto: 'Kripto', commodity: 'Emtia', forex: 'Döviz', index: 'Endeks',
} as const;

export function AssetCard({ result, rank }: { result: ScoreResult; rank: number }) {
  const positive = Number(result.changePercent) >= 0;
  return (
    <article className="alternative-card">
      <div className="alternative-rank">0{rank}</div>
      <div className="asset-identity compact">
        <AssetLogoBadge symbol={result.asset.symbol} assetClass={result.asset.assetClass} size={42} className="symbol-box" />
        <div><strong>{result.asset.name}</strong><small>{assetClassLabel[result.asset.assetClass]} · {result.asset.exchangeOrVenue}</small></div>
      </div>
      <div className="alternative-values">
        <strong>{formatMoney(result.convertedPrice, 'tr-TR')}</strong>
        <span className={positive ? 'change-positive' : 'change-negative'}>{positive ? '↑ Yükseliş' : '↓ Düşüş'} · %{Math.abs(Number(result.changePercent)).toLocaleString('tr-TR')}</span>
      </div>
      <div className="alternative-score"><strong>{result.totalScore}</strong><span>/ 100</span></div>
    </article>
  );
}
