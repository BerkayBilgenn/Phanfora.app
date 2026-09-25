'use client'

import { useEffect, useRef } from 'react'
import type { AnalysisResult } from './analysis-contract'
import { OpportunityCard } from './opportunity-card'
import { copy, type Locale } from '@/lib/copy'
import { formatMoney } from '@/lib/format'

export function ResultsView({ result, locale, onEdit }: { result: AnalysisResult; locale: Locale; onEdit?: () => void }) {
  const text = copy[locale].results
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <section className="results-view" aria-labelledby="results-title">
      <header className="results-header">
        <div>
          <p className="eyebrow">{text.demoData}</p>
          <h1 id="results-title" ref={titleRef} tabIndex={-1}>{text.title}</h1>
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
      {onEdit && <button className="secondary-button results-edit" type="button" onClick={onEdit}>{copy[locale].scan.edit}</button>}
      <p className="coverage-summary numeric">{text.coverage(result.scannedAssetCount, result.excludedAssetCount)}</p>
    </section>
  )
}
