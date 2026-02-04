import type { User } from '@supabase/supabase-js';

import { createClient } from '../supabase/server';
import { isPremiumFeature, type FeatureKey, type PlanTier } from './feature-catalog';

export type AccessDecision =
  | { allowed: true; plan: PlanTier }
  | { allowed: false; plan: PlanTier | 'unknown' };

export type FeatureAccessRequest = {
  feature: FeatureKey;
};

export interface AccessGateService {
  decideAccess(input: FeatureAccessRequest): Promise<AccessDecision>;
}

const normalizePlanTier = (plan: unknown): PlanTier => {
  return plan === 'premium' || plan === 'paid' || plan === 'pro'
    ? 'premium'
    : 'free';
};

const resolvePlanTier = (user: User | null): PlanTier | 'unknown' => {
  if (!user) {
    return 'unknown';
  }

  return normalizePlanTier(user.app_metadata?.plan ?? null);
};

const decideAccessByPlan = (
  feature: FeatureKey,
  plan: PlanTier | 'unknown'
): AccessDecision => {
  if (!isPremiumFeature(feature)) {
    return {
      allowed: true,
      plan: plan === 'unknown' ? 'free' : plan,
    };
  }

  if (plan === 'premium') {
    return { allowed: true, plan };
  }

  return { allowed: false, plan };
};

export const createAccessGateService = (): AccessGateService => ({
  decideAccess: async ({ feature }) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    const user = error ? null : data.user;
    const plan = resolvePlanTier(user);
    return decideAccessByPlan(feature, plan);
  },
});
