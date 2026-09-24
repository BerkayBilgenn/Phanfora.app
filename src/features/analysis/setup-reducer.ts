import type { AnalysisInput } from './analysis-contract'

export type Step = 'amount' | 'horizon' | 'risk' | 'summary'
type Draft = Partial<AnalysisInput>
export type SetupState = { step: Step; input: Draft; error: string | null }

export const initialSetupState: SetupState = {
  step: 'amount',
  input: { currency: 'USD' },
  error: null,
}

export type SetupAction =
  | { type: 'amount'; amount: string; currency: AnalysisInput['currency'] }
  | { type: 'horizon'; horizon: AnalysisInput['horizon'] }
  | { type: 'risk'; riskProfile: AnalysisInput['riskProfile'] }
  | { type: 'next' }
  | { type: 'back' }

export function setupReducer(state: SetupState, action: SetupAction): SetupState {
  if (action.type === 'amount') {
    return { ...state, input: { ...state.input, amount: action.amount, currency: action.currency }, error: null }
  }
  if (action.type === 'horizon') {
    return { ...state, input: { ...state.input, horizon: action.horizon }, error: null }
  }
  if (action.type === 'risk') {
    return { ...state, input: { ...state.input, riskProfile: action.riskProfile }, error: null }
  }
  if (action.type === 'back') {
    const previous: Record<Step, Step> = {
      amount: 'amount',
      horizon: 'amount',
      risk: 'horizon',
      summary: 'risk',
    }
    return { ...state, step: previous[state.step], error: null }
  }

  const amountIsValid = /^(?!0+(?:\.0+)?$)\d+(?:\.\d{1,2})?$/.test(state.input.amount ?? '')
  const valid =
    (state.step === 'amount' && amountIsValid && Boolean(state.input.currency)) ||
    (state.step === 'horizon' && Boolean(state.input.horizon)) ||
    (state.step === 'risk' && Boolean(state.input.riskProfile)) ||
    state.step === 'summary'

  if (!valid) return { ...state, error: 'current-step-invalid' }

  const next: Record<Step, Step> = {
    amount: 'horizon',
    horizon: 'risk',
    risk: 'summary',
    summary: 'summary',
  }
  return { ...state, step: next[state.step], error: null }
}
