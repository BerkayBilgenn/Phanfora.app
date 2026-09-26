'use client';

import type { RefObject } from 'react';

import type { Horizon } from '@phanfora/domain';

interface ChartToolbarProps {
  horizon: Horizon;
  onHorizonChange: (value: Horizon) => void;
  indicators: readonly ('sma20' | 'sma50')[];
  onIndicatorsChange: (value: readonly ('sma20' | 'sma50')[]) => void;
  drawingMode: boolean;
  onDrawingModeChange: (value: boolean) => void;
  drawingCount: number;
  onClearDrawings: () => void;
  motion: 'system' | 'reduced';
  onMotionChange: (value: 'system' | 'reduced') => void;
  fullscreenTarget: RefObject<HTMLElement | null>;
}

const horizons: readonly [Horizon, string][] = [
  ['daily', 'Günlük'],
  ['weekly', 'Haftalık'],
  ['monthly', 'Aylık'],
];

export function ChartToolbar({
  horizon,
  onHorizonChange,
  indicators,
  onIndicatorsChange,
  drawingMode,
  onDrawingModeChange,
  drawingCount,
  onClearDrawings,
  motion,
  onMotionChange,
  fullscreenTarget,
}: ChartToolbarProps) {
  const canFullscreen = typeof document !== 'undefined'
    && document.fullscreenEnabled
    && typeof fullscreenTarget.current?.requestFullscreen === 'function';

  function toggleIndicator(indicator: 'sma20' | 'sma50') {
    onIndicatorsChange(indicators.includes(indicator)
      ? indicators.filter((value) => value !== indicator)
      : [...indicators, indicator]);
  }

  return (
    <div className="chart-toolbar" aria-label="Grafik araçları">
      <div className="timeframe-controls" aria-label="Grafik zaman aralığı">
        {horizons.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={horizon === value}
            onClick={() => onHorizonChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <details className="indicator-menu">
        <summary>Göstergeler</summary>
        <div className="indicator-options">
          <label><input type="checkbox" checked={indicators.includes('sma20')} onChange={() => toggleIndicator('sma20')} /> SMA 20</label>
          <label><input type="checkbox" checked={indicators.includes('sma50')} onChange={() => toggleIndicator('sma50')} /> SMA 50</label>
        </div>
      </details>

      <button
        type="button"
        aria-pressed={drawingMode}
        onClick={() => onDrawingModeChange(!drawingMode)}
      >
        Trend çizgisi çiz
      </button>

      {drawingCount > 0 ? <button type="button" onClick={onClearDrawings}>Çizimleri temizle</button> : null}

      <label className="motion-control">
        <input
          type="checkbox"
          checked={motion === 'reduced'}
          onChange={(event) => onMotionChange(event.target.checked ? 'reduced' : 'system')}
        />
        Hareketi azalt
      </label>

      {canFullscreen ? (
        <button type="button" onClick={() => void fullscreenTarget.current?.requestFullscreen()}>
          Grafiği tam ekran aç
        </button>
      ) : null}
    </div>
  );
}
