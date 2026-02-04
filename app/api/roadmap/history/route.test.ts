import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import type {
  RoadmapHistoryDetail,
  RoadmapHistoryListItem,
  RoadmapHistoryResult,
} from '../../../../lib/roadmap-history/types';

vi.mock('../../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '../../../../lib/supabase/server';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('GET /api/roadmap/history', () => {
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
      new Request('http://localhost:3000/api/roadmap/history')
    );
    const json = (await response.json()) as RoadmapHistoryResult<
      RoadmapHistoryListItem[]
    >;

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    if (!json.ok) {
      expect(json.error.type).toBe('unauthorized');
    }
  });

  it('limitが不正な場合は400を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    });

    const response = await GET(
      new Request('http://localhost:3000/api/roadmap/history?limit=abc')
    );
    const json = (await response.json()) as RoadmapHistoryResult<
      RoadmapHistoryListItem[]
    >;

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    if (!json.ok) {
      expect(json.error.type).toBe('validation');
    }
  });

  it('履歴一覧を返す', async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'history-1',
          created_at: '2026-02-04T00:00:00Z',
          input: { target_annual_dividend: 100 },
          summary: { snapshot: null, result: null },
        },
      ],
      error: null,
    });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: mockFrom,
    });

    const response = await GET(
      new Request('http://localhost:3000/api/roadmap/history?limit=5')
    );
    const json = (await response.json()) as RoadmapHistoryResult<
      RoadmapHistoryListItem[]
    >;

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    if (json.ok) {
      expect(json.data).toHaveLength(1);
      expect(json.data[0]?.id).toBe('history-1');
    }

    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(5);
  });
});

describe('POST /api/roadmap/history', () => {
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

    const response = await POST(
      new Request('http://localhost:3000/api/roadmap/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { target_annual_dividend: 100 },
          summary: { snapshot: null, result: null },
          series: [],
        }),
      })
    );

    const json = (await response.json()) as RoadmapHistoryResult<
      RoadmapHistoryDetail
    >;

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    if (!json.ok) {
      expect(json.error.type).toBe('unauthorized');
    }
  });

  it('JSONが不正な場合は400を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    });

    const response = await POST(
      new Request('http://localhost:3000/api/roadmap/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })
    );

    const json = (await response.json()) as RoadmapHistoryResult<
      RoadmapHistoryDetail
    >;

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    if (!json.ok) {
      expect(json.error.type).toBe('validation');
    }
  });

  it('必須フィールドが不足している場合は400を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    });

    const response = await POST(
      new Request('http://localhost:3000/api/roadmap/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { target_annual_dividend: 100 },
          summary: { snapshot: null, result: null },
        }),
      })
    );

    const json = (await response.json()) as RoadmapHistoryResult<
      RoadmapHistoryDetail
    >;

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    if (!json.ok) {
      expect(json.error.type).toBe('validation');
    }
  });

  it('履歴を保存して返す', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'history-1',
        created_at: '2026-02-04T00:00:00Z',
        input: { target_annual_dividend: 100 },
        summary: { snapshot: null, result: null },
        series: [{ year: 2026, annual_dividend: 10 }],
      },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: mockFrom,
    });

    const response = await POST(
      new Request('http://localhost:3000/api/roadmap/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { target_annual_dividend: 100 },
          summary: { snapshot: null, result: null },
          series: [{ year: 2026, annual_dividend: 10 }],
        }),
      })
    );

    const json = (await response.json()) as RoadmapHistoryResult<
      RoadmapHistoryDetail
    >;

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    if (json.ok) {
      expect(json.data.id).toBe('history-1');
      expect(json.data.series).toHaveLength(1);
    }

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-123' })
    );
  });
});
