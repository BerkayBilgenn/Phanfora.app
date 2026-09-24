import { formatMoney } from '@phanfora/currency';
import type { AnalysisResult } from '@phanfora/domain';

import { messages } from '../lib/messages';

import { AssetCard } from './asset-card';
import { PriceChart } from './price-chart';
import { ScoreBreakdown } from './score-breakdown';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

const horizonLabel = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' } as const;
const riskLabel = { low: 'Düşük risk', balanced: 'Dengeli risk', high: 'Yüksek risk' } as const;
const confidenceLabel = { low: 'Düşük güven', medium: 'Orta güven', high: 'Yüksek güven' } as const;
const assetClassLabel = { stock: 'Hisse', crypto: 'Kripto', commodity: 'Emtia', forex: 'Döviz', index: 'Endeks' } as const;

export function AnalysisResults({ result, onReset }: AnalysisResultsProps) {
  const primary = result.primary;
  const positive = Number(primary.changePercent) >= 0;
  const copy = messages.tr;

  return (
    <div className="results-page">
      <header className="results-header">
        <div>
          <p className="eyebrow">Analiz tamamlandı · <span>Demo veri</span></p>
          <h1>Öncelikli fırsatlar</h1>
        </div>
        <div className="analysis-summary" aria-label="Analiz tercihleri">
          <span>{formatMoney(result.input.amount, 'tr-TR')}</span>
          <span>{horizonLabel[result.input.horizon]}</span>
          <span>{riskLabel[result.input.riskProfile]}</span>
        </div>
        <button type="button" className="button-secondary" onClick={onReset}>Yeni analiz</button>
      </header>

      <div className="results-grid">
        <article className="primary-opportunity">
          <div className="opportunity-topline">
            <span className="rank-label">01 · Ana fırsat</span>
            <span className="data-badge">Demo veri</span>
          </div>
          <div className="primary-heading">
            <div className="asset-identity">
              <span className="symbol-box large">{primary.asset.symbol.slice(0, 3)}</span>
              <div>
                <h2>{primary.asset.name} <small>{primary.asset.symbol}</small></h2>
                <p>{assetClassLabel[primary.asset.assetClass]} · {primary.asset.exchangeOrVenue} · {primary.marketStatus === 'continuous' ? 'Kesintisiz piyasa' : primary.marketStatus === 'open' ? 'Piyasa açık' : 'Piyasa kapalı'}</p>
              </div>
            </div>
            <div className="score-lockup">
              <span>Phanfora Skoru</span>
              <strong>{primary.totalScore}</strong><small>/ 100</small>
              <em>{confidenceLabel[primary.confidenceLevel]}</em>
            </div>
          </div>

          <div className="price-row">
            <div><span>Seçtiğin para biriminde</span><strong>{formatMoney(primary.convertedPrice, 'tr-TR')}</strong><small>{formatMoney(primary.price, 'tr-TR')} piyasa fiyatı</small></div>
            <span className={positive ? 'change-positive' : 'change-negative'}>{positive ? '↑ Yükseliş' : '↓ Düşüş'} · %{Math.abs(Number(primary.changePercent)).toLocaleString('tr-TR')}</span>
          </div>

          <PriceChart name={primary.asset.name} series={primary.series} />

          <div className="reason-grid">
            <div>
              <h3>Neden öne çıkıyor?</h3>
              <ul>{primary.reasons.slice(0, 3).map((reason) => <li key={reason}>{copy.reasons[reason as keyof typeof copy.reasons]}</li>)}</ul>
            </div>
            <section className="risk-note" aria-labelledby="primary-risk-title"><span id="primary-risk-title">Ana risk</span><p>{copy.risks[primary.primaryRisk as keyof typeof copy.risks]}</p></section>
          </div>
          <ScoreBreakdown result={primary} />
        </article>

        <aside className="results-sidebar" aria-label="Alternatifler ve veri bilgisi">
          <div className="sidebar-heading"><p className="eyebrow">Güçlü alternatifler</p><span>2 sonuç</span></div>
          {result.alternatives.map((asset, index) => <AssetCard key={asset.asset.id} result={asset} rank={index + 2} />)}

          <section className="data-panel">
            <p className="eyebrow">Veri ve kapsam</p>
            <dl>
              <div><dt>Kaynak</dt><dd>{primary.source}</dd></div>
              <div><dt>Gözlem zamanı</dt><dd>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(new Date(primary.observedAt))}</dd></div>
              <div><dt>Kur snapshot’ı</dt><dd>{result.fxSnapshot.id}</dd></div>
              <div><dt>Elenen varlık</dt><dd>{result.excluded.length}</dd></div>
            </dl>
            <p>Bu ekran deterministik geliştirme verisi kullanır. Canlı piyasa sonucu değildir.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
