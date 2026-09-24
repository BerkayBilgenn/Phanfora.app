import { describe, expect, it } from 'vitest';

import type { AnalysisInput, MarketCandidate } from '@phanfora/domain';

import { calculateScore } from './index';

const input: AnalysisInput = {
  amount: { amount: '25000', currency: 'TRY' },
  horizon: 'daily',
  riskProfile: 'balanced',
  locale: 'tr-TR',
};

const candidate: MarketCandidate = {
  asset: {
    id: 'stock:test',
    symbol: 'TST',
    name: 'Test Asset',
    assetClass: 'stock',
    exchangeOrVenue: 'TEST',
    quoteCurrency: 'USD',
    liquidityTier: 'high',
  },
  price: { amount: '100', currency: 'USD' },
  changePercent: '1.25',
  dimensions: {
    trend: 80,
    momentum: 70,
    liquidity: 90,
    riskFit: 60,
    marketConditions: 75,
  },
  volatility: 35,
  quality: { freshness: 'fixture', completeness: 1, integrity: 'verified' },
  marketStatus: 'open',
  series: Object.freeze([
    { time: '2026-09-22T00:00:00.000Z', close: '98', volume: '1000' },
    { time: '2026-09-23T00:00:00.000Z', close: '100', volume: '1100' },
  ]),
  source: 'Test Fixture',
  observedAt: '2026-09-24T09:00:00.000Z',
  snapshotId: 'snapshot-test',
  dataMode: 'fixture',
};

describe('Phanfora score v1', () => {
  it('applies the daily horizon weights exactly', () => {
    const result = calculateScore(candidate, input, '2026-09-24T09:01:00.000Z');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.totalScore).toBe(75);
  });

  it('applies the monthly horizon weights exactly', () => {
    const result = calculateScore(
      candidate,
      { ...input, horizon: 'monthly' },
      '2026-09-24T09:01:00.000Z',
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.totalScore).toBe(74);
  });

  it('penalizes volatility for low risk without changing the dimensions', () => {
    const result = calculateScore(
      { ...candidate, volatility: 70 },
      { ...input, riskProfile: 'low' },
      '2026-09-24T09:01:00.000Z',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.totalScore).toBe(67);
      expect(result.value.dimensionScores).toEqual(candidate.dimensions);
    }
  });

  it('keeps score and confidence as independent signals', () => {
    const result = calculateScore(
      { ...candidate, quality: { ...candidate.quality, completeness: 0.91 } },
      input,
      '2026-09-24T09:01:00.000Z',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.totalScore).toBe(75);
      expect(result.value.confidenceLevel).toBe('medium');
    }
  });

  it.each([
    [{ freshness: 'stale', completeness: 1, integrity: 'verified' }, 'STALE_DATA'],
    [{ freshness: 'fixture', completeness: 0.7, integrity: 'verified' }, 'INCOMPLETE_DATA'],
    [{ freshness: 'fixture', completeness: 1, integrity: 'suspect' }, 'SUSPECT_DATA'],
  ] as const)('blocks unsafe quality metadata %o', (quality, reason) => {
    const result = calculateScore({ ...candidate, quality }, input, '2026-09-24T09:01:00.000Z');
    expect(result).toEqual({ ok: false, assetId: 'stock:test', reason });
  });

  it('blocks low liquidity even for a high-risk profile', () => {
    const result = calculateScore(
      { ...candidate, asset: { ...candidate.asset, liquidityTier: 'low' } },
      { ...input, riskProfile: 'high' },
      '2026-09-24T09:01:00.000Z',
    );
    expect(result).toEqual({
      ok: false,
      assetId: 'stock:test',
      reason: 'LOW_LIQUIDITY',
    });
  });
});
