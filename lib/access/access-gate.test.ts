import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createAccessGateService } from './access-gate';

vi.mock('../supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '../supabase/server';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('AccessGateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有料ユーザーは有料機能を利用できる', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', app_metadata: { plan: 'premium' } } },
          error: null,
        }),
      },
    });

    const service = createAccessGateService();
    const decision = await service.decideAccess({ feature: 'stress_test' });

    expect(decision.allowed).toBe(true);
    expect(decision.plan).toBe('premium');
  });

  it('無料ユーザーは有料機能で拒否される', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-2', app_metadata: { plan: 'free' } } },
          error: null,
        }),
      },
    });

    const service = createAccessGateService();
    const decision = await service.decideAccess({ feature: 'stress_test' });

    expect(decision.allowed).toBe(false);
    expect(decision.plan).toBe('free');
  });

  it('未認証の場合はunknownとして拒否する', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        }),
      },
    });

    const service = createAccessGateService();
    const decision = await service.decideAccess({ feature: 'stress_test' });

    expect(decision.allowed).toBe(false);
    expect(decision.plan).toBe('unknown');
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

    const service = createAccessGateService();
    const decision = await service.decideAccess({ feature: 'stress_test' });

    expect(decision.allowed).toBe(false);
    expect(decision.plan).toBe('free');
  });
});
