import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MarketCandidate } from '@phanfora/domain';
import { ExploreCockpit } from './explore-cockpit';

const item: MarketCandidate = {
  asset: { id: 'crypto:btc-usd', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', exchangeOrVenue: 'Kraken', quoteCurrency: 'USD', liquidityTier: 'high' },
  price: { amount: '86400', currency: 'USD' },
  changePercent: '2.1',
  dimensions: { trend: 50, momentum: 50, liquidity: 50, riskFit: 50, marketConditions: 50 },
  volatility: 12,
  quality: { freshness: 'live', completeness: 1, integrity: 'verified' },
  marketStatus: 'continuous',
  series: [
    { time: '2026-10-02T00:00:00.000Z', close: '84000', volume: '1' },
    { time: '2026-10-02T01:00:00.000Z', close: '86400', volume: '1' },
  ],
  source: 'Kraken',
  observedAt: '2026-10-02T01:00:00.000Z',
  snapshotId: 't',
  dataMode: 'live',
};

describe('ExploreCockpit chart horizon', () => {
  it('lets the user switch the selected series between 1G, 1H and 1A', async () => {
    const onHorizonChange = vi.fn();
    render(
      <ExploreCockpit
        items={[item]}
        loading={false}
        error=""
        onRefresh={() => {}}
        watchlist={[]}
        onWatch={() => {}}
        horizon="daily"
        onHorizonChange={onHorizonChange}
      />,
    );
    expect(screen.getByRole('button', { name: '1G' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: '1H' }));
    expect(onHorizonChange).toHaveBeenCalledWith('weekly');
    await userEvent.click(screen.getByRole('button', { name: '1A' }));
    expect(onHorizonChange).toHaveBeenCalledWith('monthly');
  });
});
