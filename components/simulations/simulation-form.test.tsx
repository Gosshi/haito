/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as settingsStore from '../../stores/settings-store';
import * as simulationStore from '../../stores/simulation-store';
import * as featureAccessStore from '../../stores/feature-access-store';
import { SimulationForm } from './simulation-form';
import type { UserSettings } from '../../lib/settings/types';
import type { DividendGoalResponse } from '../../lib/simulations/types';
import type { BillingStatus } from '../../lib/access/billing-status';
import type { FeatureAccessState } from '../../stores/feature-access-store';

vi.mock('../../stores/settings-store');
vi.mock('../../stores/simulation-store');
vi.mock('../../stores/feature-access-store');

const mockRunSimulation = vi.fn();

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

  vi.mocked(simulationStore.useSimulationStore).mockImplementation((selector) => {
    const state = {
      input: null,
      response,
      error: null,
      isLoading: false,
      runSimulation: mockRunSimulation,
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

describe('SimulationForm', () => {
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
    render(<SimulationForm />);

    expect(screen.getByLabelText('年間配当目標額（円）')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('月次入金額（円）')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('運用期間（年）')).toHaveAttribute('type', 'number');
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

    render(<SimulationForm />);

    expect(screen.getByLabelText('年間配当目標額（円）')).toHaveValue(1200000);
    expect(screen.getByLabelText('運用期間（年）')).toHaveValue(4);
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

    render(<SimulationForm />);

    expect(screen.getByLabelText('年間配当目標額（円）')).toHaveValue(150000);
  });

  it('snapshotが欠落している場合は利回りを未設定として扱う', () => {
    render(<SimulationForm />);

    expect(screen.getByLabelText('想定利回り（%）')).toHaveValue(null);
  });

  it('数値入力とスライダーが同期する', () => {
    render(<SimulationForm />);

    const targetInput = screen.getByLabelText('年間配当目標額（円）');
    const targetSlider = screen.getByLabelText('年間配当目標額スライダー');

    fireEvent.change(targetInput, { target: { value: '2000000' } });
    expect(targetSlider).toHaveValue('2000000');

    fireEvent.change(targetSlider, { target: { value: '1500000' } });
    expect(targetInput).toHaveValue(1500000);
  });

  it('入力が揃った場合にシミュレーション実行へ繋がる', () => {
    render(<SimulationForm />);

    fireEvent.change(screen.getByLabelText('年間配当目標額（円）'), {
      target: { value: '1000000' },
    });
    fireEvent.change(screen.getByLabelText('月次入金額（円）'), {
      target: { value: '30000' },
    });
    fireEvent.change(screen.getByLabelText('運用期間（年）'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByLabelText('想定利回り（%）'), {
      target: { value: '3.5' },
    });
    fireEvent.change(screen.getByLabelText('想定増配率（%）'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('再投資率（0.0〜1.0）'), {
      target: { value: '0.5' },
    });
    fireEvent.change(screen.getByLabelText('税区分（NISA/課税）'), {
      target: { value: 'taxable' },
    });
    fireEvent.change(screen.getByLabelText('税モード'), {
      target: { value: 'after_tax' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'シミュレーション' }));

    expect(mockRunSimulation).toHaveBeenCalledWith({
      target_annual_dividend: 1000000,
      monthly_contribution: 30000,
      horizon_years: 5,
      assumptions: {
        yield_rate: 3.5,
        dividend_growth_rate: 2,
        reinvest_rate: 0.5,
        account_type: 'taxable',
        tax_mode: 'after_tax',
      },
    });
  });

  it('freeプランでは再投資率と税区分がロックされ注記が表示される', () => {
    setupStores(null, null, { plan: 'free', is_active: false });

    render(<SimulationForm />);

    expect(screen.getByLabelText('再投資率（0.0〜1.0）')).toBeDisabled();
    expect(screen.getByLabelText('税区分（NISA/課税）')).toBeDisabled();
    expect(screen.getByText('Proで利用できます')).toBeInTheDocument();
    expect(
      screen.getByText(
        'より現実に近い試算（再投資率・税区分の調整）や、想定外（減配）の影響確認ができます。'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('入力前提に基づく試算であり、投資助言ではありません。')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'プランの違いを見る' })).toBeInTheDocument();
  });

  it('有料プランでは再投資率と税区分を変更できる', () => {
    setupStores(null, null, { plan: 'premium', is_active: true });

    render(<SimulationForm />);

    expect(screen.getByLabelText('再投資率（0.0〜1.0）')).not.toBeDisabled();
    expect(screen.getByLabelText('税区分（NISA/課税）')).not.toBeDisabled();
    expect(screen.queryByText('Proで利用できます')).toBeNull();
  });
});
