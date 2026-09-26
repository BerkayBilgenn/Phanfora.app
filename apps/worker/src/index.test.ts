import { describe, expect, it } from 'vitest';

import { AnalysisService } from '@phanfora/analysis';
import { FixtureFxRateProvider, FixtureMarketDataProvider } from '@phanfora/market-data';

import { processAnalysisJob } from './index';

function analysis() {
  return new AnalysisService({
    marketData: new FixtureMarketDataProvider(),
    fxRates: new FixtureFxRateProvider(),
    clock: () => '2026-09-24T09:01:00.000Z',
    createId: () => 'worker-analysis-id',
    idempotencyStore: new Map(),
  });
}

describe('analysis worker boundary', () => {
  it('processes a serialized valid analysis job', async () => {
    const result = await processAnalysisJob({
      idempotencyKey: 'worker-request-1',
      body: {
        amount: '25000', currency: 'TRY', horizon: 'weekly',
        riskProfile: 'balanced', locale: 'tr-TR',
      },
    }, analysis());
    expect(result.id).toBe('worker-analysis-id');
    expect(result.methodologyVersion).toBe('phanfora-v1');
    expect(result.primary.totalScore).toBeGreaterThanOrEqual(
      result.alternatives[0].totalScore,
    );
  });

  it('rejects malformed jobs before analysis execution', async () => {
    await expect(processAnalysisJob({
      idempotencyKey: 'short',
      body: { amount: '-5' },
    }, analysis())).rejects.toThrow('MALFORMED_ANALYSIS_JOB');
  });
});
