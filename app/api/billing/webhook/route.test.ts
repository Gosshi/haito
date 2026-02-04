import { describe, it, expect, vi, beforeEach } from 'vitest';

import { POST } from './route';

vi.mock('../../../../lib/billing/stripe', () => ({
  constructStripeEvent: vi.fn(),
}));

vi.mock('../../../../lib/supabase/service', () => ({
  createServiceClient: vi.fn(),
}));

import { constructStripeEvent } from '../../../../lib/billing/stripe';
import { createServiceClient } from '../../../../lib/supabase/service';

const mockConstructStripeEvent = constructStripeEvent as ReturnType<typeof vi.fn>;
const mockCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

describe('BillingWebhookApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('署名検証に失敗した場合は400を返す', async () => {
    mockConstructStripeEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await POST(
      new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'invalid' },
        body: 'payload',
      })
    );

    expect(response.status).toBe(400);
  });

  it('決済成功イベントで課金状態を更新する', async () => {
    const updateUserById = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockCreateServiceClient.mockReturnValue({
      auth: {
        admin: {
          updateUserById,
        },
      },
    });

    mockConstructStripeEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: 'user-1',
          metadata: { user_id: 'user-1' },
        },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid' },
        body: 'payload',
      })
    );

    expect(response.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith('user-1', {
      app_metadata: { plan: 'premium' },
    });
  });

  it('失敗イベントでは更新を行わない', async () => {
    const updateUserById = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockCreateServiceClient.mockReturnValue({
      auth: {
        admin: {
          updateUserById,
        },
      },
    });

    mockConstructStripeEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {},
      },
    });

    const response = await POST(
      new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'valid' },
        body: 'payload',
      })
    );

    expect(response.status).toBe(200);
    expect(updateUserById).not.toHaveBeenCalled();
  });
});
