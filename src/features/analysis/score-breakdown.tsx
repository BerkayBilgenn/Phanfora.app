import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { Opportunity, ScoreDimension } from './analysis-contract'
import { copy, type Locale } from '@/lib/copy'

const dimensions: ScoreDimension[] = ['trend', 'momentum', 'liquidity', 'risk', 'market']

type ScoreBreakdownProps = {
  opportunity: Opportunity
  locale: Locale
  open?: boolean
  onToggle?: (open: boolean) => void
}

export function ScoreBreakdown({ opportunity, locale, open, onToggle }: ScoreBreakdownProps) {
  const text = copy[locale].results
  const { weights, weightedScore, riskPenalty } = opportunity.scoreEvidence

  return (
    <details className="score-breakdown" aria-label={text.scoreDisclosure} open={open} onToggle={(event) => onToggle?.(event.currentTarget.open)}>
      <summary id={`score-summary-${opportunity.assetId}`} tabIndex={-1}>
        <span>{text.scoreDisclosure}</span>
        <ChevronDown aria-hidden="true" size={18} />
      </summary>
      <div className="score-content">
        <div className="dimension-list">
          {dimensions.map((dimension) => {
            const score = opportunity.dimensions[dimension]
            const contribution = score * weights[dimension] / 100
            return (
              <div className="dimension-row" key={dimension}>
                <div><span>{text.dimensions[dimension]}</span><strong className="numeric">{score} / 100</strong></div>
                <div><span>{text.weight}: {weights[dimension]}%</span><span className="numeric">{text.contribution}: {contribution.toFixed(1)}</span></div>
              </div>
            )
          })}
        </div>
        <dl className="method-meta">
          <div><dt>{text.weightedScore}</dt><dd className="numeric">{weightedScore.toFixed(1)}</dd></div>
          <div><dt>{text.riskPenalty}</dt><dd className="numeric">−{riskPenalty.toFixed(1)}</dd></div>
        </dl>
        <dl className="method-meta">
          <div><dt>{text.methodology}</dt><dd>{opportunity.methodologyVersion}</dd></div>
          <div><dt>{text.dataTime}</dt><dd className="numeric">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(opportunity.observedAt))}</dd></div>
        </dl>
        <Link className="text-link" href="/methodology">{text.methodologyLink}</Link>
      </div>
    </details>
  )
}
