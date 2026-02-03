import type {
  DividendGoalRequest,
  DividendGoalResponse,
  SimulationResult,
} from './types';
import { runDividendGoalSimulation } from '../api/simulations';
import { runDividendGoalSimulationMock } from './mock';

const isMockEnabled = (): boolean => {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ROADMAP_SIMULATION_MOCK === 'true'
  );
};

export const runRoadmapSimulation = async (
  input: DividendGoalRequest
): Promise<SimulationResult<DividendGoalResponse>> => {
  if (isMockEnabled()) {
    return runDividendGoalSimulationMock(input);
  }

  return runDividendGoalSimulation(input);
};
