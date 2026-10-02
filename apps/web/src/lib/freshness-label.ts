import type { DataMode, Freshness } from '@phanfora/domain';

export type FreshnessTone = 'live' | 'delayed' | 'daily' | 'stale';

export function freshnessBadge(freshness: Freshness, dataMode: DataMode): { text: string; tone: FreshnessTone } {
  if (freshness === 'live' || dataMode === 'live') return { text: 'Canlı', tone: 'live' };
  if (freshness === 'end-of-day' || dataMode === 'end-of-day') return { text: 'Günlük', tone: 'daily' };
  if (freshness === 'stale') return { text: 'Eski', tone: 'stale' };
  return { text: 'Gecikmeli', tone: 'delayed' };
}
