import { createClient } from '../supabase/client';

export type FeatureAccess = {
  stress_test: boolean;
};

const isPremiumPlan = (plan: unknown): boolean => {
  return plan === 'premium' || plan === 'paid' || plan === 'pro';
};

export const getFeatureAccess = async (): Promise<FeatureAccess> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    const user = error ? null : data.user;

    if (!user) {
      return { stress_test: false };
    }

    const plan = user.app_metadata?.plan ?? user.user_metadata?.plan ?? null;
    return { stress_test: isPremiumPlan(plan) };
  } catch {
    return { stress_test: false };
  }
};
