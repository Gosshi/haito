/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import RoadmapPage from './page';
import * as settingsStore from '../../../stores/settings-store';
import * as roadmapStore from '../../../stores/roadmap-store';
import * as scenarioCompareStore from '../../../stores/scenario-compare-store';
import type { SimulationErrorResponse } from '../../../lib/simulations/types';

vi.mock('../../../stores/settings-store');
vi.mock('../../../stores/roadmap-store');
vi.mock('../../../stores/scenario-compare-store');

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

  vi.mocked(roadmapStore.useRoadmapStore).mockImplementation((selector) => {
    const state = {
      input: null,
      response: null,
      error,
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
        error: null,
        isLoading: false,
        runScenarioCompare: vi.fn(),
        setInputFromRoadmap: vi.fn(),
      };
      return selector(state);
    }
  );

  return { mockFetchSettings };
};

describe('RoadmapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStores(null);
  });

  it('配当ロードマップのページ構成を表示する', () => {
    render(<RoadmapPage />);

    expect(screen.getByText('配当ロードマップ')).toBeInTheDocument();
    expect(screen.getByText('ロードマップの前提条件')).toBeInTheDocument();
    expect(screen.getByText('ロードマップ概要')).toBeInTheDocument();
    expect(screen.getByText('配当の推移（ロードマップ）')).toBeInTheDocument();
    expect(
      screen.getByText('想定外が起きた場合のロードマップ')
    ).toBeInTheDocument();
    expect(
      screen.getByText('一時的な減配が起きた場合の影響を確認できます。')
    ).toBeInTheDocument();
    expect(screen.getByText('効きやすいレバー（感度チェック）')).toBeInTheDocument();
    expect(
      screen.getByText(
        '入力した条件に基づく試算です。特定の投資商品を勧めるものではありません。'
      )
    ).toBeInTheDocument();
  });

  it('ページマウント時に設定を取得する', () => {
    const { mockFetchSettings } = setupStores(null);

    render(<RoadmapPage />);

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

    render(<RoadmapPage />);

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

    render(<RoadmapPage />);

    expect(screen.getByText('Invalid input')).toBeInTheDocument();
  });
});
