import type {
  DividendGoalRequest,
  DividendGoalResult,
  DividendGoalSeriesPoint,
  DividendGoalSnapshot,
} from '../simulations/types';

export type RoadmapHistorySummary = {
  snapshot: DividendGoalSnapshot | null;
  result: DividendGoalResult | null;
};

export type RoadmapHistoryListItem = {
  id: string;
  created_at: string;
  input: DividendGoalRequest;
  summary: RoadmapHistorySummary;
};

export type RoadmapHistoryDetail = RoadmapHistoryListItem & {
  series: DividendGoalSeriesPoint[];
};

export type RoadmapHistoryCreateRequest = {
  input: DividendGoalRequest;
  summary: RoadmapHistorySummary;
  series: DividendGoalSeriesPoint[];
};

export type RoadmapHistoryErrorType =
  | 'validation'
  | 'unauthorized'
  | 'not_found'
  | 'unknown';

export type RoadmapHistoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { type: RoadmapHistoryErrorType; message: string } };
