/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RoadmapHistoryDetailView } from './roadmap-history-detail';
import * as historyStore from '../../stores/roadmap-history-store';

vi.mock('../../stores/roadmap-history-store');

const setupStore = (overrides?: Partial<ReturnType<typeof historyStore.useRoadmapHistoryStore>>) => {
  vi.mocked(historyStore.useRoadmapHistoryStore).mockImplementation((selector) => {
    const state = {
      items: [],
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

describe('RoadmapHistoryDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore();
  });

  it('未選択時はプレースホルダーを表示する', () => {
    render(<RoadmapHistoryDetailView />);

    expect(screen.getByText('履歴を選択してください')).toBeInTheDocument();
  });

  it('詳細がある場合は入力とサマリーを表示する', () => {
    setupStore({
      selectedDetail: {
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
      },
    });

    render(<RoadmapHistoryDetailView />);

    expect(screen.getByText('入力条件')).toBeInTheDocument();
    expect(screen.getByText('年間配当ゴール')).toBeInTheDocument();
    expect(screen.getByText('¥1,200,000')).toBeInTheDocument();
    expect(screen.getByText('サマリー')).toBeInTheDocument();
    expect(screen.getByText('シリーズ')).toBeInTheDocument();
  });
});
