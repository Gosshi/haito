import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getBillingStatus } from './billing-status';

vi.mock('../supabase/client', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '../supabase/client';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('BillingStatusService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有料ユーザーはpremium/activeを返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', app_metadata: { plan: 'premium' } } },
          error: null,
        }),
      },
    });

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'premium', is_active: true });
  });

  it('無料ユーザーはfree/inactiveを返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-2', app_metadata: { plan: 'free' } } },
          error: null,
        }),
      },
    });

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'free', is_active: false });
  });

  it('user_metadata は課金判定に使用しない', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-3',
              app_metadata: { plan: 'free' },
              user_metadata: { plan: 'premium' },
            },
          },
          error: null,
        }),
      },
    });

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'free', is_active: false });
  });

  it('未認証の場合はfree/inactiveを返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        }),
      },
    });

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'free', is_active: false });
  });
});
