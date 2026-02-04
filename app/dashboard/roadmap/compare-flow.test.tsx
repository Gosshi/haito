/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import RoadmapPage from './page';
import * as settingsStore from '../../../stores/settings-store';
import * as roadmapStore from '../../../stores/roadmap-store';
import * as scenarioCompareStore from '../../../stores/scenario-compare-store';
import type {
  DividendGoalRequest,
  SimulationErrorResponse,
} from '../../../lib/simulations/types';

vi.mock('../../../stores/settings-store');
vi.mock('../../../stores/roadmap-store');
vi.mock('../../../stores/scenario-compare-store');

const setupStores = (
  compareError: SimulationErrorResponse | null = null,
  roadmapInput: DividendGoalRequest | null = null
) => {
  const mockFetchSettings = vi.fn();
  const mockSetInputFromRoadmap = vi.fn();

  vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
    const state = {
      settings: null,
      isLoading: false,
      error: null,
      fetchSettings: mockFetchSettings,
      updateSettings: vi.fn().mockResolvedValue({ ok: true }),
      clearSettings: vi.fn().mockResolvedValue({ ok: true }),
    };
    return selector(state);
  });

  vi.mocked(roadmapStore.useRoadmapStore).mockImplementation((selector) => {
    const state = {
      input: roadmapInput,
      response: null,
      error: null,
      isLoading: false,
      runRoadmap: vi.fn(),
    };
    return selector(state);
  });

  vi.mocked(scenarioCompareStore.useScenarioCompareStore).mockImplementation(
    (selector) => {
      const state = {
        input: null,
        response: null,
        error: compareError,
        isLoading: false,
        runScenarioCompare: vi.fn(),
        setInputFromRoadmap: mockSetInputFromRoadmap,
      };
      return selector(state);
    }
  );

  return { mockSetInputFromRoadmap };
};

describe('RoadmapPage compare flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStores();
  });

  it('比較表示に切り替えると見出しと注意文を表示する', () => {
    const roadmapInput: DividendGoalRequest = {
      target_annual_dividend: 1200000,
      monthly_contribution: 30000,
      horizon_years: 5,
      assumptions: {
        yield_rate: 3.5,
        dividend_growth_rate: 2.0,
        tax_mode: 'after_tax',
      },
    };

    const { mockSetInputFromRoadmap } = setupStores(null, roadmapInput);

    render(<RoadmapPage />);

    fireEvent.click(screen.getByRole('button', { name: 'シナリオ比較' }));

    expect(screen.getByText('条件別ロードマップ比較')).toBeInTheDocument();
    expect(
      screen.getByText(
        '前提条件を変えた場合の試算比較です。特定の投資判断を勧めるものではありません。'
      )
    ).toBeInTheDocument();
    expect(mockSetInputFromRoadmap).toHaveBeenCalledWith(roadmapInput);
  });

  it('エラー時でも単一シナリオ表示へ戻れる', () => {
    setupStores({
      error: {
        code: 'BAD_REQUEST',
        message: 'Compare failed',
        details: null,
      },
    });

    render(<RoadmapPage />);

    fireEvent.click(screen.getByRole('button', { name: 'シナリオ比較' }));

    expect(screen.getByText('Compare failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '単一シナリオ' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '単一シナリオ' }));

    expect(screen.getByText('ロードマップの前提条件')).toBeInTheDocument();
  });
});
