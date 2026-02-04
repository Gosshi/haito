import { z } from 'zod';

export const taxModeSchema = z.enum(['pretax', 'after_tax']);
export type TaxMode = z.infer<typeof taxModeSchema>;

export const accountTypeSchema = z.enum(['nisa', 'taxable']);
export type AccountType = z.infer<typeof accountTypeSchema>;

export const dividendGoalAssumptionsSchema = z.object({
  yield_rate: z.number().finite(),
  dividend_growth_rate: z.number().finite(),
  tax_mode: taxModeSchema,
  reinvest_rate: z.number().finite().min(0).max(1).default(1),
  account_type: accountTypeSchema.default('nisa'),
});
export type DividendGoalAssumptions = z.infer<typeof dividendGoalAssumptionsSchema>;

export const dividendGoalRequestSchema = z.object({
  target_annual_dividend: z.number().finite().min(0),
  monthly_contribution: z.number().finite().min(0),
  horizon_years: z.number().int().min(0),
  assumptions: dividendGoalAssumptionsSchema,
});
export type DividendGoalRequest = z.infer<typeof dividendGoalRequestSchema>;

export const dividendGoalShockSchema = z.object({
  year: z.number().int(),
  rate: z.number().finite().min(0).max(100),
});
export type DividendGoalShock = z.infer<typeof dividendGoalShockSchema>;

export const dividendGoalShockRequestSchema = dividendGoalRequestSchema.extend({
  shock: dividendGoalShockSchema,
});
export type DividendGoalShockRequest = z.infer<typeof dividendGoalShockRequestSchema>;

export const dividendGoalSnapshotSchema = z.object({
  current_annual_dividend: z.number().finite().nullable().optional(),
  current_yield_rate: z.number().finite().nullable().optional(),
});
export type DividendGoalSnapshot = z.infer<typeof dividendGoalSnapshotSchema>;

export const dividendGoalSeriesPointSchema = z.object({
  year: z.number().int(),
  annual_dividend: z.number().finite(),
});
export type DividendGoalSeriesPoint = z.infer<typeof dividendGoalSeriesPointSchema>;

export const dividendGoalResultSchema = z.object({
  achieved: z.boolean().optional(),
  achieved_in_year: z.number().int().nullable().optional(),
  gap_now: z.number().finite().nullable().optional(),
  end_annual_dividend: z.number().finite().nullable().optional(),
  target_annual_dividend: z.number().finite().nullable().optional(),
});
export type DividendGoalResult = z.infer<typeof dividendGoalResultSchema>;

export const dividendGoalRecommendationSchema = z.record(z.unknown());
export type DividendGoalRecommendation = z.infer<typeof dividendGoalRecommendationSchema>;

export const dividendGoalResponseSchema = z.object({
  snapshot: dividendGoalSnapshotSchema.nullable().optional(),
  result: dividendGoalResultSchema.nullable().optional(),
  series: z.array(dividendGoalSeriesPointSchema).optional(),
  recommendations: z.array(dividendGoalRecommendationSchema).optional(),
});
export type DividendGoalResponse = z.infer<typeof dividendGoalResponseSchema>;

export const simulationErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().nullable(),
  }),
});
export type SimulationErrorResponse = z.infer<typeof simulationErrorSchema>;
