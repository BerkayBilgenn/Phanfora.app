import { beforeEach, describe, expect, it } from 'vitest';
import { addHolding, addOverviewAsset, addWatch, evaluateAlerts, loadWorkspace, removeOverviewAsset, saveWorkspace } from './workspace';

beforeEach(() => localStorage.clear());

describe('personal workspace', () => {
  it('persists a unique watchlist and holdings entered by the user', () => {
    let state = addWatch(loadWorkspace(), 'crypto:btc-usd');
    state = addWatch(state, 'crypto:btc-usd');
    state = addHolding(state, { id: 'lot-1', assetId: 'crypto:btc-usd', quantity: 2, costBasis: 100 });
    saveWorkspace(state);
    expect(loadWorkspace()).toMatchObject({ watchlist: ['crypto:btc-usd'], holdings: [{ id: 'lot-1', quantity: 2, costBasis: 100 }] });
  });

  it('triggers only enabled alerts that cross a real quoted price', () => {
    const state = { ...loadWorkspace(), alerts: [
      { id: 'a', assetId: 'crypto:btc-usd', direction: 'above' as const, threshold: 100, enabled: true },
      { id: 'b', assetId: 'crypto:btc-usd', direction: 'below' as const, threshold: 90, enabled: true },
      { id: 'c', assetId: 'crypto:btc-usd', direction: 'above' as const, threshold: 100, enabled: false },
    ] };
    expect(evaluateAlerts(state, [{ assetId: 'crypto:btc-usd', price: 101 }])).toEqual(['a']);
    expect(evaluateAlerts(state, [])).toEqual([]);
  });

  it('persists any number of selected overview assets without duplicates', () => {
    const defaults = ['crypto:btc-usd', 'crypto:eth-usd'];
    let state = loadWorkspace();
    state = addOverviewAsset(state, 'crypto:doge-usd', defaults);
    state = addOverviewAsset(state, 'crypto:link-usd', defaults);
    state = addOverviewAsset(state, 'crypto:doge-usd', defaults);
    state = removeOverviewAsset(state, 'crypto:eth-usd', defaults);
    saveWorkspace(state);
    expect(loadWorkspace().overviewAssetIds).toEqual(['crypto:btc-usd', 'crypto:doge-usd', 'crypto:link-usd']);
  });
});
