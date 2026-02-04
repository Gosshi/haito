import { NextResponse } from 'next/server';

import { createClient } from '../../../../lib/supabase/server';
import { getBillingPlanConfig } from '../../../../lib/billing/plans';
import { createCheckoutSession } from '../../../../lib/billing/stripe';
import type { PlanTier } from '../../../../lib/access/feature-catalog';
import type {
  BillingCheckoutRequest,
  BillingCheckoutResponse,
  BillingErrorResponse,
} from '../../../../lib/billing/types';

const buildErrorResponse = (code: string, message: string): BillingErrorResponse => ({
  error: { code, message },
});

const isPlanTier = (value: unknown): value is PlanTier =>
  value === 'free' || value === 'premium';

const getSiteUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export async function POST(
  request: Request
): Promise<NextResponse<BillingCheckoutResponse | BillingErrorResponse>> {
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  const user = authError ? null : data.user;

  if (!user) {
    return NextResponse.json(
      buildErrorResponse('UNAUTHORIZED', 'Authentication required.'),
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      buildErrorResponse('BAD_REQUEST', 'Invalid JSON body.'),
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      buildErrorResponse('BAD_REQUEST', 'Request body must be an object.'),
      { status: 400 }
    );
  }

  const payload = body as Partial<BillingCheckoutRequest>;

  if (!isPlanTier(payload.plan_id)) {
    return NextResponse.json(
      buildErrorResponse('BAD_REQUEST', 'Invalid plan_id.'),
      { status: 400 }
    );
  }

  if (payload.plan_id === 'free') {
    return NextResponse.json(
      buildErrorResponse('BAD_REQUEST', 'Free plan does not require checkout.'),
      { status: 400 }
    );
  }

  const plan = getBillingPlanConfig(payload.plan_id);
  if (!plan?.price_id) {
    return NextResponse.json(
      buildErrorResponse('BAD_REQUEST', 'Plan is not available for checkout.'),
      { status: 400 }
    );
  }

  try {
    const baseUrl = getSiteUrl();
    const checkoutUrl = await createCheckoutSession({
      priceId: plan.price_id,
      userId: user.id,
      successUrl: `${baseUrl}/billing?checkout=success`,
      cancelUrl: `${baseUrl}/billing?checkout=cancel`,
    });

    return NextResponse.json({ checkout_url: checkoutUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed.';
    return NextResponse.json(
      buildErrorResponse('INTERNAL_ERROR', message),
      { status: 500 }
    );
  }
}
