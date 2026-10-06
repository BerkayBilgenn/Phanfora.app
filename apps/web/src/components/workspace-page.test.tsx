import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspacePage } from './workspace-page';

const quotes = vi.hoisted(() => {
  const btc = {
    asset: { id: 'crypto:btc-usd', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto' as const, exchangeOrVenue: 'Kraken', quoteCurrency: 'USD', liquidityTier: 'high' as const },
    price: { amount: '86400', currency: 'USD' },
    changePercent: '2.1',
    dimensions: { trend: 61, momentum: 56, liquidity: 90, riskFit: 70, marketConditions: 58 },
    volatility: 12,
    quality: { freshness: 'live' as const, completeness: 1, integrity: 'verified' as const },
    marketStatus: 'continuous' as const,
    series: [{ time: '2026-10-02T00:00:00.000Z', close: '86400', volume: '1' }],
    source: 'Kraken',
    observedAt: '2026-10-02T00:00:00.000Z',
    snapshotId: 't',
    dataMode: 'live' as const,
  };
  return [
    btc,
    { ...btc, asset: { ...btc.asset, id: 'crypto:ada-usd', symbol: 'ADA', name: 'Cardano' }, changePercent: '12' },
    { ...btc, asset: { ...btc.asset, id: 'stock:thyao-xist', symbol: 'THYAO', name: 'Türk Hava Yolları' }, changePercent: '-4.2' },
  ];
});

vi.mock('../lib/use-market', () => ({
  useMarket: () => ({
    items: quotes,
    loading: false,
    error: '',
    updatedAt: '2026-10-02T00:00:00.000Z',
    refresh: vi.fn(),
  }),
}));

vi.mock('../lib/api', () => ({
  fetchCurrencies: vi.fn().mockResolvedValue([]),
  createAnalysis: vi.fn(),
}));

describe('WorkspacePage radar', () => {
  it('renders quote freshness without crashing', () => {
    render(<WorkspacePage section="radar" />);
    expect(screen.getByRole('heading', { name: 'Piyasa haritası' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Radar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Haftalık yükselenler' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Haftalık düşenler' })).toBeInTheDocument();
    expect(document.querySelector('.workspace-radar-leaders')?.textContent).toContain('ADA');
    expect(document.querySelector('.workspace-radar-leaders')?.textContent).toContain('THYAO');
    expect(screen.getByRole('img', { name: 'Piyasa radarı' })).toBeInTheDocument();
    expect(document.querySelectorAll('circle.workspace-radar-ring').length).toBe(4);
    expect(document.querySelectorAll('.workspace-radar-tick').length).toBeGreaterThanOrEqual(24);
    expect(document.querySelector('.workspace-radar-label')?.textContent).toMatch(/BTC/);
    expect(screen.getAllByLabelText('Veri durumu: Canlı').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bitcoin/).length).toBeGreaterThan(0);
  });
});
