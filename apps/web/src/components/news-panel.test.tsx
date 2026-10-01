import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NewsPanel } from './news-panel';

const api = vi.hoisted(() => ({ fetchNews: vi.fn() }));
vi.mock('../lib/api', () => api);
beforeEach(() => api.fetchNews.mockReset());

describe('NewsPanel', () => {
  it('shows source links and filters actual items by category', async () => {
    api.fetchNews.mockResolvedValue({
      items: [
        { title: 'Bitcoin and Ethereum report', url: 'https://www.coindesk.com/crypto', source: 'CoinDesk', category: 'crypto', publishedAt: '2026-10-01T08:00:00.000Z' },
        { title: 'Ethereum network update', url: 'https://www.coindesk.com/ethereum', source: 'CoinDesk', category: 'crypto', publishedAt: '2026-10-01T07:30:00.000Z' },
        { title: 'Energy report', url: 'https://www.eia.gov/energy', source: 'EIA', category: 'commodity', publishedAt: '2026-10-01T07:00:00.000Z' },
      ],
      updatedAt: '2026-10-01T08:01:00.000Z', stale: false, unavailableSources: [],
    });
    const user = userEvent.setup();
    const view = render(<NewsPanel />);
    const crypto = await screen.findByRole('link', { name: /Bitcoin and Ethereum report/ });
    expect(crypto).toHaveAttribute('target', '_blank');
    expect(view.container.querySelector('img[src="/asset-logos/btc.svg"]')).toBeInTheDocument();
    expect(view.container.querySelector('img[src="/asset-logos/eth.svg"]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Energy report/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Emtia' }));
    expect(screen.queryByRole('link', { name: /Bitcoin and Ethereum report/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Energy report/ })).toBeInTheDocument();
  });

  it('shows every headline in a keyboard-scrollable combined feed', async () => {
    api.fetchNews.mockResolvedValue({
      items: [
        ...Array.from({ length: 8 }, (_, index) => ({ title: `Crypto ${index}`, url: `https://www.coindesk.com/${index}`, source: 'CoinDesk', category: 'crypto', publishedAt: `2026-10-01T09:0${index}:00.000Z` })),
        { title: 'Equity bulletin', url: 'https://www.nasdaqtrader.com/equity', source: 'Nasdaq Trader', category: 'stock', publishedAt: '2026-10-01T08:00:00.000Z' },
        { title: 'Energy bulletin', url: 'https://www.eia.gov/energy', source: 'EIA', category: 'commodity', publishedAt: '2026-10-01T07:00:00.000Z' },
      ],
      updatedAt: '2026-10-01T09:10:00.000Z', stale: false, unavailableSources: [],
    });
    render(<NewsPanel />);
    expect(await screen.findByRole('link', { name: /Equity bulletin/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Energy bulletin/ })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Crypto [0-7]/ })).toHaveLength(8);
    expect(screen.getByRole('region', { name: 'Haber akışı' })).toHaveAttribute('tabindex', '0');
  });

  it('checks for new headlines while the page stays open', async () => {
    vi.useFakeTimers();
    api.fetchNews.mockResolvedValue({ items: [], updatedAt: null, stale: false, unavailableSources: [] });
    const view = render(<NewsPanel />);
    try {
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(api.fetchNews).toHaveBeenCalledTimes(1);
      await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
      expect(api.fetchNews).toHaveBeenCalledTimes(2);
    } finally {
      view.unmount();
      vi.useRealTimers();
    }
  });
});
