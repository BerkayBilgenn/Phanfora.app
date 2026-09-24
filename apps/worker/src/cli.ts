import { randomUUID } from 'node:crypto';

import { AnalysisService } from '@phanfora/analysis';
import { FixtureFxRateProvider, FixtureMarketDataProvider } from '@phanfora/market-data';

import { processAnalysisJob } from './index';

const analysis = new AnalysisService({
  marketData: new FixtureMarketDataProvider(),
  fxRates: new FixtureFxRateProvider(),
  clock: () => new Date().toISOString(),
  createId: randomUUID,
  idempotencyStore: new Map(),
});

const result = await processAnalysisJob({
  idempotencyKey: `worker-${randomUUID()}`,
  body: {
    amount: '25000',
    currency: 'TRY',
    horizon: 'weekly',
    riskProfile: 'balanced',
    locale: 'tr-TR',
  },
}, analysis);

process.stdout.write(`${JSON.stringify({
  status: 'ok',
  analysisId: result.id,
  primary: result.primary.asset.symbol,
  dataMode: result.dataMode,
})}\n`);
