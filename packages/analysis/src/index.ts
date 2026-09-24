import { convertMoney } from '@phanfora/currency';
import type {
  AnalysisInput,
  AnalysisResult,
  QualityGateFailure,
  ScoreResult,
} from '@phanfora/domain';
import type { FxRateProvider, MarketDataProvider } from '@phanfora/market-data';
import { calculateScore } from '@phanfora/scoring';

export interface AnalysisServiceDependencies {
  marketData: MarketDataProvider;
  fxRates: FxRateProvider;
  clock: () => string;
  createId: () => string;
  idempotencyStore: Map<string, AnalysisResult>;
}

export class AnalysisService {
  constructor(private readonly dependencies: AnalysisServiceDependencies) {}

  async create(input: AnalysisInput, idempotencyKey: string): Promise<AnalysisResult> {
    const existing = this.dependencies.idempotencyStore.get(idempotencyKey);
    if (existing) return existing;

    const [candidates, fxSnapshot] = await Promise.all([
      this.dependencies.marketData.getCandidates(input.horizon),
      this.dependencies.fxRates.getRates('USD', [input.amount.currency]),
    ]);
    const calculatedAt = this.dependencies.clock();
    const accepted: ScoreResult[] = [];
    const excluded: QualityGateFailure[] = [];

    for (const candidate of candidates) {
      const outcome = calculateScore(candidate, input, calculatedAt);
      if (!outcome.ok) {
        excluded.push(outcome);
        continue;
      }
      accepted.push(Object.freeze({
        ...outcome.value,
        convertedPrice: convertMoney(
          outcome.value.price,
          input.amount.currency,
          fxSnapshot,
        ),
      }));
    }

    accepted.sort((left, right) => right.totalScore - left.totalScore);
    const [primary, alternativeOne, alternativeTwo] = accepted;
    if (!primary || !alternativeOne || !alternativeTwo) {
      throw new Error('INSUFFICIENT_QUALIFIED_ASSETS');
    }

    const result: AnalysisResult = Object.freeze({
      id: this.dependencies.createId(),
      status: 'completed',
      input: Object.freeze(input),
      primary,
      alternatives: Object.freeze([alternativeOne, alternativeTwo]) as readonly [
        ScoreResult,
        ScoreResult,
      ],
      excluded: Object.freeze(excluded),
      methodologyVersion: 'phanfora-v1',
      dataSnapshotId: `analysis:${primary.dataSnapshotId}:${fxSnapshot.id}`,
      calculatedAt,
      dataMode: primary.dataMode,
      fxSnapshot,
    });

    this.dependencies.idempotencyStore.set(idempotencyKey, result);
    return result;
  }
}
