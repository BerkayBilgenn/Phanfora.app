'use client'

import { useState } from 'react'
import type { Opportunity } from './analysis-contract'
import { PriceLineChart } from './price-line-chart'
import { ScoreBreakdown } from './score-breakdown'
import { copy, type Locale } from '@/lib/copy'
import { formatMoney, formatPercent } from '@/lib/format'

type OpportunityCardProps = {
  opportunity: Opportunity
  locale: Locale
  emphasis: 'primary' | 'alternative'
}

export function OpportunityCard({ opportunity, locale, emphasis }: OpportunityCardProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const text = copy[locale].results
  const narrative = text.assetNarratives[opportunity.assetId]
  const reasons = narrative?.reasons ?? opportunity.reasons
  const risk = narrative?.risk ?? opportunity.primaryRisk
  const disabledDescriptionId = `watch-disabled-${opportunity.assetId}`

  return (
    <article className={`opportunity-card opportunity-${emphasis}`}>
      <header className="opportunity-identity">
        <div>
          <p className="asset-symbol numeric">{opportunity.symbol}</p>
          <h2>{opportunity.name}</h2>
        </div>
        <span className="asset-class">{text.assetClasses[opportunity.assetClass]} · {opportunity.venue}</span>
      </header>
      <div className="price-row">
        <strong className="asset-price numeric">{formatMoney(opportunity.price, opportunity.quoteCurrency, locale)}</strong>
        <span className="price-change numeric" data-direction={opportunity.changePercent >= 0 ? 'up' : 'down'}>
          {opportunity.changePercent >= 0 ? '↑' : '↓'} {formatPercent(opportunity.changePercent, locale)}
        </span>
      </div>
      <div className="score-row">
        <strong className="numeric">{text.score}: {opportunity.totalScore} / 100</strong>
        <span>{text.confidence}: {text.confidenceLevels[opportunity.confidence]}</span>
      </div>
      <PriceLineChart series={opportunity.series} symbol={opportunity.symbol} locale={locale} />
      <section className="card-evidence" aria-label={text.reasonsLabel}>
        <h3>{text.reasonsLabel}</h3>
        <ul>{reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}</ul>
      </section>
      <p className="risk-note"><strong>{text.riskLabel}:</strong> {risk}</p>
      <div className="data-status">
        <span>{text.demoData} · {text.freshness[opportunity.quality.freshness]}</span>
        <time className="numeric" dateTime={opportunity.observedAt}>{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(opportunity.observedAt))} UTC</time>
      </div>
      <ScoreBreakdown opportunity={opportunity} locale={locale} open={breakdownOpen} onToggle={setBreakdownOpen} />
      <div className="card-actions">
        <button
          className="primary-button action-link"
          type="button"
          onClick={() => {
            setBreakdownOpen(true)
            requestAnimationFrame(() => document.getElementById(`score-summary-${opportunity.assetId}`)?.focus())
          }}
        >{text.inspect}</button>
        <button className="secondary-button" type="button" disabled aria-describedby={disabledDescriptionId}>{text.watch}</button>
        <span className="visually-hidden" id={disabledDescriptionId}>{text.watchDisabled}</span>
      </div>
    </article>
  )
}
