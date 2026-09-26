import { describe, expect, it } from 'vitest';

import { createProviderConfig } from './provider-config';

describe('createProviderConfig', () => {
  it('enables deterministic fixtures only when explicitly requested', () => {
    const config = createProviderConfig({ MARKET_DATA_MODE: 'fixture' });

    expect(config.providerMode).toBe('fixture');
    expect(config.marketData).toBeDefined();
    expect(config.fxRates).toBeDefined();
  });

  it('does not silently fall back to fixtures without configuration', () => {
    expect(createProviderConfig({})).toEqual({});
  });

  it('uses the live provider when an API key is configured', () => {
    const config = createProviderConfig({ TWELVE_DATA_API_KEY: 'test-key' });

    expect(config.providerMode).toBe('live');
    expect(config.marketData).toBe(config.fxRates);
  });
});
