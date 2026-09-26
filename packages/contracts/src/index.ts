import { type Static, Type } from '@sinclair/typebox';

export const CreateAnalysisBodySchema = Type.Object(
  {
    amount: Type.String({ pattern: '^(?=.*[1-9])(?:0|[1-9]\\d*)(?:\\.\\d+)?$' }),
    currency: Type.String({ pattern: '^[A-Z]{3}$' }),
    horizon: Type.Union([
      Type.Literal('daily'),
      Type.Literal('weekly'),
      Type.Literal('monthly'),
    ]),
    riskProfile: Type.Union([
      Type.Literal('low'),
      Type.Literal('balanced'),
      Type.Literal('high'),
    ]),
    locale: Type.Union([Type.Literal('tr-TR'), Type.Literal('en-US')]),
  },
  { additionalProperties: false },
);

export const IdempotencyHeadersSchema = Type.Object(
  { 'idempotency-key': Type.String({ minLength: 8, maxLength: 128 }) },
  { additionalProperties: true },
);

export const ApiErrorSchema = Type.Object({
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
  }),
});

export const HorizonQuerySchema = Type.Object({
  horizon: Type.Union([
    Type.Literal('daily'),
    Type.Literal('weekly'),
    Type.Literal('monthly'),
  ]),
}, { additionalProperties: false });

export const AssetIdParamsSchema = Type.Object({
  id: Type.String({ minLength: 1, maxLength: 128 }),
});

export type CreateAnalysisBody = Static<typeof CreateAnalysisBodySchema>;
export type IdempotencyHeaders = Static<typeof IdempotencyHeadersSchema>;
export type HorizonQuery = Static<typeof HorizonQuerySchema>;
export type AssetIdParams = Static<typeof AssetIdParamsSchema>;
