import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useRoadmapHistoryStore } from './roadmap-history-store';
import * as historyApi from '../lib/api/roadmap-history';
import * as toastStore from './toast-store';
import type {
  RoadmapHistoryCreateRequest,
  RoadmapHistoryDetail,
  RoadmapHistoryResult,
} from '../lib/roadmap-history/types';

vi.mock('../lib/api/roadmap-history');
vi.mock('./toast-store');

const mockDetail: RoadmapHistoryDetail = {
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
  series: [{ year: 2026, annual_dividend: 180000 }],
};

describe('useRoadmapHistoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRoadmapHistoryStore.setState({
      items: [],
      selectedId: null,
      selectedDetail: null,
      detailsById: {},
      compareSelection: [],
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const state = useRoadmapHistoryStore.getState();

    expect(state.items).toEqual([]);
    expect(state.selectedId).toBeNull();
    expect(state.selectedDetail).toBeNull();
    expect(state.compareSelection).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('一覧取得に成功するとitemsを更新する', async () => {
    vi.mocked(historyApi.fetchRoadmapHistoryList).mockResolvedValueOnce({
      ok: true,
      data: [mockDetail],
    });

    await useRoadmapHistoryStore.getState().fetchHistoryList();

    const state = useRoadmapHistoryStore.getState();
    expect(state.items).toEqual([mockDetail]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('一覧取得で失敗した場合はerrorを設定する', async () => {
    vi.mocked(historyApi.fetchRoadmapHistoryList).mockResolvedValueOnce({
      ok: false,
      error: { type: 'unauthorized', message: 'Authentication required' },
    });

    await useRoadmapHistoryStore.getState().fetchHistoryList();

    const state = useRoadmapHistoryStore.getState();
    expect(state.items).toEqual([]);
    expect(state.error).toEqual({
      type: 'unauthorized',
      message: 'Authentication required',
    });
  });

  it('履歴を選択するとselectedDetailが更新される', async () => {
    vi.mocked(historyApi.fetchRoadmapHistoryDetail).mockResolvedValueOnce({
      ok: true,
      data: mockDetail,
    });

    await useRoadmapHistoryStore.getState().selectHistory(mockDetail.id);

    const state = useRoadmapHistoryStore.getState();
    expect(state.selectedId).toBe(mockDetail.id);
    expect(state.selectedDetail).toEqual(mockDetail);
    expect(state.detailsById[mockDetail.id]).toEqual(mockDetail);
  });

  it('比較選択をトグルできる', () => {
    const store = useRoadmapHistoryStore.getState();
    useRoadmapHistoryStore.setState({
      detailsById: { [mockDetail.id]: mockDetail },
    });

    store.toggleCompareSelection(mockDetail.id);
    expect(useRoadmapHistoryStore.getState().compareSelection).toEqual([
      mockDetail.id,
    ]);

    store.toggleCompareSelection(mockDetail.id);
    expect(useRoadmapHistoryStore.getState().compareSelection).toEqual([]);
  });

  it('比較対象追加時に詳細を取得して保持する', async () => {
    useRoadmapHistoryStore.setState({ detailsById: {} });
    vi.mocked(historyApi.fetchRoadmapHistoryDetail).mockResolvedValueOnce({
      ok: true,
      data: mockDetail,
    });

    useRoadmapHistoryStore.getState().toggleCompareSelection(mockDetail.id);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(historyApi.fetchRoadmapHistoryDetail).toHaveBeenCalledWith(
      mockDetail.id
    );
    expect(useRoadmapHistoryStore.getState().detailsById[mockDetail.id]).toEqual(
      mockDetail
    );
  });

  it('保存成功時に履歴を先頭へ追加する', async () => {
    const payload: RoadmapHistoryCreateRequest = {
      input: mockDetail.input,
      summary: mockDetail.summary,
      series: mockDetail.series,
    };

    useRoadmapHistoryStore.setState({ items: [] });

    vi.mocked(historyApi.createRoadmapHistory).mockResolvedValueOnce({
      ok: true,
      data: mockDetail,
    });

    const result = await useRoadmapHistoryStore.getState().saveHistory(payload);

    expect(result).toEqual({ ok: true, data: mockDetail });
    expect(useRoadmapHistoryStore.getState().items[0]).toEqual(mockDetail);
  });

  it('保存失敗時にerrorと通知を設定する', async () => {
    const payload: RoadmapHistoryCreateRequest = {
      input: mockDetail.input,
      summary: mockDetail.summary,
      series: mockDetail.series,
    };

    vi.mocked(historyApi.createRoadmapHistory).mockResolvedValueOnce({
      ok: false,
      error: { type: 'unknown', message: 'Failed to save history' },
    });

    const result = await useRoadmapHistoryStore.getState().saveHistory(payload);

    expect(result).toEqual({
      ok: false,
      error: { type: 'unknown', message: 'Failed to save history' },
    });
    expect(useRoadmapHistoryStore.getState().error).toEqual({
      type: 'unknown',
      message: 'Failed to save history',
    });
    expect(toastStore.pushToast).toHaveBeenCalledWith(
      '履歴の保存に失敗しました: Failed to save history',
      'error'
    );
  });

  it('保存は最新の結果のみ反映する', async () => {
    const payload: RoadmapHistoryCreateRequest = {
      input: mockDetail.input,
      summary: mockDetail.summary,
      series: mockDetail.series,
    };

    let resolveFirst: (value: RoadmapHistoryResult<RoadmapHistoryDetail>) => void;
    let resolveSecond: (value: RoadmapHistoryResult<RoadmapHistoryDetail>) => void;

    const firstPromise = new Promise<RoadmapHistoryResult<RoadmapHistoryDetail>>(
      (resolve) => {
        resolveFirst = resolve;
      }
    );
    const secondPromise = new Promise<
      RoadmapHistoryResult<RoadmapHistoryDetail>
    >((resolve) => {
      resolveSecond = resolve;
    });

    vi.mocked(historyApi.createRoadmapHistory)
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const firstRun = useRoadmapHistoryStore.getState().saveHistory(payload);
    const secondRun = useRoadmapHistoryStore.getState().saveHistory({
      ...payload,
      summary: {
        snapshot: { current_annual_dividend: 200000, current_yield_rate: 3.1 },
        result: { target_annual_dividend: 1300000 },
      },
    });

    resolveSecond!({
      ok: true,
      data: {
        ...mockDetail,
        id: 'history-2',
      },
    });
    await secondRun;

    resolveFirst!({
      ok: true,
      data: {
        ...mockDetail,
        id: 'history-1',
      },
    });
    await firstRun;

    const state = useRoadmapHistoryStore.getState();
    expect(state.items[0]?.id).toBe('history-2');
  });
});
