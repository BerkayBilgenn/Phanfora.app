import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MarketCockpit } from './market-cockpit';

const api = vi.hoisted(() => ({ fetchQuotes: vi.fn(), fetchNews: vi.fn(), fetchAssets: vi.fn() }));
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
    api.fetchNews.mockResolvedValue({ items: [{ title: 'Bitcoin market update', url: 'https://www.coindesk.com/story', publishedAt: '2026-10-01T08:00:00.000Z', category: 'crypto', source: 'CoinDesk' }], updatedAt: '2026-10-01T08:01:00.000Z', stale: false, unavailableSources: [] });
    const view = render(<MarketCockpit />);
    await waitFor(() => expect(view.container.querySelector('img[src="/asset-logos/btc.svg"]')).toBeInTheDocument());
    expect(screen.getAllByText('$105,00').length).toBeGreaterThan(0);
    expect(await screen.findByRole('link', { name: /Bitcoin market update/ })).toHaveAttribute('href', 'https://www.coindesk.com/story');
    expect(screen.getAllByText('Kraken', { exact: true }).length).toBeGreaterThan(0);
    expect(screen.queryByText('NVDA')).not.toBeInTheDocument();
  });

  it('shows provider failure rather than a made-up quote', async () => {
    api.fetchQuotes.mockRejectedValue(new Error('Veri kaynağına ulaşılamadı'));
    api.fetchNews.mockResolvedValue({ items: [], updatedAt: null, stale: false, unavailableSources: [] });
    render(<MarketCockpit />);
    await waitFor(() => expect(screen.getByText('Veri kaynağına ulaşılamadı')).toBeInTheDocument());
    expect(screen.queryByText('875,32')).not.toBeInTheDocument();
  });

  it('adds a provider asset to the overview and keeps it after refresh', async () => {
    localStorage.clear();
    const doge = { ...candidate, asset: { ...candidate.asset, id: 'crypto:doge-usd', symbol: 'DOGE', name: 'Dogecoin' } };
    api.fetchAssets.mockResolvedValue([candidate.asset, doge.asset]);
    api.fetchQuotes.mockImplementation(async (_horizon: string, ids: string[] = []) => ({
      items: ids.includes(doge.asset.id) ? [candidate, doge] : [candidate], dataMode: 'public',
    }));
    api.fetchNews.mockResolvedValue({ items: [], updatedAt: null, stale: false, unavailableSources: [] });
    const user = userEvent.setup();
    const view = render(<MarketCockpit />);
    await waitFor(() => expect(screen.getAllByText('Bitcoin').length).toBeGreaterThan(0));
    await user.click(screen.getByRole('button', { name: 'İnceleme alanına varlık ekle' }));
    await user.type(screen.getByRole('textbox', { name: 'Eklenecek varlık ara' }), 'DOGE');
    await user.click(await screen.findByRole('button', { name: 'Dogecoin ekle' }));
    await waitFor(() => expect(api.fetchQuotes).toHaveBeenCalledWith('monthly', ['crypto:btc-usd', 'crypto:doge-usd']));
    await waitFor(() => expect(view.container.querySelectorAll('.ph-asset-row')).toHaveLength(2));
    view.unmount();
    const restored = render(<MarketCockpit />);
    await waitFor(() => expect(restored.container.querySelectorAll('.ph-asset-row')).toHaveLength(2));
  });
});
