'use client'

import { useEffect, useReducer, useRef, useState, type FormEvent } from 'react'
import { analysisInputSchema, type AnalysisInput } from './analysis-contract'
import { initialSetupState, setupReducer } from './setup-reducer'
import { formatMoney, normalizeLocalizedAmount } from '@/lib/format'
import { copy, type Locale } from '@/lib/copy'

type SetupWizardProps = {
  locale: Locale
  initialInput?: AnalysisInput
  onComplete?: (input: AnalysisInput) => void
}

const horizonValues: AnalysisInput['horizon'][] = ['daily', 'weekly', 'monthly']
const riskValues: AnalysisInput['riskProfile'][] = ['low', 'balanced', 'high']

export function SetupWizard({ locale, initialInput, onComplete = () => undefined }: SetupWizardProps) {
  const [state, dispatch] = useReducer(setupReducer, initialInput
    ? { ...initialSetupState, input: initialInput }
    : initialSetupState)
  const [rawAmount, setRawAmount] = useState(initialInput?.amount ?? '')
  const amountRef = useRef<HTMLInputElement>(null)
  const horizonRef = useRef<HTMLFieldSetElement>(null)
  const riskRef = useRef<HTMLFieldSetElement>(null)
  const didMount = useRef(false)
  const text = copy[locale].setup
  const progress = state.step === 'amount' ? '1 / 3' : state.step === 'horizon' ? '2 / 3' : '3 / 3'
  const amountIsValid = /^(?!0+(?:\.0+)?$)\d+(?:\.\d{1,2})?$/.test(state.input.amount ?? '')
  const currentIsValid =
    (state.step === 'amount' && amountIsValid) ||
    (state.step === 'horizon' && Boolean(state.input.horizon)) ||
    (state.step === 'risk' && Boolean(state.input.riskProfile))

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    const target = state.step === 'amount' ? amountRef.current : state.step === 'horizon' ? horizonRef.current : riskRef.current
    target?.focus()
  }, [state.step])

  function updateAmount(value: string, currency = state.input.currency ?? 'USD') {
    setRawAmount(value)
    dispatch({
      type: 'amount',
      amount: normalizeLocalizedAmount(value, locale) ?? '',
      currency,
    })
  }

  function advance(event: FormEvent) {
    event.preventDefault()
    if (!currentIsValid) {
      dispatch({ type: 'next' })
      if (state.step === 'amount') amountRef.current?.focus()
      return
    }
    dispatch({ type: 'next' })
  }

  function complete(event: FormEvent) {
    event.preventDefault()
    const parsed = analysisInputSchema.safeParse(state.input)
    if (!parsed.success) {
      dispatch({ type: 'back' })
      return
    }
    onComplete(parsed.data)
  }

  return (
    <section className="setup-panel" aria-labelledby="setup-title">
      <div className="setup-heading">
        <div>
          <p className="eyebrow">{copy[locale].hero.eyebrow}</p>
          <h1 id="setup-title">{copy[locale].hero.title}</h1>
        </div>
        <span className="setup-progress numeric" aria-label={text.progressLabel}>{progress}</span>
      </div>
      <p className="setup-intro">{copy[locale].hero.body}</p>

      <div className="setup-step" data-step-panel key={state.step}>
        {state.step === 'amount' && (
          <form onSubmit={advance} noValidate>
            <div className="amount-grid">
              <label className="field-label" htmlFor="analysis-amount">
                {text.amountLabel}
                <input
                  ref={amountRef}
                  id="analysis-amount"
                  name="amount"
                  className="amount-input numeric"
                  inputMode="decimal"
                  autoComplete="off"
                  value={rawAmount}
                  aria-invalid={state.error ? true : undefined}
                  aria-describedby="amount-help amount-error"
                  onChange={(event) => updateAmount(event.target.value)}
                />
              </label>
              <label className="field-label" htmlFor="analysis-currency">
                {text.currencyLabel}
                <select
                  id="analysis-currency"
                  name="currency"
                  value={state.input.currency}
                  onChange={(event) => updateAmount(rawAmount, event.target.value as AnalysisInput['currency'])}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="TRY">TRY</option>
                  <option value="GBP">GBP</option>
                </select>
              </label>
            </div>
            <p id="amount-help" className="field-help">{text.amountHelp}</p>
            <p id="amount-error" className="field-error" aria-live="polite">
              {state.error ? text.amountError : ''}
            </p>
            <div className="setup-actions setup-actions-end">
              <button className="primary-button" type="submit" disabled={!amountIsValid}>{text.continue}</button>
            </div>
          </form>
        )}

        {state.step === 'horizon' && (
          <form onSubmit={advance}>
            <fieldset ref={horizonRef} tabIndex={-1}>
              <legend>{text.horizonTitle}</legend>
              <div className="choice-grid">
                {horizonValues.map((value) => (
                  <label className="choice-card" key={value}>
                    <input
                      type="radio"
                      name="horizon"
                      value={value}
                      checked={state.input.horizon === value}
                      onChange={() => dispatch({ type: 'horizon', horizon: value })}
                    />
                    <span>{text.horizons[value]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="setup-actions">
              <button className="secondary-button" type="button" onClick={() => dispatch({ type: 'back' })}>{text.back}</button>
              <button className="primary-button" type="submit" disabled={!state.input.horizon}>{text.continue}</button>
            </div>
          </form>
        )}

        {state.step === 'risk' && (
          <form onSubmit={complete}>
            <fieldset ref={riskRef} tabIndex={-1}>
              <legend>{text.riskTitle}</legend>
              <div className="choice-grid">
                {riskValues.map((value) => (
                  <label className="choice-card" key={value}>
                    <input
                      type="radio"
                      name="risk"
                      value={value}
                      checked={state.input.riskProfile === value}
                      onChange={() => dispatch({ type: 'risk', riskProfile: value })}
                    />
                    <span>{text.risks[value]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="inline-summary" aria-labelledby="inline-summary-title">
              <h2 id="inline-summary-title">{text.summaryTitle}</h2>
              <dl className="summary-list">
                <div><dt>{text.amountSummary}</dt><dd className="numeric">{state.input.amount && state.input.currency ? formatMoney(Number(state.input.amount), state.input.currency, locale) : ''}</dd></div>
                <div><dt>{text.horizonSummary}</dt><dd>{state.input.horizon ? text.horizons[state.input.horizon] : ''}</dd></div>
                <div><dt>{text.riskSummary}</dt><dd>{state.input.riskProfile ? text.risks[state.input.riskProfile] : '—'}</dd></div>
              </dl>
            </div>
            <div className="setup-actions">
              <button className="secondary-button" type="button" onClick={() => dispatch({ type: 'back' })}>{text.back}</button>
              <button className="primary-button" type="submit" disabled={!state.input.riskProfile}>{text.scan}</button>
            </div>
          </form>
        )}

        {state.step === 'summary' && (
          <form onSubmit={complete}>
            <h2>{text.summaryTitle}</h2>
            <dl className="summary-list">
              <div><dt>{text.amountSummary}</dt><dd className="numeric">{rawAmount} {state.input.currency}</dd></div>
              <div><dt>{text.horizonSummary}</dt><dd>{state.input.horizon ? text.horizons[state.input.horizon] : ''}</dd></div>
              <div><dt>{text.riskSummary}</dt><dd>{state.input.riskProfile ? text.risks[state.input.riskProfile] : ''}</dd></div>
            </dl>
            <div className="setup-actions">
              <button className="secondary-button" type="button" onClick={() => dispatch({ type: 'back' })}>{text.back}</button>
              <button className="primary-button" type="submit">{text.scan}</button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
