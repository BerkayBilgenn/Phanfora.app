import type {
  AnalysisInput,
  Horizon,
  MarketCandidate,
  QualityGateFailure,
  ScoreResult,
} from '@phanfora/domain';

const weights: Record<Horizon, Record<keyof MarketCandidate['dimensions'], number>> = {
  daily: { trend: 0.15, momentum: 0.3, liquidity: 0.25, riskFit: 0.2, marketConditions: 0.1 },
  weekly: { trend: 0.25, momentum: 0.25, liquidity: 0.2, riskFit: 0.2, marketConditions: 0.1 },
  monthly: { trend: 0.3, momentum: 0.15, liquidity: 0.15, riskFit: 0.25, marketConditions: 0.15 },
};

export type ScoringOutcome =
  | { ok: true; value: ScoreResult }
  | QualityGateFailure;

function qualityFailure(candidate: MarketCandidate): QualityGateFailure | null {
  if (candidate.quality.freshness === 'stale') {
    return { ok: false, assetId: candidate.asset.id, reason: 'STALE_DATA' };
  }
  if (candidate.quality.completeness < 0.9) {
    return { ok: false, assetId: candidate.asset.id, reason: 'INCOMPLETE_DATA' };
  }
  if (candidate.quality.integrity === 'suspect') {
    return { ok: false, assetId: candidate.asset.id, reason: 'SUSPECT_DATA' };
  }
  if (candidate.asset.liquidityTier === 'low') {
    return { ok: false, assetId: candidate.asset.id, reason: 'LOW_LIQUIDITY' };
  }
  return null;
}

function riskPenalty(candidate: MarketCandidate, input: AnalysisInput): number {
  if (input.riskProfile === 'low' && candidate.volatility > 50) {
    return (candidate.volatility - 50) * 0.4;
  }
  if (input.riskProfile === 'balanced' && candidate.volatility > 75) {
    return (candidate.volatility - 75) * 0.2;
  }
  return 0;
}

function explanationKeys(candidate: MarketCandidate): readonly string[] {
  const ranked = [
    ['TREND_STRONG', candidate.dimensions.trend],
    ['MOMENTUM_CONFIRMED', candidate.dimensions.momentum],
    ['LIQUIDITY_HEALTHY', candidate.dimensions.liquidity],
    ['RISK_PROFILE_FIT', candidate.dimensions.riskFit],
    ['MARKET_REGIME_SUPPORTIVE', candidate.dimensions.marketConditions],
  ] as const;
  return [...ranked].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([key]) => key);
}

export function calculateScore(
  candidate: MarketCandidate,
  input: AnalysisInput,
  calculatedAt = new Date().toISOString(),
): ScoringOutcome {
  const failure = qualityFailure(candidate);
  if (failure) return failure;

  const horizonWeights = weights[input.horizon];
  const baseScore = (Object.keys(horizonWeights) as (keyof typeof horizonWeights)[])
    .reduce((sum, key) => sum + candidate.dimensions[key] * horizonWeights[key], 0);
  const totalScore = Math.max(0, Math.min(100, Math.round(baseScore - riskPenalty(candidate, input))));
  const confidenceLevel = candidate.quality.completeness >= 0.98 ? 'high' : 'medium';
  const primaryRisk = candidate.volatility >= 65
    ? 'VOLATILITY_HIGH'
    : candidate.dimensions.momentum >= 86
      ? 'MOMENTUM_EXTENDED'
      : 'MARKET_REVERSAL';

  return {
    ok: true,
    value: Object.freeze({
      asset: candidate.asset,
      price: candidate.price,
      convertedPrice: candidate.price,
      changePercent: candidate.changePercent,
      totalScore,
      confidenceLevel,
      dimensionScores: candidate.dimensions,
      reasons: explanationKeys(candidate),
      primaryRisk,
      marketStatus: candidate.marketStatus,
      series: candidate.series,
      source: candidate.source,
      observedAt: candidate.observedAt,
      freshness: candidate.quality.freshness,
      methodologyVersion: 'phanfora-v1',
      dataSnapshotId: candidate.snapshotId,
      calculatedAt,
      dataMode: candidate.dataMode,
    }),
  };
}
