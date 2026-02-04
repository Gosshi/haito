/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { RoadmapHistoryList } from './roadmap-history-list';
import type { RoadmapHistoryListItem } from '../../lib/roadmap-history/types';
import * as historyStore from '../../stores/roadmap-history-store';

vi.mock('../../stores/roadmap-history-store');

const mockItems: RoadmapHistoryListItem[] = [
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

const setupStore = (overrides?: Partial<ReturnType<typeof historyStore.useRoadmapHistoryStore>>) => {
  vi.mocked(historyStore.useRoadmapHistoryStore).mockImplementation((selector) => {
    const state = {
      items: mockItems,
      selectedId: null,
      selectedDetail: null,
      detailsById: {},
      compareSelection: [],
      isLoading: false,
      error: null,
      fetchHistoryList: vi.fn(),
      selectHistory: vi.fn(),
      toggleCompareSelection: vi.fn(),
      clearCompareSelection: vi.fn(),
      saveHistory: vi.fn(),
      ...overrides,
    } as ReturnType<typeof historyStore.useRoadmapHistoryStore>;
    return selector(state);
  });
};

describe('RoadmapHistoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore();
  });

  it('履歴サマリーを表示する', () => {
    render(<RoadmapHistoryList />);

    expect(screen.getByText('履歴一覧')).toBeInTheDocument();
    expect(screen.getByText('年間配当ゴール')).toBeInTheDocument();
    expect(screen.getByText('¥1,200,000')).toBeInTheDocument();
  });

  it('選択ボタンで詳細取得を呼び出す', () => {
    const selectHistory = vi.fn();
    setupStore({ selectHistory });

    render(<RoadmapHistoryList />);

    fireEvent.click(screen.getByRole('button', { name: '詳細を開く' }));

    expect(selectHistory).toHaveBeenCalledWith('history-1');
  });

  it('比較選択をトグルする', () => {
    const toggleCompareSelection = vi.fn();
    setupStore({ toggleCompareSelection });

    render(<RoadmapHistoryList />);

    fireEvent.click(screen.getByRole('button', { name: '比較に追加' }));

    expect(toggleCompareSelection).toHaveBeenCalledWith('history-1');
  });
});
