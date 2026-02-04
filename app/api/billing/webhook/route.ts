import { NextResponse } from 'next/server';

import { createServiceClient } from '../../../../lib/supabase/service';
import { constructStripeEvent } from '../../../../lib/billing/stripe';
import type { BillingErrorResponse } from '../../../../lib/billing/types';

type WebhookAck = { received: true };

type CheckoutSessionLike = {
  client_reference_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

const buildErrorResponse = (code: string, message: string): BillingErrorResponse => ({
  error: { code, message },
});

const extractUserId = (payload: CheckoutSessionLike): string | null => {
  if (payload.client_reference_id) {
    return payload.client_reference_id;
  }

  const metadata = payload.metadata;
  if (metadata && typeof metadata.user_id === 'string') {
    return metadata.user_id;
  }

  return null;
};

export async function POST(
  request: Request
): Promise<NextResponse<WebhookAck | BillingErrorResponse>> {
  const signature = request.headers.get('stripe-signature');
  const payload = await request.text();

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = constructStripeEvent(payload, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature';
    return NextResponse.json(buildErrorResponse('BAD_REQUEST', message), {
      status: 400,
    });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as CheckoutSessionLike;
    const userId = extractUserId(session);

    if (userId) {
      const supabase = createServiceClient();
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        app_metadata: { plan: 'premium' },
      });

      if (error) {
        return NextResponse.json(
          buildErrorResponse('INTERNAL_ERROR', 'Failed to update billing status.'),
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
