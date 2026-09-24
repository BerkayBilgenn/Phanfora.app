import { describe, expect, it } from 'vitest'
import { fixtureAnalysisService } from './fixture-analysis-service'

const input = {
  amount: '5000',
  currency: 'USD',
  horizon: 'weekly',
  riskProfile: 'balanced',
} as const

describe('fixtureAnalysisService', () => {
  it('reports real computation stages and returns one plus two results', async () => {
    const stages: string[] = []
    const result = await fixtureAnalysisService.run(input, (stage) => stages.push(stage))

    expect(stages).toEqual(['updating', 'filtering', 'risk', 'ranking'])
    expect(result.alternatives).toHaveLength(2)
    expect(result.primary.totalScore).toBeGreaterThanOrEqual(result.alternatives[0].totalScore)
  })

  it('excludes a stale high-scoring asset before ranking', async () => {
    const result = await fixtureAnalysisService.run(input, () => undefined)
    expect([result.primary, ...result.alternatives].map((item) => item.assetId)).not.toContain('stale-leader')
    expect(result.excludedAssetCount).toBeGreaterThan(0)
  })

  it('lets risk preference change the rank of a high-volatility asset', async () => {
    const lowRisk = await fixtureAnalysisService.run({ ...input, riskProfile: 'low' }, () => undefined)
    const highRisk = await fixtureAnalysisService.run({ ...input, riskProfile: 'high' }, () => undefined)

    expect([lowRisk.primary, ...lowRisk.alternatives].map((item) => item.assetId)).not.toContain('high-volatility')
    expect([highRisk.primary, ...highRisk.alternatives].map((item) => item.assetId)).toContain('high-volatility')
  })
})
