import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { PricePoint } from '@phanfora/domain';

import { MarketChart } from './market-chart';

const series: readonly PricePoint[] = [
  { time: '2026-09-22T00:00:00.000Z', open: '96', high: '101', low: '95', close: '98', volume: '900' },
  { time: '2026-09-23T00:00:00.000Z', open: '98', high: '103', low: '97', close: '102', volume: '1200' },
  { time: '2026-09-24T00:00:00.000Z', open: '102', high: '105', low: '100', close: '104', volume: '1400' },
];

function pointerDown(element: Element, clientX: number, clientY: number) {
  fireEvent(element, new MouseEvent('pointerdown', {
    bubbles: true,
    clientX,
    clientY,
  }));
}

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

  it('converts two drawing selections into a real trend line', () => {
    const onTrendLinesChange = vi.fn();
    render(<MarketChart
      name="Bitcoin"
      horizon="weekly"
      series={series}
      drawingMode
      trendLines={[]}
      onTrendLinesChange={onTrendLinesChange}
    />);
    const chart = screen.getByRole('img', { name: /Bitcoin haftalık mum grafiği/ });
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 1000, bottom: 440,
      width: 1000, height: 440, toJSON: () => ({}),
    });

    pointerDown(chart, 200, 120);
    pointerDown(chart, 800, 220);

    expect(onTrendLinesChange).toHaveBeenCalledWith([
      expect.objectContaining({ startIndex: 0, endIndex: 2 }),
    ]);
  });

  it('lets keyboard users select and delete an existing trend line', async () => {
    const user = userEvent.setup();
    const onTrendLinesChange = vi.fn();
    render(<MarketChart
      name="Bitcoin"
      horizon="weekly"
      series={series}
      trendLines={[{
        id: 'line-1', startIndex: 0, startPrice: 98, endIndex: 2, endPrice: 104,
      }]}
      onTrendLinesChange={onTrendLinesChange}
    />);

    await user.click(screen.getByRole('button', { name: 'Trend çizgisi 1 seç' }));
    await user.click(screen.getByRole('button', { name: 'Seçili trend çizgisini sil' }));

    expect(onTrendLinesChange).toHaveBeenCalledWith([]);
  });
});
