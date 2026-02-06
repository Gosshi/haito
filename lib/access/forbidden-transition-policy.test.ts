import { describe, it, expect } from 'vitest';

import { applyForbiddenTransition } from './forbidden-transition-policy';
import type { SimulationErrorResponse } from '../simulations/types';

describe('applyForbiddenTransition', () => {
  it('FORBIDDEN時にロック遷移を返す', () => {
    const error: SimulationErrorResponse = {
      error: {
        code: 'FORBIDDEN',
        message: 'Access forbidden.',
        details: null,
      },
    };

    expect(
      applyForbiddenTransition({
        feature: 'stress_test',
        error,
      })
    ).toEqual({
      lock: { feature: 'stress_test', reason: 'forbidden' },
      preserveView: true,
    });
  });

  it('FORBIDDEN以外はロック遷移しない', () => {
    const error: SimulationErrorResponse = {
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid input',
        details: null,
      },
    };

    expect(
      applyForbiddenTransition({
        feature: 'stress_test',
        error,
      })
    ).toEqual({
      lock: null,
      preserveView: true,
    });
  });
});
