import type { PlanTier } from '../access/feature-catalog';
import type { BillingPlan } from './types';

type BillingPlanConfig = BillingPlan & {
  price_id?: string | null;
};

const BILLING_PLANS: BillingPlanConfig[] = [
  {
    id: 'free',
    name: '無料プラン',
    description: '基本機能を利用できます。',
    price: '¥0 / 月',
    premium: false,
  },
  {
    id: 'premium',
    name: 'プレミアムプラン',
    description: '有料機能をすべて利用できます。',
    price: '¥980 / 月',
    premium: true,
  },
];

export const getBillingPlans = (): BillingPlan[] =>
  BILLING_PLANS.map(({ price_id, ...plan }) => plan);

export const getBillingPlanConfig = (plan: PlanTier): BillingPlanConfig | null => {
  const base = BILLING_PLANS.find((entry) => entry.id === plan);
  if (!base) {
    return null;
  }

  if (plan === 'premium') {
    return {
      ...base,
      price_id: process.env.STRIPE_PREMIUM_PRICE_ID ?? null,
    };
  }

  return base;
};

export const resolvePlanTier = (value: unknown): PlanTier => {
  return value === 'premium' || value === 'paid' || value === 'pro'
    ? 'premium'
    : 'free';
};
