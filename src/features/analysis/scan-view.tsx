import { Check, CircleDashed } from 'lucide-react'
import type { ScanStage } from './analysis-service'
import { copy, type Locale } from '@/lib/copy'

type ScanViewProps = {
  locale: Locale
  stage: ScanStage
}

const stages: ScanStage[] = ['updating', 'filtering', 'risk', 'ranking']

export function ScanView({ locale, stage }: ScanViewProps) {
  const text = copy[locale].scan
  const currentIndex = stages.indexOf(stage)

  return (
    <section className="scan-panel" aria-labelledby="scan-title">
      <p className="eyebrow">{text.eyebrow}</p>
      <h1 id="scan-title">{text.title}</h1>
      <p className="scan-body">{text.body}</p>
      <p className="visually-hidden" role="status" aria-live="polite">{text.stages[stage]}</p>
      <ol className="scan-stages">
        {stages.map((item, index) => {
          const complete = index < currentIndex
          const current = item === stage
          return (
            <li key={item} className={complete ? 'stage-complete' : current ? 'stage-current' : ''}>
              {complete ? <Check aria-hidden="true" size={20} /> : <CircleDashed aria-hidden="true" size={20} />}
              <span>{text.stages[item]}</span>
            </li>
          )
        })}
      </ol>
      <p className="fixture-notice">{text.fixtureNotice}</p>
    </section>
  )
}
