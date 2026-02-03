/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import DividendGoalSimulationPage from './page';
import { useSimulationStore } from '../../../stores/simulation-store';
import * as settingsStore from '../../../stores/settings-store';
import * as simulationApi from '../../../lib/api/simulations';
import type { DividendGoalResponse } from '../../../lib/simulations/types';

vi.mock('../../../stores/settings-store');
vi.mock('../../../lib/api/simulations');

const setupSettingsStore = () => {
  vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
    const state = {
      settings: null,
      isLoading: false,
      error: null,
      fetchSettings: vi.fn(),
      updateSettings: vi.fn(),
      clearSettings: vi.fn(),
    };
    return selector(state);
  });
};

const fillRequiredInputs = () => {
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
};

describe('DividendGoalSimulationPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSettingsStore();
    useSimulationStore.setState({
      input: null,
      response: null,
      error: null,
      isLoading: false,
    });
  });

  it('入力後にシミュレーション結果が更新される', async () => {
    const response: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 180000 },
      result: {
        target_annual_dividend: 1000000,
        achieved_in_year: 2030,
        end_annual_dividend: 1300000,
      },
    };

    vi.mocked(simulationApi.runDividendGoalSimulation).mockResolvedValueOnce({
      ok: true,
      data: response,
    });

    render(<DividendGoalSimulationPage />);

    fillRequiredInputs();
    fireEvent.click(screen.getByRole('button', { name: 'シミュレーション' }));

    expect(await screen.findByText('目標年間配当')).toBeInTheDocument();
    expect(screen.getByText('¥1,000,000')).toBeInTheDocument();
    expect(screen.getByText('達成年')).toBeInTheDocument();
  });

  it('シミュレーション失敗時にエラーメッセージが表示される', async () => {
    vi.mocked(simulationApi.runDividendGoalSimulation).mockResolvedValueOnce({
      ok: false,
      error: {
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          details: null,
        },
      },
    });

    render(<DividendGoalSimulationPage />);

    fillRequiredInputs();
    fireEvent.click(screen.getByRole('button', { name: 'シミュレーション' }));

    expect(await screen.findByText('Invalid input')).toBeInTheDocument();
  });
});
