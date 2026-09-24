import { describe, expect, it } from 'vitest'
import { analysisInputSchema, passesQualityGate } from './analysis-contract'

describe('analysisInputSchema', () => {
  it('accepts a canonical decimal amount and complete preferences', () => {
    expect(
      analysisInputSchema.parse({
        amount: '1250.50',
        currency: 'USD',
        horizon: 'weekly',
        riskProfile: 'balanced',
      }),
    ).toEqual({
      amount: '1250.50',
      currency: 'USD',
      horizon: 'weekly',
      riskProfile: 'balanced',
    })
  })

  it('rejects zero, negative and exponential amounts', () => {
    for (const amount of ['0', '-10', '1e6']) {
      expect(() =>
        analysisInputSchema.parse({
          amount,
          currency: 'USD',
          horizon: 'weekly',
          riskProfile: 'balanced',
        }),
      ).toThrow()
    }
  })
})

describe('passesQualityGate', () => {
  it('rejects stale or incomplete snapshots', () => {
    expect(passesQualityGate({ freshness: 'stale', completeness: 1 })).toBe(false)
    expect(passesQualityGate({ freshness: 'fresh', completeness: 0.94 })).toBe(false)
    expect(passesQualityGate({ freshness: 'fresh', completeness: 0.99 })).toBe(true)
  })
})
