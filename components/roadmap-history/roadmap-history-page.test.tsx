/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { RoadmapHistoryPage } from './roadmap-history-page';
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

describe('RoadmapHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore();
  });

  it('見出しと説明文を表示する', () => {
    render(<RoadmapHistoryPage />);

    expect(screen.getByText('ロードマップ履歴')).toBeInTheDocument();
    expect(
      screen.getByText('過去に実行した配当ロードマップを確認できます。')
    ).toBeInTheDocument();
  });

  it('エクスポートボタンが無効の時はクリックできない', () => {
    render(<RoadmapHistoryPage />);

    const button = screen.getByRole('button', { name: '選択中の履歴をエクスポート' });
    expect(button).toBeDisabled();
  });

  it('エクスポート操作でクリップボード書き込みを行う', async () => {
    const mockWrite = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWrite,
      },
    });

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
        summary: { snapshot: null, result: null },
        series: [],
      },
    });

    render(<RoadmapHistoryPage />);

    fireEvent.click(
      screen.getByRole('button', { name: '選択中の履歴をエクスポート' })
    );

    expect(mockWrite).toHaveBeenCalled();
  });
});
