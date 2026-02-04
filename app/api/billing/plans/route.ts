import { NextResponse } from 'next/server';

import { createClient } from '../../../../lib/supabase/server';
import { getBillingPlans, resolvePlanTier } from '../../../../lib/billing/plans';
import type {
  BillingPlansResponse,
  BillingErrorResponse,
} from '../../../../lib/billing/types';

const buildErrorResponse = (code: string, message: string): BillingErrorResponse => ({
  error: { code, message },
});

export async function GET(): Promise<
  NextResponse<BillingPlansResponse | BillingErrorResponse>
> {
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  const user = authError ? null : data.user;

  if (!user) {
    return NextResponse.json(
      buildErrorResponse('UNAUTHORIZED', 'Authentication required.'),
      { status: 401 }
    );
  }

  const currentPlan = resolvePlanTier(user.app_metadata?.plan ?? null);

  return NextResponse.json({
    plans: getBillingPlans(),
    current_plan: currentPlan,
  });
}
