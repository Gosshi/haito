import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import type { SettingsResult, UserSettings } from '../../../lib/settings/types';

// Supabase クライアントのモック
vi.mock('../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '../../../lib/supabase/server';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('GET /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('認証チェック', () => {
    it('未認証リクエストで401を返却する', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      });

      const request = new Request('http://localhost:3000/api/settings', {
        method: 'GET',
      });

      const response = await GET(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(401);
      expect(json.ok).toBe(false);
      if (!json.ok) {
        expect(json.error.type).toBe('unauthorized');
      }
    });
  });

  describe('設定取得', () => {
    it('既存の設定を返却する', async () => {
      const mockSettings = {
        user_id: 'user-123',
        annual_dividend_goal: 1500000,
        goal_deadline_year: 2032,
        display_currency: 'JPY',
      };

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockSettings,
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/settings', {
        method: 'GET',
      });

      const response = await GET(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
      if (json.ok) {
        expect(json.data.annual_dividend_goal).toBe(1500000);
        expect(json.data.goal_deadline_year).toBe(2032);
        expect(json.data.display_currency).toBe('JPY');
      }
    });

    it('設定未存在時はupsertでデフォルト値を作成して返却する', async () => {
      const mockFrom = vi.fn();
      const mockSelect = vi.fn();
      const mockEq = vi.fn();
      const mockSingle = vi.fn();
      const mockUpsert = vi.fn();

      // 最初のselect: 設定なし
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      // upsert後のselect: デフォルト値
      mockSingle.mockResolvedValueOnce({
        data: {
          user_id: 'user-123',
          annual_dividend_goal: null,
          goal_deadline_year: null,
          display_currency: 'JPY',
        },
        error: null,
      });

      mockUpsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              user_id: 'user-123',
              annual_dividend_goal: null,
              goal_deadline_year: null,
              display_currency: 'JPY',
            },
            error: null,
          }),
        }),
      });

      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({
        select: mockSelect,
        upsert: mockUpsert,
      });

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: mockFrom,
      });

      const request = new Request('http://localhost:3000/api/settings', {
        method: 'GET',
      });

      const response = await GET(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
      if (json.ok) {
        expect(json.data.annual_dividend_goal).toBeNull();
        expect(json.data.goal_deadline_year).toBeNull();
        expect(json.data.display_currency).toBe('JPY');
      }
    });

    it('未設定フィールドはnullを返す', async () => {
      const mockSettings = {
        user_id: 'user-123',
        annual_dividend_goal: null,
        goal_deadline_year: null,
        display_currency: 'JPY',
      };

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockSettings,
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/settings', {
        method: 'GET',
      });

      const response = await GET(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
      if (json.ok) {
        expect(json.data.annual_dividend_goal).toBeNull();
        expect(json.data.goal_deadline_year).toBeNull();
      }
    });
  });
});

describe('PATCH /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('認証チェック', () => {
    it('未認証リクエストで401を返却する', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      });

      const request = new Request('http://localhost:3000/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annual_dividend_goal: 1500000 }),
      });

      const response = await PATCH(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(401);
      expect(json.ok).toBe(false);
      if (!json.ok) {
        expect(json.error.type).toBe('unauthorized');
      }
    });
  });

  describe('バリデーション', () => {
    beforeEach(() => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
      });
    });

    it('annual_dividend_goalが負の数値の場合は400を返却する', async () => {
      const request = new Request('http://localhost:3000/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annual_dividend_goal: -100 }),
      });

      const response = await PATCH(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(400);
      expect(json.ok).toBe(false);
      if (!json.ok) {
        expect(json.error.type).toBe('validation');
        expect(json.error.message).toContain('annual_dividend_goal');
      }
    });

    it('goal_deadline_yearが現在年より小さい場合は400を返却する', async () => {
      const request = new Request('http://localhost:3000/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_deadline_year: 2020 }),
      });

      const response = await PATCH(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(400);
      expect(json.ok).toBe(false);
      if (!json.ok) {
        expect(json.error.type).toBe('validation');
        expect(json.error.message).toContain('goal_deadline_year');
      }
    });

    it('JSONパースエラーの場合は400を返却する', async () => {
      const request = new Request('http://localhost:3000/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await PATCH(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(400);
      expect(json.ok).toBe(false);
      if (!json.ok) {
        expect(json.error.type).toBe('validation');
      }
    });
  });

  describe('設定更新', () => {
    it('指定されたフィールドのみを更新し、更新後の設定を返却する', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: 'user-123',
                annual_dividend_goal: 1500000,
                goal_deadline_year: null,
                display_currency: 'JPY',
              },
              error: null,
            }),
          }),
        }),
      });

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      const request = new Request('http://localhost:3000/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annual_dividend_goal: 1500000 }),
      });

      const response = await PATCH(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
      if (json.ok) {
        expect(json.data.annual_dividend_goal).toBe(1500000);
      }
    });

    it('annual_dividend_goalが0の場合は正常に更新される', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: 'user-123',
                annual_dividend_goal: 0,
                goal_deadline_year: null,
                display_currency: 'JPY',
              },
              error: null,
            }),
          }),
        }),
      });

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      const request = new Request('http://localhost:3000/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annual_dividend_goal: 0 }),
      });

      const response = await PATCH(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
      if (json.ok) {
        expect(json.data.annual_dividend_goal).toBe(0);
      }
    });

    it('goal_deadline_yearが現在年の場合は正常に更新される', async () => {
      const currentYear = new Date().getFullYear();
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: 'user-123',
                annual_dividend_goal: null,
                goal_deadline_year: currentYear,
                display_currency: 'JPY',
              },
              error: null,
            }),
          }),
        }),
      });

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      const request = new Request('http://localhost:3000/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_deadline_year: currentYear }),
      });

      const response = await PATCH(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
      if (json.ok) {
        expect(json.data.goal_deadline_year).toBe(currentYear);
      }
    });

    it('goal_deadline_yearにnullを指定するとクリアされる', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: 'user-123',
                annual_dividend_goal: 1500000,
                goal_deadline_year: null,
                display_currency: 'JPY',
              },
              error: null,
            }),
          }),
        }),
      });

      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      });

      const request = new Request('http://localhost:3000/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_deadline_year: null }),
      });

      const response = await PATCH(request);
      const json = (await response.json()) as SettingsResult<UserSettings>;

      expect(response.status).toBe(200);
      expect(json.ok).toBe(true);
      if (json.ok) {
        expect(json.data.goal_deadline_year).toBeNull();
      }
    });
  });
});
