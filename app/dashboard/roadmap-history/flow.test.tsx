/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import RoadmapHistoryDashboardPage from './page';
import * as historyStore from '../../../stores/roadmap-history-store';

vi.mock('../../../stores/roadmap-history-store');

const setupStore = () => {
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
    } as ReturnType<typeof historyStore.useRoadmapHistoryStore>;
    return selector(state);
  });
};

describe('RoadmapHistoryDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore();
  });

  it('履歴画面の見出しと説明文を表示する', () => {
    render(<RoadmapHistoryDashboardPage />);

    expect(screen.getByText('ロードマップ履歴')).toBeInTheDocument();
    expect(
      screen.getByText('過去に実行した配当ロードマップを確認できます。')
    ).toBeInTheDocument();
  });
});
