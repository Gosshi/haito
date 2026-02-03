/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DividendGoalSimulationPage from './page';
import * as settingsStore from '../../../stores/settings-store';
import * as simulationStore from '../../../stores/simulation-store';
import type { SimulationErrorResponse } from '../../../lib/simulations/types';

vi.mock('../../../stores/settings-store');
vi.mock('../../../stores/simulation-store');

const setupStores = (error: SimulationErrorResponse | null = null) => {
  const mockFetchSettings = vi.fn();

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

  vi.mocked(simulationStore.useSimulationStore).mockImplementation((selector) => {
    const state = {
      input: null,
      response: null,
      error,
      isLoading: false,
      runSimulation: vi.fn(),
    };
    return selector(state);
  });

  return { mockFetchSettings };
};

describe('DividendGoalSimulationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStores(null);
  });

  it('配当目標シミュレーションのページ構成を表示する', () => {
    render(<DividendGoalSimulationPage />);

    expect(screen.getByText('配当目標シミュレーション')).toBeInTheDocument();
    expect(
      screen.getByText('シミュレーション条件を調整して配当目標の達成を確認できます。')
    ).toBeInTheDocument();
    expect(screen.getByText('シミュレーション条件')).toBeInTheDocument();
    expect(screen.getByText('シミュレーション結果')).toBeInTheDocument();
  });

  it('ページマウント時に設定を取得する', () => {
    const { mockFetchSettings } = setupStores(null);

    render(<DividendGoalSimulationPage />);

    expect(mockFetchSettings).toHaveBeenCalled();
  });

  it('未認証時に案内とエラーメッセージを表示する', () => {
    setupStores({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
        details: null,
      },
    });

    render(<DividendGoalSimulationPage />);

    expect(screen.getByText('ログインが必要です。')).toBeInTheDocument();
    expect(screen.getByText('Authentication required.')).toBeInTheDocument();
  });

  it('エラー時にエラーメッセージを表示する', () => {
    setupStores({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid input',
        details: null,
      },
    });

    render(<DividendGoalSimulationPage />);

    expect(screen.getByText('Invalid input')).toBeInTheDocument();
  });

  it('ダッシュボードへのリンクを表示する', () => {
    render(<DividendGoalSimulationPage />);

    const link = screen.getByRole('link', { name: 'ダッシュボードへ' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });
});
