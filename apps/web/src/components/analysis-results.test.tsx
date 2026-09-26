import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { AnalysisResult, ScoreResult } from '@phanfora/domain';

import { AnalysisResults } from './analysis-results';

function scoredAsset(symbol: string, name: string, score: number): ScoreResult {
  return {
    asset: {
      id: `asset:${symbol.toLowerCase()}`, symbol, name, assetClass: 'crypto',
      exchangeOrVenue: 'Global', quoteCurrency: 'USD', liquidityTier: 'high',
    },
    price: { amount: '100', currency: 'USD' },
    convertedPrice: { amount: '4250', currency: 'TRY' },
    changePercent: '2.40',
    totalScore: score,
    confidenceLevel: 'high',
    dimensionScores: { trend: 88, momentum: 84, liquidity: 96, riskFit: 68, marketConditions: 82 },
    reasons: ['TREND_STRONG', 'LIQUIDITY_HEALTHY', 'MOMENTUM_CONFIRMED'],
    primaryRisk: 'VOLATILITY_HIGH',
    marketStatus: 'continuous',
    series: [
      { time: '2026-09-22T00:00:00.000Z', open: '94', high: '98', low: '93', close: '96', volume: '1000' },
      { time: '2026-09-23T00:00:00.000Z', open: '96', high: '102', low: '95', close: '100', volume: '1200' },
    ],
    source: 'Phanfora deterministic fixture',
    observedAt: '2026-09-24T09:00:00.000Z',
    freshness: 'fixture',
    methodologyVersion: 'phanfora-v1',
    dataSnapshotId: `snapshot-${symbol}`,
    calculatedAt: '2026-09-24T09:01:00.000Z',
    dataMode: 'fixture',
  };
}

const result: AnalysisResult = {
  id: 'analysis-1', status: 'completed',
  input: { amount: { amount: '25000', currency: 'TRY' }, horizon: 'weekly', riskProfile: 'balanced', locale: 'tr-TR' },
  primary: scoredAsset('BTC', 'Bitcoin', 88),
  alternatives: [scoredAsset('XAU', 'Gold', 84), scoredAsset('AAPL', 'Apple Inc.', 81)],
  excluded: [], methodologyVersion: 'phanfora-v1', dataSnapshotId: 'analysis:snapshot',
  calculatedAt: '2026-09-24T09:01:00.000Z', dataMode: 'fixture',
  fxSnapshot: {
    id: 'fx-1', baseCurrency: 'USD', rates: { USD: '1', TRY: '42.5' },
    provider: 'Phanfora deterministic fixture', observedAt: '2026-09-24T09:00:00.000Z',
    freshness: 'fixture', dataMode: 'fixture',
  },
};

describe('AnalysisResults', () => {
  it('shows ranked opportunities with transparent fixture and risk metadata', () => {
    render(<AnalysisResults result={result} onReset={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /Bitcoin/ })).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getAllByText('Demo veri').length).toBeGreaterThan(0);
    expect(screen.getByText('Yüksek güven')).toBeInTheDocument();
    expect(screen.getByText(/Oynaklık yüksek/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Bitcoin fiyat eğilimi/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^(Al|Sat)$/ })).not.toBeInTheDocument();
  });

  it('discloses all five score dimensions and methodology', async () => {
    const user = userEvent.setup();
    render(<AnalysisResults result={result} onReset={vi.fn()} />);
    await user.click(screen.getByText('Skor nasıl hesaplandı?'));
    const breakdown = screen.getByTestId('score-breakdown');
    expect(within(breakdown).getAllByTestId('dimension-row')).toHaveLength(5);
    expect(within(breakdown).getByText('phanfora-v1')).toBeInTheDocument();
  });
});
