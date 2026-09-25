import { z } from 'zod'

export const currencySchema = z.enum(['USD', 'EUR', 'TRY', 'GBP'])
export const horizonSchema = z.enum(['daily', 'weekly', 'monthly'])
export const riskProfileSchema = z.enum(['low', 'balanced', 'high'])

export const analysisInputSchema = z.object({
  amount: z.string().regex(/^(?!0+(?:\.0+)?$)\d+(?:\.\d{1,2})?$/),
  currency: currencySchema,
  horizon: horizonSchema,
  riskProfile: riskProfileSchema,
})

export type AnalysisInput = z.infer<typeof analysisInputSchema>
export type ScoreDimension = 'trend' | 'momentum' | 'liquidity' | 'risk' | 'market'

export type DataQuality = {
  freshness: 'fresh' | 'delayed' | 'stale'
  completeness: number
}

export type Opportunity = {
  assetId: string
  symbol: string
  name: string
  assetClass: 'stock' | 'crypto' | 'commodity' | 'forex' | 'index'
  venue: string
  quoteCurrency: string
  price: number
  changePercent: number
  totalScore: number
  confidence: 'low' | 'medium' | 'high'
  dimensions: Record<ScoreDimension, number>
  scoreEvidence: {
    weights: Record<ScoreDimension, number>
    weightedScore: number
    riskPenalty: number
  }
  reasons: readonly string[]
  primaryRisk: string
  methodologyVersion: 'fixture-v1'
  observedAt: string
  quality: DataQuality
  series: readonly { time: string; value: number }[]
}

export type AnalysisResult = {
  input: AnalysisInput
  primary: Opportunity
  alternatives: readonly [Opportunity, Opportunity]
  scannedAssetCount: number
  excludedAssetCount: number
}

export function passesQualityGate(quality: DataQuality): boolean {
  return quality.freshness !== 'stale' && quality.completeness >= 0.98
}
