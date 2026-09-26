import type { AnalysisService } from '@phanfora/analysis';
import { CreateAnalysisBodySchema } from '@phanfora/contracts';
import type { AnalysisResult } from '@phanfora/domain';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const AnalysisJobSchema = Type.Object({
  idempotencyKey: Type.String({ minLength: 8, maxLength: 128 }),
  body: CreateAnalysisBodySchema,
}, { additionalProperties: false });

export async function processAnalysisJob(
  job: unknown,
  analysis: AnalysisService,
): Promise<AnalysisResult> {
  if (!Value.Check(AnalysisJobSchema, job)) {
    throw new Error('MALFORMED_ANALYSIS_JOB');
  }

  return analysis.create({
    amount: { amount: job.body.amount, currency: job.body.currency },
    horizon: job.body.horizon,
    riskProfile: job.body.riskProfile,
    locale: job.body.locale,
  }, job.idempotencyKey);
}
