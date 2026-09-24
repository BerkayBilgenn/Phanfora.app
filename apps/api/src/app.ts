import { randomUUID } from 'node:crypto';

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import {
  TypeBoxTypeProvider,
} from '@fastify/type-provider-typebox';
import { AnalysisService } from '@phanfora/analysis';
import {
  CreateAnalysisBodySchema,
  IdempotencyHeadersSchema,
  type CreateAnalysisBody,
  type IdempotencyHeaders,
} from '@phanfora/contracts';
import type { AnalysisResult } from '@phanfora/domain';
import {
  FixtureFxRateProvider,
  FixtureMarketDataProvider,
} from '@phanfora/market-data';
import Fastify, { type FastifyServerOptions } from 'fastify';

export interface BuildAppOptions extends FastifyServerOptions {
  allowedOrigins?: readonly string[];
}

export function buildApp(options: BuildAppOptions = {}) {
  const { allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'], ...fastifyOptions } = options;
  const app = Fastify({
    bodyLimit: 32 * 1024,
    logger: fastifyOptions.logger ?? {
      level: 'info',
      redact: ['req.headers.authorization', 'req.headers.cookie', 'body.amount'],
    },
    ...fastifyOptions,
  }).withTypeProvider<TypeBoxTypeProvider>();

  const marketData = new FixtureMarketDataProvider();
  const fxRates = new FixtureFxRateProvider();
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

  app.get('/health', async () => ({ status: 'ok', dataMode: 'fixture' }));

  app.get('/v1/currencies', async (request) => {
    const query = request.query as { locale?: string };
    const locale = query.locale === 'en-US' ? 'en-US' : 'tr-TR';
    return { items: await fxRates.listCurrencies(locale), dataMode: 'fixture' };
  });

  app.get('/v1/assets', async () => ({
    items: await marketData.listAssets(),
    dataMode: 'fixture',
  }));

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
    const statusCode = appError.statusCode && appError.statusCode >= 400
      ? appError.statusCode
      : appError.message === 'ORIGIN_NOT_ALLOWED'
        ? 403
        : 500;
    const code = appError.validation
      ? 'VALIDATION_ERROR'
      : statusCode === 415
        ? 'UNSUPPORTED_MEDIA_TYPE'
        : statusCode === 403
          ? 'ORIGIN_NOT_ALLOWED'
          : 'INTERNAL_ERROR';
    const message = statusCode >= 500
      ? 'İstek şu anda tamamlanamadı.'
      : 'İstek doğrulanamadı.';
    return reply.code(statusCode).send({ error: { code, message } });
  });

  return app;
}
