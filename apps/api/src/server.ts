import { buildApp } from "./app";
import {
  FixtureFxRateProvider,
  FixtureMarketDataProvider,
  TwelveDataProvider,
  KrakenMarketDataProvider,
  FrankfurterFxRateProvider,
  BinanceMarketDataProvider,
  TcmbDailyFxProvider,
  CompositeMarketDataProvider,
  YahooDelayedEquityProvider,
} from "@phanfora/market-data";

const host = process.env.API_HOST ?? "127.0.0.1";
const port = Number(process.env.API_PORT ?? 4000);
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();
const liveProvider = apiKey ? new TwelveDataProvider({ apiKey }) : undefined;
const publicMarketData = new CompositeMarketDataProvider([
  new KrakenMarketDataProvider(),
  new BinanceMarketDataProvider(),
  new TcmbDailyFxProvider(),
  ...(liveProvider ? [liveProvider] : []),
  new YahooDelayedEquityProvider(),
]);
const e2eFixture = process.env.PHANFORA_E2E_FIXTURE === "1";
const app = buildApp({
  allowedOrigins,
  ...(e2eFixture
    ? {
        marketData: new FixtureMarketDataProvider(),
        fxRates: new FixtureFxRateProvider(),
        providerMode: "fixture" as const,
      }
    : {
          marketData: publicMarketData,
          fxRates: liveProvider ?? new FrankfurterFxRateProvider(),
          providerMode: liveProvider ? "live" as const : "public" as const,
        }),
});

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
