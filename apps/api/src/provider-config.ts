import {
  FixtureFxRateProvider,
  FixtureMarketDataProvider,
  TwelveDataProvider,
} from '@phanfora/market-data';

type ProviderConfig =
  | Record<string, never>
  | {
      marketData: FixtureMarketDataProvider;
      fxRates: FixtureFxRateProvider;
      providerMode: 'fixture';
    }
  | {
      marketData: TwelveDataProvider;
      fxRates: TwelveDataProvider;
      providerMode: 'live';
    };

export function createProviderConfig(env: NodeJS.ProcessEnv): ProviderConfig {
  if (env.MARKET_DATA_MODE?.trim() === 'fixture') {
    return {
      marketData: new FixtureMarketDataProvider(),
      fxRates: new FixtureFxRateProvider(),
      providerMode: 'fixture',
    };
  }

  const apiKey = env.TWELVE_DATA_API_KEY?.trim();
  if (!apiKey) return {};

  const liveProvider = new TwelveDataProvider({ apiKey });
  return {
    marketData: liveProvider,
    fxRates: liveProvider,
    providerMode: 'live',
  };
}
