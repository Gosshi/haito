/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import * as settingsStore from '../../stores/settings-store';
import * as roadmapStore from '../../stores/roadmap-store';
import { RoadmapForm } from './roadmap-form';
import type { UserSettings } from '../../lib/settings/types';
import type { DividendGoalResponse } from '../../lib/simulations/types';

vi.mock('../../stores/settings-store');
vi.mock('../../stores/roadmap-store');

const mockRunRoadmap = vi.fn();

const setupStores = (
  settings: UserSettings | null,
  response: DividendGoalResponse | null
) => {
  vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
    const state = {
      settings,
      isLoading: false,
      error: null,
      fetchSettings: vi.fn(),
      updateSettings: vi.fn(),
      clearSettings: vi.fn(),
    };
    return selector(state);
  });

  vi.mocked(roadmapStore.useRoadmapStore).mockImplementation((selector) => {
    const state = {
      input: null,
      response,
      error: null,
      isLoading: false,
      runRoadmap: mockRunRoadmap,
    };
    return selector(state);
  });
};

describe('RoadmapForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStores(null, null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (vi.isFakeTimers()) {
      vi.useRealTimers();
    }
  });

  it('必須パラメータの入力UIを表示する', () => {
    render(<RoadmapForm />);

    expect(screen.getByLabelText('年間配当ゴール（円）')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('毎月の追加投資額（円）')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('期間（年）')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('想定利回り（%）')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('想定増配率（%）')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('税区分')).toBeInTheDocument();
  });

  it('user_settingsとsnapshotから初期値を反映する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const settings: UserSettings = {
      annual_dividend_goal: 1200000,
      goal_deadline_year: 2030,
      display_currency: 'JPY',
    };

    const response: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 180000, current_yield_rate: 3.2 },
    };

    setupStores(settings, response);

    render(<RoadmapForm />);

    expect(screen.getByLabelText('年間配当ゴール（円）')).toHaveValue(1200000);
    expect(screen.getByLabelText('期間（年）')).toHaveValue(4);
    expect(screen.getByLabelText('想定利回り（%）')).toHaveValue(3.2);
  });

  it('目標が未設定の場合はsnapshotの現在配当を初期値に使う', () => {
    const settings: UserSettings = {
      annual_dividend_goal: null,
      goal_deadline_year: null,
      display_currency: 'JPY',
    };

    const response: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 150000, current_yield_rate: null },
    };

    setupStores(settings, response);

    render(<RoadmapForm />);

    expect(screen.getByLabelText('年間配当ゴール（円）')).toHaveValue(150000);
  });

  it('数値入力とスライダーが同期する', () => {
    render(<RoadmapForm />);

    const targetInput = screen.getByLabelText('年間配当ゴール（円）');
    const targetSlider = screen.getByLabelText('年間配当ゴールスライダー');

    fireEvent.change(targetInput, { target: { value: '2000000' } });
    expect(targetSlider).toHaveValue('2000000');

    fireEvent.change(targetSlider, { target: { value: '1500000' } });
    expect(targetInput).toHaveValue(1500000);
  });

  it('入力が揃った場合にロードマップ実行へ繋がる', () => {
    render(<RoadmapForm />);

    fireEvent.change(screen.getByLabelText('年間配当ゴール（円）'), {
      target: { value: '1000000' },
    });
    fireEvent.change(screen.getByLabelText('毎月の追加投資額（円）'), {
      target: { value: '30000' },
    });
    fireEvent.change(screen.getByLabelText('期間（年）'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText('想定利回り（%）'), {
      target: { value: '3.5' },
    });
    fireEvent.change(screen.getByLabelText('想定増配率（%）'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('税区分'), {
      target: { value: 'after_tax' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'ロードマップを試算' }));

    expect(mockRunRoadmap).toHaveBeenCalledWith({
      target_annual_dividend: 1000000,
      monthly_contribution: 30000,
      horizon_years: 5,
      assumptions: {
        yield_rate: 3.5,
        dividend_growth_rate: 2,
        tax_mode: 'after_tax',
      },
    });
  });

  it('未入力時は実行ボタンが無効になる', () => {
    render(<RoadmapForm />);

    const submitButton = screen.getByRole('button', { name: 'ロードマップを試算' });
    expect(submitButton).toBeDisabled();
  });
});
