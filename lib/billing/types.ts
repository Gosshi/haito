import type { PlanTier } from '../access/feature-catalog';

export type BillingPlan = {
  id: PlanTier;
  name: string;
  description: string;
  price: string;
  premium: boolean;
};

export type BillingPlansResponse = {
  plans: BillingPlan[];
  current_plan: PlanTier;
};

export type BillingCheckoutRequest = {
  plan_id: PlanTier;
};

export type BillingCheckoutResponse = {
  checkout_url: string;
};

export type BillingErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};
