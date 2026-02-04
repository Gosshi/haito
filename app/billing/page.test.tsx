/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import BillingPage from './page';

const mockFetch = vi.fn();

global.fetch = mockFetch as typeof fetch;

const plansResponse = {
  plans: [
    {
      id: 'free',
      name: '無料プラン',
      description: '基本機能を利用できます。',
      price: '¥0 / 月',
      premium: false,
    },
    {
      id: 'premium',
      name: 'プレミアムプラン',
      description: '有料機能をすべて利用できます。',
      price: '¥980 / 月',
      premium: true,
    },
  ],
  current_plan: 'free',
};

const originalLocation = window.location;

const setupLocationMock = () => {
  Object.defineProperty(window, 'location', {
    value: { assign: vi.fn() },
    writable: true,
  });
};

const restoreLocation = () => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  });
};

describe('BillingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    setupLocationMock();
  });

  afterEach(() => {
    restoreLocation();
  });

  it('プラン一覧と現在プランを表示する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => plansResponse,
    });

    render(<BillingPage />);

    expect(await screen.findByText('料金プラン')).toBeInTheDocument();
    expect(screen.getByText('無料プラン')).toBeInTheDocument();
    expect(screen.getByText('プレミアムプラン')).toBeInTheDocument();
    expect(screen.getByText('現在のプラン')).toBeInTheDocument();
  });

  it('決済開始でCheckoutに遷移する', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => plansResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ checkout_url: 'https://checkout.test/session' }),
      });

    render(<BillingPage />);

    const button = await screen.findByRole('button', { name: '決済を開始' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(
        'https://checkout.test/session'
      );
    });
  });

  it('未認証の場合はログイン導線を表示する', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => plansResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
        }),
      });

    render(<BillingPage />);

    const button = await screen.findByRole('button', { name: '決済を開始' });
    fireEvent.click(button);

    const link = await screen.findByRole('link', { name: 'ログインする' });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('決済開始に失敗した場合は再試行の案内を出す', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => plansResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: { code: 'INTERNAL_ERROR', message: 'Failed to start checkout.' },
        }),
      });

    render(<BillingPage />);

    const button = await screen.findByRole('button', { name: '決済を開始' });
    fireEvent.click(button);

    expect(
      await screen.findByText('決済の開始に失敗しました。再試行してください。')
    ).toBeInTheDocument();
  });
});
