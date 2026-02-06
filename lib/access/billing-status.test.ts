import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getBillingStatus } from './billing-status';

describe('getBillingStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns premium/active when API current_plan is premium', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            current_plan: 'premium',
          }),
      })
    );

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'premium', is_active: true });
    expect(fetch).toHaveBeenCalledWith('/api/billing/plans', { method: 'GET' });
  });

  it('returns free/inactive when API current_plan is free', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            current_plan: 'free',
          }),
      })
    );

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'free', is_active: false });
  });

  it('falls back to free/inactive when API responds 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })
    );

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'free', is_active: false });
  });

  it('falls back to free/inactive for malformed payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'free', is_active: false });
  });

  it('falls back to free/inactive on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'free', is_active: false });
  });

  it('normalizes current_plan=pro to premium', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            current_plan: 'pro',
          }),
      })
    );

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'premium', is_active: true });
  });

  it('falls back to free/inactive for unknown current_plan', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            current_plan: 'enterprise',
          }),
      })
    );

    const status = await getBillingStatus();

    expect(status).toEqual({ plan: 'free', is_active: false });
  });
});
