import type { AnalysisResult } from './analysis-contract'
import { OpportunityCard } from './opportunity-card'
import { copy, type Locale } from '@/lib/copy'
import { formatMoney } from '@/lib/format'

export function ResultsView({ result, locale }: { result: AnalysisResult; locale: Locale }) {
  const text = copy[locale].results

  return (
    <section className="results-view" aria-labelledby="results-title">
      <header className="results-header">
        <div>
          <p className="eyebrow">{text.demoData}</p>
          <h1 id="results-title">{text.title}</h1>
        </div>
        <dl className="input-summary">
          <div><dt>{text.amount}</dt><dd className="numeric">{formatMoney(Number(result.input.amount), result.input.currency, locale)}</dd></div>
          <div><dt>{text.horizon}</dt><dd>{text.horizons[result.input.horizon]}</dd></div>
          <div><dt>{text.risk}</dt><dd>{text.risks[result.input.riskProfile]}</dd></div>
        </dl>
      </header>
      <div className="results-grid">
        <div className="primary-result">
          <OpportunityCard opportunity={result.primary} locale={locale} emphasis="primary" />
        </div>
        <aside className="alternative-results" aria-label={text.alternatives}>
          <h2>{text.alternatives}</h2>
          {result.alternatives.map((opportunity) => (
            <OpportunityCard key={opportunity.assetId} opportunity={opportunity} locale={locale} emphasis="alternative" />
          ))}
        </aside>
      </div>
      <p className="coverage-summary numeric">{text.coverage(result.scannedAssetCount, result.excludedAssetCount)}</p>
    </section>
  )
}
