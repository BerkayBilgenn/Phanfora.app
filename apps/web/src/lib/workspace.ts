import type { AnalysisResult, Horizon, RiskProfile } from '@phanfora/domain';

export type Holding = { id: string; assetId: string; quantity: number; costBasis: number };
export type PriceAlert = { id: string; assetId: string; direction: 'above' | 'below'; threshold: number; enabled: boolean };
export type Workspace = {
  watchlist: string[];
  holdings: Holding[];
  alerts: PriceAlert[];
  analyses: AnalysisResult[];
  settings: { horizon: Horizon; riskProfile: RiskProfile; refreshSeconds: number };
};
const KEY = 'phanfora:workspace:v1';
export const emptyWorkspace: Workspace = { watchlist: [], holdings: [], alerts: [], analyses: [], settings: { horizon: 'daily', riskProfile: 'balanced', refreshSeconds: 60 } };

export function workspaceSnapshot() { return typeof window === 'undefined' ? '' : localStorage.getItem(KEY) ?? ''; }
export function subscribeWorkspace(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener('phanfora:workspace', listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener('phanfora:workspace', listener); };
}
export function parseWorkspace(raw: string): Workspace {
  try {
    const value = JSON.parse(raw || 'null') as Partial<Workspace> | null;
    if (!value || !Array.isArray(value.watchlist) || !Array.isArray(value.holdings) || !Array.isArray(value.alerts) || !Array.isArray(value.analyses)) return structuredClone(emptyWorkspace);
    return { ...structuredClone(emptyWorkspace), ...value, settings: { ...emptyWorkspace.settings, ...value.settings } };
  } catch { return structuredClone(emptyWorkspace); }
}
export function loadWorkspace(): Workspace { return parseWorkspace(workspaceSnapshot()); }
export function saveWorkspace(value: Workspace) {
  localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new Event('phanfora:workspace'));
}
export function addWatch(value: Workspace, assetId: string): Workspace {
  return value.watchlist.includes(assetId) ? value : { ...value, watchlist: [...value.watchlist, assetId] };
}
export function addHolding(value: Workspace, holding: Holding): Workspace {
  if (!holding.assetId || !Number.isFinite(holding.quantity) || holding.quantity <= 0 || !Number.isFinite(holding.costBasis) || holding.costBasis < 0) throw new Error('Geçerli bir miktar ve alış fiyatı gir.');
  return { ...value, holdings: [...value.holdings, holding] };
}
export function evaluateAlerts(value: Workspace, quotes: readonly { assetId: string; price: number }[]): string[] {
  const prices = new Map(quotes.map(({ assetId, price }) => [assetId, price]));
  return value.alerts.filter((alert) => {
    const price = prices.get(alert.assetId);
    return alert.enabled && price !== undefined && Number.isFinite(price) && (alert.direction === 'above' ? price >= alert.threshold : price <= alert.threshold);
  }).map((alert) => alert.id);
}
export function saveAnalysis(value: Workspace, analysis: AnalysisResult): Workspace {
  return { ...value, analyses: [analysis, ...value.analyses.filter((item) => item.id !== analysis.id)].slice(0, 50) };
}
