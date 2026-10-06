import type { MarketCandidate } from '@phanfora/domain';

export type RadarPoint = {
  id: string;
  symbol: string;
  label: string;
  x: number;
  y: number;
  up: boolean;
};

export const RADAR_TICKS = 24;

function angleFor(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 360) * (Math.PI / 180);
}

function radiusFor(id: string, change: number) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const slot = ((hash >>> 8) % 1000) / 1000;
  const mag = Math.min(20, Math.abs(Number.isFinite(change) ? change : 0)) / 20;
  return 0.3 + (slot * 0.48 + mag * 0.22) * 0.92;
}

export function radarTickAngles(count = RADAR_TICKS) {
  return Array.from({ length: count }, (_, index) => (index / count) * Math.PI * 2);
}

export function radarPoints(items: readonly MarketCandidate[]): RadarPoint[] {
  return items.map((item) => {
    const change = Number(item.changePercent);
    const radius = radiusFor(item.asset.id, change);
    const angle = angleFor(item.asset.id);
    return {
      id: item.asset.id,
      symbol: item.asset.symbol,
      label: item.asset.symbol.replace(/[^A-Za-z0-9]/g, '').slice(0, 4) || item.asset.symbol.slice(0, 4),
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      up: change >= 0,
    };
  });
}

export function radarLeaders(items: readonly MarketCandidate[], limit = 3) {
  const ranked = [...items].sort((left, right) => Number(right.changePercent) - Number(left.changePercent));
  return {
    gainers: ranked.filter((item) => Number(item.changePercent) > 0).slice(0, limit),
    losers: ranked.filter((item) => Number(item.changePercent) < 0).slice(-limit).reverse(),
  };
}
