import type {
  DividendGoalRequest,
  DividendGoalResponse,
  DividendGoalScenarioCompareRequest,
  DividendGoalScenarioCompareResponse,
  DividendGoalShockRequest,
  DividendGoalShockResponse,
  SimulationErrorResponse,
  SimulationResult,
} from '../simulations/types';

const SIMULATION_ENDPOINT = '/api/simulations/dividend-goal';
const SCENARIO_COMPARE_ENDPOINT = '/api/simulations/dividend-goal/scenarios';
const SHOCK_ENDPOINT = '/api/simulations/dividend-goal/shock';

const buildFallbackError = (
  status: number,
  statusText?: string
): SimulationErrorResponse => {
  if (status === 401) {
    return {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
        details: null,
      },
    };
  }

  if (status === 403) {
    return {
      error: {
        code: 'FORBIDDEN',
        message: 'Access forbidden.',
        details: null,
      },
    };
  }

  if (status === 400) {
    return {
      error: {
        code: 'BAD_REQUEST',
        message: statusText || 'Bad Request',
        details: null,
      },
    };
  }

  if (status >= 500) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: statusText || 'Internal Server Error',
        details: null,
      },
    };
  }

  return {
    error: {
      code: 'REQUEST_FAILED',
      message: statusText || 'Request failed',
      details: null,
    },
  };
};

const normalizeErrorResponse = (
  status: number,
  statusText: string | undefined,
  errorBody: SimulationErrorResponse | null
): SimulationErrorResponse => {
  if (errorBody?.error?.code && errorBody.error.message) {
    if (status === 401) {
      return {
        error: {
          ...errorBody.error,
          code: 'UNAUTHORIZED',
        },
      };
    }

    if (status === 403) {
      return {
        error: {
          ...errorBody.error,
          code: 'FORBIDDEN',
        },
      };
    }

    return errorBody;
  }

  return buildFallbackError(status, statusText);
};

export const runDividendGoalSimulation = async (
  input: DividendGoalRequest
): Promise<SimulationResult<DividendGoalResponse>> => {
  try {
    const response = await fetch(SIMULATION_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (response.ok) {
      const data = (await response.json()) as DividendGoalResponse;
      return { ok: true, data };
    }

    let errorBody: SimulationErrorResponse | null = null;
    try {
      errorBody = (await response.json()) as SimulationErrorResponse;
    } catch {
      errorBody = null;
    }

    return {
      ok: false,
      error: normalizeErrorResponse(
        response.status,
        response.statusText,
        errorBody
      ),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return {
      ok: false,
      error: {
        error: {
          code: 'NETWORK_ERROR',
          message,
          details: null,
        },
      },
    };
  }
};

export const runDividendGoalScenarioCompare = async (
  input: DividendGoalScenarioCompareRequest
): Promise<SimulationResult<DividendGoalScenarioCompareResponse>> => {
  try {
    const response = await fetch(SCENARIO_COMPARE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (response.ok) {
      const data =
        (await response.json()) as DividendGoalScenarioCompareResponse;
      return { ok: true, data };
    }

    let errorBody: SimulationErrorResponse | null = null;
    try {
      errorBody = (await response.json()) as SimulationErrorResponse;
    } catch {
      errorBody = null;
    }

    return {
      ok: false,
      error: normalizeErrorResponse(
        response.status,
        response.statusText,
        errorBody
      ),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return {
      ok: false,
      error: {
        error: {
          code: 'NETWORK_ERROR',
          message,
          details: null,
        },
      },
    };
  }
};

export const runDividendGoalShock = async (
  input: DividendGoalShockRequest
): Promise<SimulationResult<DividendGoalShockResponse>> => {
  try {
    const response = await fetch(SHOCK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (response.ok) {
      const data = (await response.json()) as DividendGoalShockResponse;
      return { ok: true, data };
    }

    let errorBody: SimulationErrorResponse | null = null;
    try {
      errorBody = (await response.json()) as SimulationErrorResponse;
    } catch {
      errorBody = null;
    }

    return {
      ok: false,
      error: normalizeErrorResponse(
        response.status,
        response.statusText,
        errorBody
      ),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return {
      ok: false,
      error: {
        error: {
          code: 'NETWORK_ERROR',
          message,
          details: null,
        },
      },
    };
  }
};
