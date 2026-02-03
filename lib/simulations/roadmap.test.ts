import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { runRoadmapSimulation } from './roadmap';
import * as simulationsApi from '../api/simulations';
import * as simulationMock from './mock';
import type { DividendGoalRequest, DividendGoalResponse } from './types';

vi.mock('../api/simulations');
vi.mock('./mock');

describe('runRoadmapSimulation', () => {
  const mockInput: DividendGoalRequest = {
    target_annual_dividend: 1000000,
    monthly_contribution: 30000,
    horizon_years: 5,
    assumptions: {
      yield_rate: 3.5,
      dividend_growth_rate: 2.0,
      tax_mode: 'after_tax',
    },
  };

  const mockResponse: DividendGoalResponse = {
    snapshot: { current_annual_dividend: 180000 },
  };

  const originalEnv = {
    nodeEnv: process.env.NODE_ENV,
    mockFlag: process.env.NEXT_PUBLIC_ROADMAP_SIMULATION_MOCK,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    delete process.env.NEXT_PUBLIC_ROADMAP_SIMULATION_MOCK;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv.nodeEnv;
    if (originalEnv.mockFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ROADMAP_SIMULATION_MOCK;
    } else {
      process.env.NEXT_PUBLIC_ROADMAP_SIMULATION_MOCK = originalEnv.mockFlag;
    }
  });

  it('モック無効時は実APIを使用する', async () => {
    vi.mocked(simulationsApi.runDividendGoalSimulation).mockResolvedValueOnce({
      ok: true,
      data: mockResponse,
    });

    const result = await runRoadmapSimulation(mockInput);

    expect(simulationsApi.runDividendGoalSimulation).toHaveBeenCalledWith(
      mockInput
    );
    expect(simulationMock.runDividendGoalSimulationMock).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, data: mockResponse });
  });

  it('モック有効時はモック実装を使用する', async () => {
    process.env.NEXT_PUBLIC_ROADMAP_SIMULATION_MOCK = 'true';

    vi.mocked(simulationMock.runDividendGoalSimulationMock).mockResolvedValueOnce({
      ok: true,
      data: mockResponse,
    });

    const result = await runRoadmapSimulation(mockInput);

    expect(simulationMock.runDividendGoalSimulationMock).toHaveBeenCalledWith(
      mockInput
    );
    expect(simulationsApi.runDividendGoalSimulation).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, data: mockResponse });
  });

  it('本番環境ではモックフラグが有効でも実APIを使用する', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_ROADMAP_SIMULATION_MOCK = 'true';

    vi.mocked(simulationsApi.runDividendGoalSimulation).mockResolvedValueOnce({
      ok: true,
      data: mockResponse,
    });

    const result = await runRoadmapSimulation(mockInput);

    expect(simulationsApi.runDividendGoalSimulation).toHaveBeenCalledWith(
      mockInput
    );
    expect(simulationMock.runDividendGoalSimulationMock).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, data: mockResponse });
  });
});
