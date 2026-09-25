import type { AnalysisService } from './analysis-service'
import type { AnalysisInput, Opportunity, ScoreDimension } from './analysis-contract'
import { passesQualityGate } from './analysis-contract'
import { fixtureOpportunities } from './fixtures'

const HORIZON_WEIGHTS: Record<AnalysisInput['horizon'], Record<ScoreDimension, number>> = {
  daily: { trend: 0.15, momentum: 0.30, liquidity: 0.25, risk: 0.20, market: 0.10 },
  weekly: { trend: 0.25, momentum: 0.25, liquidity: 0.20, risk: 0.20, market: 0.10 },
  monthly: { trend: 0.30, momentum: 0.15, liquidity: 0.15, risk: 0.25, market: 0.15 },
}

function scoreForInput(asset: Opportunity, input: AnalysisInput): Opportunity {
  const weights = HORIZON_WEIGHTS[input.horizon]
  const weighted = (Object.keys(weights) as ScoreDimension[]).reduce(
    (sum, dimension) => sum + asset.dimensions[dimension] * weights[dimension],
    0,
  )
  const riskFloor = input.riskProfile === 'low' ? 80 : input.riskProfile === 'balanced' ? 65 : 45
  const riskMultiplier = input.riskProfile === 'low' ? 0.35 : input.riskProfile === 'balanced' ? 0.20 : 0.10
  const penalty = Math.max(0, riskFloor - asset.dimensions.risk) * riskMultiplier
  const totalScore = Math.max(0, Math.min(100, Math.round(weighted - penalty)))
  return {
    ...asset,
    totalScore,
    scoreEvidence: {
      weights: Object.fromEntries(Object.entries(weights).map(([dimension, weight]) => [dimension, weight * 100])) as Record<ScoreDimension, number>,
      weightedScore: weighted,
      riskPenalty: penalty,
    },
  }
}

export class InsufficientResultsError extends Error {
  constructor() {
    super('insufficient-results')
    this.name = 'InsufficientResultsError'
  }
}

export const fixtureAnalysisService: AnalysisService = {
  async run(input, onStage) {
    const updated = fixtureOpportunities.map((asset) => ({ ...asset }))
    onStage('updating')

    const eligible = updated.filter((asset) => passesQualityGate(asset.quality))
    onStage('filtering')

    const riskAdjusted = eligible.map((asset) => scoreForInput(asset, input))
    onStage('risk')

    const ranked = riskAdjusted.toSorted((a, b) => b.totalScore - a.totalScore)
    onStage('ranking')

    if (ranked.length < 3) throw new InsufficientResultsError()

    return {
      input,
      primary: ranked[0],
      alternatives: [ranked[1], ranked[2]],
      scannedAssetCount: fixtureOpportunities.length,
      excludedAssetCount: fixtureOpportunities.length - eligible.length,
    }
  },
}
