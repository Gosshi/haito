import type { DividendGoalRequest, DividendGoalResponse } from '../simulations/types';
import type { RoadmapHistoryCreateRequest } from './types';

export const buildRoadmapHistoryCreateRequest = (
  input: DividendGoalRequest | null,
  response: DividendGoalResponse | null
): RoadmapHistoryCreateRequest | null => {
  if (!input || !response) {
    return null;
  }

  return {
    input,
    summary: {
      snapshot: response.snapshot ?? null,
      result: response.result ?? null,
    },
    series: Array.isArray(response.series) ? response.series : [],
  };
};
