import { randomUUID } from 'node:crypto';

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import {
  TypeBoxTypeProvider,
} from '@fastify/type-provider-typebox';
import { AnalysisService } from '@phanfora/analysis';
import {
  AssetIdParamsSchema,
  CreateAnalysisBodySchema,
  HorizonQuerySchema,
  IdempotencyHeadersSchema,
  type AssetIdParams,
  type CreateAnalysisBody,
  type HorizonQuery,
  type IdempotencyHeaders,
} from '@phanfora/contracts';
import type { AnalysisResult } from '@phanfora/domain';
import {
  MarketDataError,
  type FxRateProvider,
  type MarketDataProvider,
} from '@phanfora/market-data';
import Fastify, { type FastifyServerOptions } from 'fastify';

export interface BuildAppOptions extends FastifyServerOptions {
  allowedOrigins?: readonly string[];
  marketData?: MarketDataProvider;
  fxRates?: FxRateProvider;
  providerMode?: 'fixture' | 'live';
}

function marketDataNotConfigured(): never {
  throw new MarketDataError('MARKET_DATA_NOT_CONFIGURED');
}

class UnconfiguredMarketDataProvider implements MarketDataProvider {
  async listAssets() { return marketDataNotConfigured(); }
  async getCandidates() { return marketDataNotConfigured(); }
  async getAsset() { return marketDataNotConfigured(); }
  async getSeries() { return marketDataNotConfigured(); }
  async getOverview() { return marketDataNotConfigured(); }
}

class UnconfiguredFxRateProvider implements FxRateProvider {
  async listCurrencies() { return marketDataNotConfigured(); }
  async getRates() { return marketDataNotConfigured(); }
}

export function buildApp(options: BuildAppOptions = {}) {
  const {
    allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'],
    marketData = new UnconfiguredMarketDataProvider(),
    fxRates = new UnconfiguredFxRateProvider(),
    providerMode = 'live',
    ...fastifyOptions
  } = options;
  const providerConfigured = options.marketData !== undefined && options.fxRates !== undefined;
  const app = Fastify({
    bodyLimit: 32 * 1024,
    logger: fastifyOptions.logger ?? {
      level: 'info',
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'body.amount',
        'TWELVE_DATA_API_KEY',
      ],
    },
    ...fastifyOptions,
  }).withTypeProvider<TypeBoxTypeProvider>();

  const idempotencyStore = new Map<string, AnalysisResult>();
  const replayedKeys = new Set<string>();
  const analysis = new AnalysisService({
    marketData,
    fxRates,
    clock: () => new Date().toISOString(),
    createId: randomUUID,
    idempotencyStore,
  });

  void app.register(helmet, { contentSecurityPolicy: false });
  void app.register(cors, {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('ORIGIN_NOT_ALLOWED'), false);
    },
  });

  app.get('/health', async () => providerConfigured
    ? { status: 'ok', dataMode: providerMode, provider: providerMode === 'live' ? 'Twelve Data' : 'Fixture' }
    : {
        status: 'degraded',
        dataMode: providerMode,
        provider: 'Twelve Data',
        error: 'MARKET_DATA_NOT_CONFIGURED',
      });

  app.get('/v1/currencies', async (request) => {
    const query = request.query as { locale?: string };
    const locale = query.locale === 'en-US' ? 'en-US' : 'tr-TR';
    return { items: await fxRates.listCurrencies(locale), dataMode: providerMode };
  });

  app.get('/v1/assets', async () => ({
    items: await marketData.listAssets(),
    dataMode: providerMode,
  }));

  app.get('/v1/market/overview', async () => marketData.getOverview());

  app.get<{
    Params: AssetIdParams;
    Querystring: HorizonQuery;
  }>('/v1/assets/:id/series', {
    schema: {
      params: AssetIdParamsSchema,
      querystring: HorizonQuerySchema,
    },
  }, async (request) => marketData.getSeries(request.params.id, request.query.horizon));

  app.post<{
    Body: CreateAnalysisBody;
    Headers: IdempotencyHeaders;
  }>('/v1/analyses', {
    onRequest: async (request, reply) => {
      if (!request.headers['content-type']?.startsWith('application/json')) {
        await reply.code(415).send({
          error: {
            code: 'UNSUPPORTED_MEDIA_TYPE',
            message: 'Yalnızca JSON istekleri desteklenir.',
          },
        });
      }
    },
    schema: {
      body: CreateAnalysisBodySchema,
      headers: IdempotencyHeadersSchema,
    },
  }, async (request, reply) => {
    const key = request.headers['idempotency-key'];
    const wasReplayed = replayedKeys.has(key);
    const result = await analysis.create({
      amount: { amount: request.body.amount, currency: request.body.currency },
      horizon: request.body.horizon,
      riskProfile: request.body.riskProfile,
      locale: request.body.locale,
    }, key);
    replayedKeys.add(key);
    return reply.code(wasReplayed ? 200 : 201).send(result);
  });

  app.setErrorHandler((error, _request, reply) => {
    const appError = error as Error & { statusCode?: number; validation?: unknown };
    const marketCode = appError instanceof MarketDataError ? appError.code : null;
    const statusCode = appError.message === 'ASSET_NOT_FOUND'
      ? 404
      : appError.message === 'INSUFFICIENT_ELIGIBLE_ASSETS'
        ? 422
        : marketCode === 'MARKET_DATA_NOT_CONFIGURED'
      || marketCode === 'MARKET_DATA_RATE_LIMITED'
      ? 503
      : marketCode === 'MARKET_DATA_UNAVAILABLE' || marketCode === 'FX_RATE_UNAVAILABLE'
        ? 502
        : appError.statusCode && appError.statusCode >= 400
      ? appError.statusCode
      : appError.message === 'ORIGIN_NOT_ALLOWED'
        ? 403
        : 500;
    const code = appError.message === 'ASSET_NOT_FOUND'
      ? 'ASSET_NOT_FOUND'
      : appError.message === 'INSUFFICIENT_ELIGIBLE_ASSETS'
        ? 'INSUFFICIENT_ELIGIBLE_ASSETS'
        : marketCode ?? (appError.validation
      ? 'VALIDATION_ERROR'
      : statusCode === 415
        ? 'UNSUPPORTED_MEDIA_TYPE'
        : statusCode === 403
          ? 'ORIGIN_NOT_ALLOWED'
          : 'INTERNAL_ERROR');
    const message = appError.message === 'ASSET_NOT_FOUND'
      ? 'Varlık bulunamadı.'
      : appError.message === 'INSUFFICIENT_ELIGIBLE_ASSETS'
        ? 'Analiz için yeterli kalitede varlık bulunamadı.'
        : marketCode === 'MARKET_DATA_RATE_LIMITED'
      ? 'Canlı veri kotası dolu. Kısa süre sonra yeniden dene.'
      : marketCode === 'MARKET_DATA_NOT_CONFIGURED'
        ? 'Canlı piyasa verisi henüz yapılandırılmadı.'
        : marketCode === 'FX_RATE_UNAVAILABLE'
          ? 'Seçilen para birimi için canlı kur alınamadı.'
          : statusCode >= 500
            ? 'Canlı piyasa verisi şu anda alınamadı.'
      : 'İstek doğrulanamadı.';
    return reply.code(statusCode).send({ error: { code, message } });
  });

  return app;
}
