import type { PlanTier } from './feature-catalog';

export type BillingStatus = {
  plan: PlanTier;
  is_active: boolean;
};

const normalizePlanTier = (plan: unknown): PlanTier => {
  return plan === 'premium' || plan === 'paid' || plan === 'pro'
    ? 'premium'
    : 'free';
};

export const getBillingStatus = async (): Promise<BillingStatus> => {
  try {
    const response = await fetch('/api/billing/plans', { method: 'GET' });
    if (!response.ok) {
      return { plan: 'free', is_active: false };
    }

    const payload = (await response.json()) as { current_plan?: unknown };
    if (!payload || typeof payload !== 'object') {
      return { plan: 'free', is_active: false };
    }

    const plan = normalizePlanTier(payload.current_plan ?? null);
    return { plan, is_active: plan === 'premium' };
  } catch {
    return { plan: 'free', is_active: false };
  }
};
