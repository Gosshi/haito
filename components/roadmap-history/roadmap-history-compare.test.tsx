/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RoadmapHistoryCompare } from './roadmap-history-compare';
import * as historyStore from '../../stores/roadmap-history-store';
import type { RoadmapHistoryDetail } from '../../lib/roadmap-history/types';

vi.mock('../../stores/roadmap-history-store');

const detail1: RoadmapHistoryDetail = {
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

const detail2: RoadmapHistoryDetail = {
  id: 'history-2',
  created_at: '2026-02-03T00:00:00Z',
  input: {
    target_annual_dividend: 1000000,
    monthly_contribution: 20000,
    horizon_years: 4,
    assumptions: {
      yield_rate: 3.0,
      dividend_growth_rate: 1.5,
      tax_mode: 'after_tax',
    },
  },
  summary: {
    snapshot: { current_annual_dividend: 150000, current_yield_rate: 3.0 },
    result: { target_annual_dividend: 1000000, achieved_in_year: 2029 },
  },
  series: [{ year: 2026, annual_dividend: 150000 }],
};

const setupStore = (overrides?: Partial<ReturnType<typeof historyStore.useRoadmapHistoryStore>>) => {
  vi.mocked(historyStore.useRoadmapHistoryStore).mockImplementation((selector) => {
    const state = {
      items: [],
      selectedId: null,
      selectedDetail: null,
      detailsById: {
        [detail1.id]: detail1,
        [detail2.id]: detail2,
      },
      compareSelection: [detail1.id, detail2.id],
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

describe('RoadmapHistoryCompare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore();
  });

  it('比較対象がない場合はプレースホルダーを表示する', () => {
    setupStore({ compareSelection: [] });

    render(<RoadmapHistoryCompare />);

    expect(screen.getByText('比較する履歴を選択してください')).toBeInTheDocument();
  });

  it('比較サマリーを表示する', () => {
    render(<RoadmapHistoryCompare />);

    expect(screen.getByText('比較サマリー')).toBeInTheDocument();
    expect(screen.getAllByText('年間配当ゴール')).toHaveLength(2);
    expect(screen.getAllByText('最終年の年間配当')).toHaveLength(2);
    expect(screen.getByText('¥1,200,000')).toBeInTheDocument();
    expect(screen.getByText('¥1,000,000')).toBeInTheDocument();
    expect(screen.getByText('¥180,000')).toBeInTheDocument();
    expect(screen.getByText('¥150,000')).toBeInTheDocument();
  });
});
