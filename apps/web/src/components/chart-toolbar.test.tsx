import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChartToolbar } from './chart-toolbar';

function props(overrides: Partial<React.ComponentProps<typeof ChartToolbar>> = {}) {
  return {
    horizon: 'daily' as const,
    onHorizonChange: vi.fn(),
    indicators: [] as readonly ('sma20' | 'sma50')[],
    onIndicatorsChange: vi.fn(),
    drawingMode: false,
    onDrawingModeChange: vi.fn(),
    drawingCount: 0,
    onClearDrawings: vi.fn(),
    motion: 'system' as const,
    onMotionChange: vi.fn(),
    fullscreenTarget: { current: null },
    ...overrides,
  };
}

describe('ChartToolbar', () => {
  it('changes timeframe, indicators, drawing and motion through real controls', async () => {
    const user = userEvent.setup();
    const value = props({ drawingCount: 2 });
    render(<ChartToolbar {...value} />);

    await user.click(screen.getByRole('button', { name: 'Haftalık' }));
    expect(value.onHorizonChange).toHaveBeenCalledWith('weekly');
    await user.click(screen.getByText('Göstergeler'));
    await user.click(screen.getByRole('checkbox', { name: 'SMA 20' }));
    expect(value.onIndicatorsChange).toHaveBeenCalledWith(['sma20']);
    await user.click(screen.getByRole('button', { name: 'Trend çizgisi çiz' }));
    expect(value.onDrawingModeChange).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole('button', { name: 'Çizimleri temizle' }));
    expect(value.onClearDrawings).toHaveBeenCalled();
    await user.click(screen.getByRole('checkbox', { name: 'Hareketi azalt' }));
    expect(value.onMotionChange).toHaveBeenCalledWith('reduced');
  });

  it('hides fullscreen when the browser does not support it', () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });
    render(<ChartToolbar {...props()} />);
    expect(screen.queryByRole('button', { name: 'Grafiği tam ekran aç' })).not.toBeInTheDocument();
  });

  it('opens the chart target in fullscreen when supported', async () => {
    const user = userEvent.setup();
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const target = document.createElement('div');
    Object.defineProperty(target, 'requestFullscreen', { configurable: true, value: requestFullscreen });
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    render(<ChartToolbar {...props({ fullscreenTarget: { current: target } })} />);

    await user.click(screen.getByRole('button', { name: 'Grafiği tam ekran aç' }));

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });
});
