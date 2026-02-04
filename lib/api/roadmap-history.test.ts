import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  createRoadmapHistory,
  fetchRoadmapHistoryDetail,
  fetchRoadmapHistoryList,
} from './roadmap-history';
import type {
  RoadmapHistoryCreateRequest,
  RoadmapHistoryDetail,
  RoadmapHistoryListItem,
} from '../roadmap-history/types';

const mockList: RoadmapHistoryListItem[] = [
  {
    id: 'history-1',
    created_at: '2026-02-04T00:00:00Z',
    input: {
      target_annual_dividend: 1200000,
      monthly_contribution: 30000,
      horizon_years: 5,
      assumptions: {
        yield_rate: 3.5,
        dividend_growth_rate: 2.0,
        tax_mode: 'after_tax',
      },
    },
    summary: {
      snapshot: { current_annual_dividend: 180000, current_yield_rate: 3.2 },
      result: { target_annual_dividend: 1200000, achieved_in_year: 2030 },
    },
  },
];

const mockDetail: RoadmapHistoryDetail = {
  ...mockList[0],
  series: [
    { year: 2026, annual_dividend: 180000 },
    { year: 2027, annual_dividend: 240000 },
  ],
};

describe('fetchRoadmapHistoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('成功時に履歴一覧を返す', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockList }),
    } as Response);

    const result = await fetchRoadmapHistoryList();

    expect(result).toEqual({ ok: true, data: mockList });
    expect(fetch).toHaveBeenCalledWith('/api/roadmap/history', {
      method: 'GET',
      credentials: 'include',
    });
  });

  it('limitを指定した場合はクエリに含める', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockList }),
    } as Response);

    await fetchRoadmapHistoryList(5);

    expect(fetch).toHaveBeenCalledWith('/api/roadmap/history?limit=5', {
      method: 'GET',
      credentials: 'include',
    });
  });

  it('エラー時にエラー結果を返す', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () =>
        Promise.resolve({
          ok: false,
          error: { type: 'unauthorized', message: 'Authentication required' },
        }),
    } as Response);

    const result = await fetchRoadmapHistoryList();

    expect(result).toEqual({
      ok: false,
      error: { type: 'unauthorized', message: 'Authentication required' },
    });
  });
});

describe('fetchRoadmapHistoryDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('成功時に履歴詳細を返す', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockDetail }),
    } as Response);

    const result = await fetchRoadmapHistoryDetail(mockDetail.id);

    expect(result).toEqual({ ok: true, data: mockDetail });
    expect(fetch).toHaveBeenCalledWith(
      `/api/roadmap/history/${mockDetail.id}`,
      { method: 'GET', credentials: 'include' }
    );
  });

  it('存在しない履歴はnot_foundを返す', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () =>
        Promise.resolve({
          ok: false,
          error: { type: 'not_found', message: 'History not found' },
        }),
    } as Response);

    const result = await fetchRoadmapHistoryDetail('missing-history');

    expect(result).toEqual({
      ok: false,
      error: { type: 'not_found', message: 'History not found' },
    });
  });
});

describe('createRoadmapHistory', () => {
  const payload: RoadmapHistoryCreateRequest = {
    input: mockDetail.input,
    summary: mockDetail.summary,
    series: mockDetail.series,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('成功時に履歴詳細を返す', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: mockDetail }),
    } as Response);

    const result = await createRoadmapHistory(payload);

    expect(result).toEqual({ ok: true, data: mockDetail });
    expect(fetch).toHaveBeenCalledWith('/api/roadmap/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  });

  it('ネットワークエラー時はunknownで返す', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network down'));

    const result = await createRoadmapHistory(payload);

    expect(result).toEqual({
      ok: false,
      error: { type: 'unknown', message: 'Network down' },
    });
  });
});
