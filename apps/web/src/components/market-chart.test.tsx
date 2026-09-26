import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { PricePoint } from '@phanfora/domain';

import { MarketChart } from './market-chart';

const series: readonly PricePoint[] = [
  { time: '2026-09-22T00:00:00.000Z', open: '96', high: '101', low: '95', close: '98', volume: '900' },
  { time: '2026-09-23T00:00:00.000Z', open: '98', high: '103', low: '97', close: '102', volume: '1200' },
  { time: '2026-09-24T00:00:00.000Z', open: '102', high: '105', low: '100', close: '104', volume: '1400' },
];

describe('MarketChart', () => {
  it('renders real candles, volume and an accessible price summary', () => {
    render(<MarketChart name="Bitcoin" horizon="weekly" series={series} />);

    expect(screen.getByRole('img', { name: /Bitcoin haftalık mum grafiği/ })).toBeInTheDocument();
    expect(screen.getByText(/3 veri noktası/, { selector: 'figcaption' })).toHaveTextContent('98');
    expect(screen.getByText(/3 veri noktası/, { selector: 'figcaption' })).toHaveTextContent('104');
    expect(screen.getAllByRole('button', { name: /mumu/ })).toHaveLength(3);
  });

  it('announces the selected candle through a stable status region', async () => {
    const user = userEvent.setup();
    render(<MarketChart name="Bitcoin" horizon="weekly" series={series} />);

    await user.click(screen.getAllByRole('button', { name: /mumu/ })[1]!);

    expect(screen.getByRole('status')).toHaveTextContent('Açılış 98');
    expect(screen.getByRole('status')).toHaveTextContent('Kapanış 102');
    expect(screen.getByRole('status')).toHaveTextContent('Hacim 1.200');
  });
});
