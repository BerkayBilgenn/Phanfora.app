'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchNews, type NewsResponse } from './api';

const empty: NewsResponse = { items: [], updatedAt: null, stale: false, unavailableSources: [] };

export function useNews() {
  const [news, setNews] = useState<NewsResponse>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setNews(await fetchNews());
      setError('');
    } catch {
      setError('Haber kaynaklarına şu anda ulaşılamıyor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [refresh]);

  return { ...news, loading, error };
}
