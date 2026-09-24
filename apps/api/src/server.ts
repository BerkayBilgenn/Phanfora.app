import { buildApp } from './app';
import { TwelveDataProvider } from '@phanfora/market-data';

const host = process.env.API_HOST ?? '127.0.0.1';
const port = Number(process.env.API_PORT ?? 4000);
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();
const liveProvider = apiKey ? new TwelveDataProvider({ apiKey }) : undefined;
const app = buildApp({
  allowedOrigins,
  ...(liveProvider
    ? { marketData: liveProvider, fxRates: liveProvider, providerMode: 'live' as const }
    : {}),
});

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
