import { createClient } from '../supabase/client';
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
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    const user = error ? null : data.user;

    if (!user) {
      return { plan: 'free', is_active: false };
    }

    const plan = normalizePlanTier(user.app_metadata?.plan ?? null);
    return { plan, is_active: plan === 'premium' };
  } catch {
    return { plan: 'free', is_active: false };
  }
};
