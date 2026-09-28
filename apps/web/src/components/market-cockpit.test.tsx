import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarketCockpit } from './market-cockpit';

const api = vi.hoisted(() => ({ fetchQuotes: vi.fn(), fetchCurrencies: vi.fn(), createAnalysis: vi.fn() }));
vi.mock('../lib/api', () => api);

const candidate = {
  asset: { id: 'crypto:btc-usd', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', exchangeOrVenue: 'Kraken', quoteCurrency: 'USD', liquidityTier: 'high' },
  price: { amount: '105', currency: 'USD' }, changePercent: '1.2',
  dimensions: { trend: 61, momentum: 56, liquidity: 90, riskFit: 70, marketConditions: 58 },
  volatility: 20, quality: { freshness: 'live', completeness: 1, integrity: 'verified' },
  marketStatus: 'continuous',
  series: [{ time: '2026-09-28T08:00:00.000Z', open: '100', high: '106', low: '99', close: '105', volume: '40' }],
  source: 'Kraken', observedAt: '2026-09-28T08:00:00.000Z', snapshotId: 'real-1', dataMode: 'live',
};

describe('MarketCockpit', () => {
  it('renders provider price and source without illustrative stocks', async () => {
    api.fetchQuotes.mockResolvedValue({ items: [candidate], dataMode: 'public' });
    api.fetchCurrencies.mockRejectedValue(new Error('offline'));
    render(<MarketCockpit />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Kraken · BTC' })).toBeInTheDocument());
    expect(screen.getAllByText('Kraken', { exact: true }).length).toBeGreaterThan(0);
    expect(screen.queryByText('NVDA')).not.toBeInTheDocument();
  });

  it('shows provider failure rather than a made-up quote', async () => {
    api.fetchQuotes.mockRejectedValue(new Error('Veri kaynağına ulaşılamadı'));
    render(<MarketCockpit />);
    await waitFor(() => expect(screen.getByText('Veri kaynağına ulaşılamadı')).toBeInTheDocument());
    expect(screen.queryByText('875,32')).not.toBeInTheDocument();
  });
});
