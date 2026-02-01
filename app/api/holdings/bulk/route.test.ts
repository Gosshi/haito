import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import type { BulkImportResponse } from '../../../../lib/api/holdings-bulk';

// Supabase クライアントのモック
vi.mock('../../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// サービス層のモック
vi.mock('../../../../lib/api/holdings-bulk', async () => {
  const actual = await vi.importActual('../../../../lib/api/holdings-bulk');
  return {
    ...actual,
    bulkImportHoldings: vi.fn(),
  };
});

import { createClient } from '../../../../lib/supabase/server';
import { bulkImportHoldings } from '../../../../lib/api/holdings-bulk';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;
const mockBulkImportHoldings = bulkImportHoldings as ReturnType<typeof vi.fn>;

describe('POST /api/holdings/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('認証チェック', () => {
    it('認証トークンなしで401を返却する', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      });

      const request = new Request('http://localhost:3000/api/holdings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: [{ stock_code: '7203', shares: 100, account_type: 'specific' }],
          duplicateStrategy: 'skip',
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error?.type).toBe('unauthorized');
    });

    it('認証済みユーザーでリクエストを処理する', async () => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      mockBulkImportHoldings.mockResolvedValue({
        ok: true,
        imported: 1,
        skipped: 0,
        errors: [],
      });

      const request = new Request('http://localhost:3000/api/holdings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: [{ stock_code: '7203', shares: 100, account_type: 'specific' }],
          duplicateStrategy: 'skip',
        }),
      });

      const response = await POST(request);
      const json = (await response.json()) as BulkImportResponse;

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('リクエストバリデーション', () => {
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

    it('holdings配列がない場合は400を返却する', async () => {
      const request = new Request('http://localhost:3000/api/holdings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duplicateStrategy: 'skip',
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error?.type).toBe('validation');
    });

    it('holdings配列が空の場合は400を返却する', async () => {
      const request = new Request('http://localhost:3000/api/holdings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: [],
          duplicateStrategy: 'skip',
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error?.type).toBe('validation');
    });

    it('duplicateStrategyがない場合は400を返却する', async () => {
      const request = new Request('http://localhost:3000/api/holdings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: [{ stock_code: '7203', shares: 100, account_type: 'specific' }],
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error?.type).toBe('validation');
    });

    it('duplicateStrategyが無効な値の場合は400を返却する', async () => {
      const request = new Request('http://localhost:3000/api/holdings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: [{ stock_code: '7203', shares: 100, account_type: 'specific' }],
          duplicateStrategy: 'invalid',
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error?.type).toBe('validation');
    });

    it('JSONパースエラーの場合は400を返却する', async () => {
      const request = new Request('http://localhost:3000/api/holdings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
    });
  });

  describe('レスポンス処理', () => {
    beforeEach(() => {
      mockCreateClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });
    });

    it('サービス層の成功結果をAPIレスポンス形式に変換する', async () => {
      mockBulkImportHoldings.mockResolvedValue({
        ok: true,
        imported: 5,
        skipped: 2,
        errors: [{ row: 3, reason: 'エラー' }],
      });

      const request = new Request('http://localhost:3000/api/holdings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: [
            { stock_code: '7203', shares: 100, account_type: 'specific' },
          ],
          duplicateStrategy: 'skip',
        }),
      });

      const response = await POST(request);
      const json = (await response.json()) as BulkImportResponse;

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.imported).toBe(5);
      expect(json.skipped).toBe(2);
      expect(json.errors).toEqual([{ row: 3, reason: 'エラー' }]);
    });

    it('サービス層のデータベースエラーを500で返却する', async () => {
      mockBulkImportHoldings.mockResolvedValue({
        ok: false,
        error: { type: 'database', message: 'DB接続エラー' },
      });

      const request = new Request('http://localhost:3000/api/holdings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: [{ stock_code: '7203', shares: 100, account_type: 'specific' }],
          duplicateStrategy: 'skip',
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error?.type).toBe('database');
    });
  });
});
