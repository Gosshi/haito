import { describe, it, expect, vi, beforeEach } from 'vitest';

import { GET } from './route';

vi.mock('../../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '../../../../lib/supabase/server';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('BillingPlansApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    const response = await GET(
      new Request('http://localhost/api/billing/plans')
    );

    expect(response.status).toBe(401);
  });

  it('プラン一覧と現在プランを返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', app_metadata: { plan: 'premium' } } },
          error: null,
        }),
      },
    });

    const response = await GET(
      new Request('http://localhost/api/billing/plans')
    );

    expect(response.status).toBe(200);

    const payload = await response.json();

    expect(payload.current_plan).toBe('premium');
    expect(payload.plans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'free' }),
        expect.objectContaining({ id: 'premium' }),
      ])
    );
  });
});
