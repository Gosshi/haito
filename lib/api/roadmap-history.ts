import type {
  RoadmapHistoryCreateRequest,
  RoadmapHistoryDetail,
  RoadmapHistoryErrorType,
  RoadmapHistoryListItem,
  RoadmapHistoryResult,
} from '../roadmap-history/types';

const HISTORY_ENDPOINT = '/api/roadmap/history';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const isErrorResult = (
  value: unknown
): value is { ok: false; error: { type: RoadmapHistoryErrorType; message: string } } => {
  if (!isRecord(value) || value.ok !== false || !isRecord(value.error)) {
    return false;
  }

  return typeof value.error.type === 'string' && typeof value.error.message === 'string';
};

const isSuccessResult = <T>(
  value: unknown
): value is { ok: true; data: T } => {
  return isRecord(value) && value.ok === true && 'data' in value;
};

const resolveErrorType = (
  status: number,
  fallback?: RoadmapHistoryErrorType
): RoadmapHistoryErrorType => {
  if (status === 400) {
    return 'validation';
  }
  if (status === 401) {
    return 'unauthorized';
  }
  if (status === 404) {
    return 'not_found';
  }
  return fallback ?? 'unknown';
};

const normalizeError = (
  status: number,
  statusText: string | undefined,
  body: unknown
): RoadmapHistoryResult<never> => {
  if (isErrorResult(body)) {
    return {
      ok: false,
      error: {
        type: resolveErrorType(status, body.error.type),
        message: body.error.message,
      },
    };
  }

  return {
    ok: false,
    error: {
      type: resolveErrorType(status),
      message: statusText || 'Request failed',
    },
  };
};

const request = async <T>(
  url: string,
  options: RequestInit
): Promise<RoadmapHistoryResult<T>> => {
  try {
    const response = await fetch(url, options);
    let body: unknown = null;

    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (response.ok) {
      if (isSuccessResult<T>(body)) {
        return { ok: true, data: body.data };
      }

      if (isErrorResult(body)) {
        return { ok: false, error: body.error };
      }

      return {
        ok: false,
        error: { type: 'unknown', message: 'Invalid response' },
      };
    }

    return normalizeError(response.status, response.statusText, body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { ok: false, error: { type: 'unknown', message } };
  }
};

export const fetchRoadmapHistoryList = async (
  limit?: number
): Promise<RoadmapHistoryResult<RoadmapHistoryListItem[]>> => {
  const url =
    typeof limit === 'number'
      ? `${HISTORY_ENDPOINT}?${new URLSearchParams({
          limit: String(limit),
        }).toString()}`
      : HISTORY_ENDPOINT;

  return request<RoadmapHistoryListItem[]>(url, { method: 'GET' });
};

export const fetchRoadmapHistoryDetail = async (
  id: string
): Promise<RoadmapHistoryResult<RoadmapHistoryDetail>> => {
  return request<RoadmapHistoryDetail>(`${HISTORY_ENDPOINT}/${id}`, {
    method: 'GET',
  });
};

export const createRoadmapHistory = async (
  payload: RoadmapHistoryCreateRequest
): Promise<RoadmapHistoryResult<RoadmapHistoryDetail>> => {
  return request<RoadmapHistoryDetail>(HISTORY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};
