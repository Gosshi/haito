import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import type {
  RoadmapHistoryDetail,
  RoadmapHistoryResult,
} from '../../../../../lib/roadmap-history/types';

vi.mock('../../../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '../../../../../lib/supabase/server';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('GET /api/roadmap/history/[id]', () => {
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
      new Request('http://localhost:3000/api/roadmap/history/history-1'),
      { params: { id: 'history-1' } }
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

  it('IDが不正な場合は400を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    });

    const response = await GET(
      new Request('http://localhost:3000/api/roadmap/history/not-a-uuid'),
      { params: { id: 'not-a-uuid' } }
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

  it('存在しない履歴は404を返す', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });
    const mockEq = vi.fn();
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
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
      new Request(
        'http://localhost:3000/api/roadmap/history/11111111-1111-4111-8111-111111111111'
      ),
      { params: { id: '11111111-1111-4111-8111-111111111111' } }
    );
    const json = (await response.json()) as RoadmapHistoryResult<
      RoadmapHistoryDetail
    >;

    expect(response.status).toBe(404);
    expect(json.ok).toBe(false);
    if (!json.ok) {
      expect(json.error.type).toBe('not_found');
    }
  });

  it('履歴詳細を返す', async () => {
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
    const mockEq = vi.fn();
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
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
      new Request(
        'http://localhost:3000/api/roadmap/history/11111111-1111-4111-8111-111111111111'
      ),
      { params: { id: '11111111-1111-4111-8111-111111111111' } }
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

    expect(mockEq).toHaveBeenCalledWith('id', expect.any(String));
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
  });
});
