import type { CanonicalAsset, Horizon, MarketCandidate } from '@phanfora/domain';
import type { MarketDataProvider } from './index';
import { MarketDataError } from './twelve-data';

export class CompositeMarketDataProvider implements MarketDataProvider {
  constructor(private readonly providers: readonly MarketDataProvider[]) {}

  async listAssets(): Promise<readonly CanonicalAsset[]> {
    const seen = new Set<string>();
    const assets: CanonicalAsset[] = [];
    for (const provider of this.providers) {
      try {
        for (const asset of await provider.listAssets()) {
          if (seen.has(asset.id)) continue;
          seen.add(asset.id);
          assets.push(asset);
        }
      } catch {
        // A catalog failure must not hide quotes from the remaining providers.
      }
    }
    return assets;
  }

  async getAsset(id: string): Promise<CanonicalAsset> {
    for (const provider of this.providers) {
      try {
        return await provider.getAsset(id);
      } catch {
        // Try the next source.
      }
    }
    throw new Error('ASSET_NOT_FOUND');
  }

  async getCandidates(horizon: Horizon, assetIds?: readonly string[]): Promise<readonly MarketCandidate[]> {
    const results = await Promise.allSettled(this.providers.map((provider) => provider.getCandidates(horizon, assetIds)));
    const seen = new Set<string>();
    const merged: MarketCandidate[] = [];
    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      for (const item of result.value) {
        if (seen.has(item.asset.id)) continue;
        seen.add(item.asset.id);
        merged.push(item);
      }
    }
    if (!merged.length) {
      const limited = results.some((result) => result.status === 'rejected' && result.reason instanceof MarketDataError && result.reason.code === 'MARKET_DATA_RATE_LIMITED');
      throw new MarketDataError(limited ? 'MARKET_DATA_RATE_LIMITED' : 'MARKET_DATA_UNAVAILABLE');
    }
    return merged;
  }
}
