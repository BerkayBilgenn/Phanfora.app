import { describe, expect, it } from 'vitest'
import { initialSetupState, setupReducer } from './setup-reducer'

describe('setupReducer', () => {
  it('preserves answers across back and next navigation', () => {
    let state = setupReducer(initialSetupState, { type: 'amount', amount: '5000', currency: 'USD' })
    state = setupReducer(state, { type: 'next' })
    state = setupReducer(state, { type: 'horizon', horizon: 'weekly' })
    state = setupReducer(state, { type: 'next' })
    state = setupReducer(state, { type: 'back' })

    expect(state.step).toBe('horizon')
    expect(state.input.amount).toBe('5000')
    expect(state.input.horizon).toBe('weekly')
  })

  it('does not advance until the current step is valid', () => {
    expect(setupReducer(initialSetupState, { type: 'next' }).step).toBe('amount')
  })
})
