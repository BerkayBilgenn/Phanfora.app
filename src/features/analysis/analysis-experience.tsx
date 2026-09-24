'use client'

import { useState } from 'react'
import type { AnalysisInput, AnalysisResult } from './analysis-contract'
import type { ScanStage } from './analysis-service'
import { fixtureAnalysisService } from './fixture-analysis-service'
import { ScanView } from './scan-view'
import { SetupWizard } from './setup-wizard'
import { ResultsView } from './results-view'
import { copy, type Locale } from '@/lib/copy'

type ExperienceState =
  | { status: 'setup' }
  | { status: 'scanning'; stage: ScanStage }
  | { status: 'complete'; result: AnalysisResult }
  | { status: 'error'; message: string }

type AnalysisExperienceProps = {
  locale: Locale
}

export function AnalysisExperience({ locale }: AnalysisExperienceProps) {
  const [state, setState] = useState<ExperienceState>({ status: 'setup' })
  const [lastInput, setLastInput] = useState<AnalysisInput | null>(null)
  const text = copy[locale]

  async function run(input: AnalysisInput) {
    setLastInput(input)
    setState({ status: 'scanning', stage: 'updating' })
    try {
      const result = await fixtureAnalysisService.run(input, (stage) => {
        setState({ status: 'scanning', stage })
      })
      setState({ status: 'complete', result })
    } catch {
      setState({ status: 'error', message: text.scan.error })
    }
  }

  if (state.status === 'setup') return <SetupWizard locale={locale} onComplete={run} />
  if (state.status === 'scanning') return <ScanView locale={locale} stage={state.stage} />
  if (state.status === 'complete') return <ResultsView result={state.result} locale={locale} />

  return (
    <section className="error-panel" role="alert">
      <h1>{text.scan.errorTitle}</h1>
      <p>{state.message}</p>
      <div className="setup-actions">
        <button className="secondary-button" type="button" onClick={() => setState({ status: 'setup' })}>{text.scan.edit}</button>
        <button className="primary-button" type="button" disabled={!lastInput} onClick={() => lastInput && run(lastInput)}>{text.scan.retry}</button>
      </div>
    </section>
  )
}
