/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import * as roadmapStore from '../../stores/roadmap-store';
import * as shockStore from '../../stores/roadmap-shock-store';
import { RoadmapShockForm } from './roadmap-shock-form';
import type { DividendGoalRequest } from '../../lib/simulations/types';

vi.mock('../../stores/roadmap-store');
vi.mock('../../stores/roadmap-shock-store');

const mockRunShock = vi.fn();

const setupStores = (roadmapInput: DividendGoalRequest | null) => {
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

  vi.mocked(shockStore.useRoadmapShockStore).mockImplementation((selector) => {
    const state = {
      input: null,
      response: null,
      error: null,
      isLoading: false,
      runShock: mockRunShock,
    };
    return selector(state);
  });
};

describe('RoadmapShockForm', () => {
  const baseInput: DividendGoalRequest = {
    target_annual_dividend: 1000000,
    monthly_contribution: 30000,
    horizon_years: 5,
    assumptions: {
      yield_rate: 3.5,
      dividend_growth_rate: 2.0,
      tax_mode: 'after_tax',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupStores(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('減配年と減配率の入力UIを表示する', () => {
    render(<RoadmapShockForm />);

    expect(screen.getByLabelText('減配年')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('減配率（%）')).toHaveAttribute('type', 'number');
  });

  it('ロードマップ入力が不足している場合は実行できない', () => {
    render(<RoadmapShockForm />);

    const submitButton = screen.getByRole('button', {
      name: 'ストレステストを実行',
    });
    expect(submitButton).toBeDisabled();
  });

  it('減配年・減配率が未入力の場合は実行できない', () => {
    setupStores(baseInput);

    render(<RoadmapShockForm />);

    const submitButton = screen.getByRole('button', {
      name: 'ストレステストを実行',
    });
    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('減配年'), {
      target: { value: '2027' },
    });
    expect(submitButton).toBeDisabled();
  });

  it('入力が揃った場合にストレステスト実行へ繋がる', () => {
    setupStores(baseInput);

    render(<RoadmapShockForm />);

    fireEvent.change(screen.getByLabelText('減配年'), {
      target: { value: '2027' },
    });
    fireEvent.change(screen.getByLabelText('減配率（%）'), {
      target: { value: '25' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'ストレステストを実行' })
    );

    expect(mockRunShock).toHaveBeenCalledWith({
      ...baseInput,
      shock: {
        year: 2027,
        rate: 25,
      },
    });
  });
});
