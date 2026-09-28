'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Horizon, MarketCandidate } from '@phanfora/domain';
import { fetchQuotes } from './api';

export function useMarket(horizon: Horizon = 'daily', refreshMs = 60_000) {
  const intervalMs = Number.isFinite(refreshMs) ? Math.min(300_000, Math.max(30_000, refreshMs)) : 60_000;
  const [items, setItems] = useState<MarketCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const refresh = useCallback(async () => {
    try {
      const response = await fetchQuotes(horizon);
      if (response.dataMode === 'fixture' && process.env.NEXT_PUBLIC_E2E_FIXTURE !== '1') {
        throw new Error('Örnek veri üretim ekranında gösterilemez.');
      }
      setItems(response.items);
      setUpdatedAt(new Date().toISOString());
      setError('');
    } catch (caught) {
      setItems([]);
      setError(caught instanceof Error ? caught.message : 'Piyasa verisi alınamadı.');
    } finally { setLoading(false); }
  }, [horizon]);
  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, intervalMs);
    return () => { window.clearTimeout(initial); window.clearInterval(id); };
  }, [refresh, intervalMs]);
  return { items, loading, error, updatedAt, refresh };
}
