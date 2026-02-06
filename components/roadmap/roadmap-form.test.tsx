/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import * as settingsStore from '../../stores/settings-store';
import * as roadmapStore from '../../stores/roadmap-store';
import * as featureAccessStore from '../../stores/feature-access-store';
import { RoadmapForm } from './roadmap-form';
import type { UserSettings } from '../../lib/settings/types';
import type { DividendGoalResponse } from '../../lib/simulations/types';
import type { BillingStatus } from '../../lib/access/billing-status';
import type { FeatureAccessState } from '../../stores/feature-access-store';

vi.mock('../../stores/settings-store');
vi.mock('../../stores/roadmap-store');
vi.mock('../../stores/feature-access-store');

const mockRunRoadmap = vi.fn();

const setupStores = (
  settings: UserSettings | null,
  response: DividendGoalResponse | null,
  billingStatus: BillingStatus | null = { plan: 'premium', is_active: true }
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

  vi.mocked(featureAccessStore.useFeatureAccessStore).mockImplementation(
    (selector) => {
      const state: FeatureAccessState = {
        status: billingStatus,
        locks: {} as FeatureAccessState['locks'],
        refreshStatus: vi.fn().mockResolvedValue(undefined),
        lockFeature: vi.fn(),
        unlockFeature: vi.fn(),
      };
      return selector(state);
    }
  );
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
    expect(screen.getByText('再投資（配当の使い道）')).toBeInTheDocument();
    expect(screen.getByLabelText('再投資率（0.0〜1.0）')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('税区分（NISA/課税）')).toBeInTheDocument();
    expect(screen.getByLabelText('税モード')).toBeInTheDocument();
    expect(
      screen.getByText(
        '税率は簡易的に固定値で計算しています。入力前提に基づく試算です。'
      )
    ).toBeInTheDocument();
  });

  it('前提条件と試算のヘルプ文を表示する', () => {
    render(<RoadmapForm />);

    expect(screen.getByText(/前提条件.*試算/)).toBeInTheDocument();
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
    expect(screen.getByLabelText('想定利回り（%）')).toHaveValue(3);
  });

  it('設定もsnapshotもない場合は安全なデフォルトで初期化する', () => {
    render(<RoadmapForm />);

    expect(screen.getByLabelText('年間配当ゴール（円）')).toHaveValue(1000000);
    expect(screen.getByLabelText('毎月の追加投資額（円）')).toHaveValue(30000);
    expect(screen.getByLabelText('期間（年）')).toHaveValue(10);
    expect(screen.getByLabelText('想定利回り（%）')).toHaveValue(3);
    expect(screen.getByLabelText('想定増配率（%）')).toHaveValue(1);
    expect(screen.getByLabelText('再投資率（0.0〜1.0）')).toHaveValue(1);
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

  it('数値入力とスライダーで同一の制約値を使う', () => {
    render(<RoadmapForm />);

    const targetInput = screen.getByLabelText('年間配当ゴール（円）');
    const targetSlider = screen.getByLabelText('年間配当ゴールスライダー');

    expect(targetInput).toHaveAttribute('min', '0');
    expect(targetInput).toHaveAttribute('max', '5000000');
    expect(targetInput).toHaveAttribute('step', '10000');
    expect(targetSlider).toHaveAttribute('min', '0');
    expect(targetSlider).toHaveAttribute('max', '5000000');
    expect(targetSlider).toHaveAttribute('step', '10000');
  });

  it('範囲外入力はクランプして保持する', () => {
    render(<RoadmapForm />);

    const monthlyInput = screen.getByLabelText('毎月の追加投資額（円）');
    fireEvent.change(monthlyInput, { target: { value: '9999999' } });

    expect(monthlyInput).toHaveValue(200000);
  });

  it('数値として解釈できない場合はエラーを表示して送信できない', () => {
    render(<RoadmapForm />);

    const yieldInput = screen.getByLabelText('想定利回り（%）');
    fireEvent.change(yieldInput, { target: { value: 'abc' } });

    expect(screen.getByText('数値で入力してください')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'ロードマップを試算' })
    ).toBeDisabled();
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
    fireEvent.change(screen.getByLabelText('再投資率（0.0〜1.0）'), {
      target: { value: '0.8' },
    });
    fireEvent.change(screen.getByLabelText('税区分（NISA/課税）'), {
      target: { value: 'taxable' },
    });
    fireEvent.change(screen.getByLabelText('税モード'), {
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
        reinvest_rate: 0.8,
        account_type: 'taxable',
        tax_mode: 'after_tax',
      },
    });
  });

  it('freeプランでは再投資率と税区分がロックされ注記が表示される', () => {
    setupStores(null, null, { plan: 'free', is_active: false });

    render(<RoadmapForm />);

    expect(screen.getByLabelText('再投資率（0.0〜1.0）')).toBeDisabled();
    expect(screen.getByLabelText('税区分（NISA/課税）')).toBeDisabled();
    expect(
      screen.getByText('Freeでは再投資は100%・税区分はNISA固定で試算します')
    ).toBeInTheDocument();
  });

  it('有料プランでは再投資率と税区分を変更できる', () => {
    setupStores(null, null, { plan: 'premium', is_active: true });

    render(<RoadmapForm />);

    expect(screen.getByLabelText('再投資率（0.0〜1.0）')).not.toBeDisabled();
    expect(screen.getByLabelText('税区分（NISA/課税）')).not.toBeDisabled();
    expect(
      screen.queryByText('Freeでは再投資は100%・税区分はNISA固定で試算します')
    ).toBeNull();
  });

  it('デフォルト値で試算が実行できる', () => {
    render(<RoadmapForm />);

    const submitButton = screen.getByRole('button', { name: 'ロードマップを試算' });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    expect(mockRunRoadmap).toHaveBeenCalledWith({
      target_annual_dividend: 1000000,
      monthly_contribution: 30000,
      horizon_years: 10,
      assumptions: {
        yield_rate: 3,
        dividend_growth_rate: 1,
        reinvest_rate: 1,
        account_type: 'nisa',
        tax_mode: 'after_tax',
      },
    });
  });
});
