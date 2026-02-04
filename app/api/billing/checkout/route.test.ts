import { describe, it, expect, vi, beforeEach } from 'vitest';

import { POST } from './route';

vi.mock('../../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('../../../../lib/billing/stripe', () => ({
  createCheckoutSession: vi.fn(),
}));

import { createClient } from '../../../../lib/supabase/server';
import { createCheckoutSession } from '../../../../lib/billing/stripe';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;
const mockCreateCheckoutSession =
  createCheckoutSession as ReturnType<typeof vi.fn>;

describe('BillingCheckoutApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_PREMIUM_PRICE_ID = 'price_test';
  });

  it('未認証の場合は401を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        }),
      },
    });

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_id: 'premium' }),
      })
    );

    expect(response.status).toBe(401);
  });

  it('無効なプラン指定は400を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', app_metadata: { plan: 'free' } } },
          error: null,
        }),
      },
    });

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_id: 'free' }),
      })
    );

    expect(response.status).toBe(400);
  });

  it('Checkout URLを返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', app_metadata: { plan: 'free' } } },
          error: null,
        }),
      },
    });

    mockCreateCheckoutSession.mockResolvedValue(
      'https://checkout.test/session'
    );

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_id: 'premium' }),
      })
    );

    expect(response.status).toBe(200);

    const payload = await response.json();

    expect(payload.checkout_url).toBe('https://checkout.test/session');
  });
});
