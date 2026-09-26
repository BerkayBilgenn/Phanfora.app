import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_COCKPIT_PREFERENCES,
  createLocalCockpitPreferencesRepository,
} from './cockpit-preferences';

describe('local cockpit preferences', () => {
  beforeEach(() => localStorage.clear());

  it('returns defaults without overwriting malformed stored data', async () => {
    localStorage.setItem('phanfora:cockpit:v1', '{bad-json');
    const repository = createLocalCockpitPreferencesRepository(localStorage);

    await expect(repository.load()).resolves.toEqual(DEFAULT_COCKPIT_PREFERENCES);
    expect(localStorage.getItem('phanfora:cockpit:v1')).toBe('{bad-json');
  });

  it('persists and reloads only a valid versioned preference object', async () => {
    const repository = createLocalCockpitPreferencesRepository(localStorage);
    const preferences = {
      ...DEFAULT_COCKPIT_PREFERENCES,
      assetId: 'crypto:btc-usd',
      horizon: 'weekly' as const,
      indicators: ['sma20'] as const,
      motion: 'reduced' as const,
    };

    await repository.save(preferences);

    await expect(repository.load()).resolves.toEqual(preferences);
  });

  it('rejects schema-old stored values without mutating storage', async () => {
    const stale = JSON.stringify({ ...DEFAULT_COCKPIT_PREFERENCES, version: 0 });
    localStorage.setItem('phanfora:cockpit:v1', stale);

    await expect(createLocalCockpitPreferencesRepository(localStorage).load())
      .resolves.toEqual(DEFAULT_COCKPIT_PREFERENCES);
    expect(localStorage.getItem('phanfora:cockpit:v1')).toBe(stale);
  });
});
