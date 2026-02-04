import type { PlanTier } from '../access/feature-catalog';
import type { DividendGoalAssumptions, DividendGoalRequest } from './types';

export type NormalizedAssumptions = DividendGoalAssumptions & {
  reinvest_rate: number;
  account_type: 'nisa' | 'taxable';
};

export const normalizeDividendGoalAssumptions = (
  input: DividendGoalRequest,
  plan: PlanTier
): { request: DividendGoalRequest; assumptions: NormalizedAssumptions } => {
  const assumptions = input.assumptions;
  const normalized: NormalizedAssumptions =
    plan === 'free'
      ? {
          ...assumptions,
          reinvest_rate: 1,
          account_type: 'nisa',
        }
      : {
          ...assumptions,
          reinvest_rate: assumptions.reinvest_rate ?? 1,
          account_type: assumptions.account_type ?? 'nisa',
        };

  return {
    request: {
      ...input,
      assumptions: normalized,
    },
    assumptions: normalized,
  };
};
