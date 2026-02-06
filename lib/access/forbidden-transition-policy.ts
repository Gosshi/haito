import type { SimulationErrorResponse } from '../simulations/types';
import type { FeatureKey } from './feature-catalog';

export type ForbiddenTransitionContext = {
  feature: FeatureKey;
  error: SimulationErrorResponse;
};

export type ForbiddenTransitionResult = {
  lock: { feature: FeatureKey; reason: 'forbidden' } | null;
  preserveView: true;
};

export const applyForbiddenTransition = ({
  feature,
  error,
}: ForbiddenTransitionContext): ForbiddenTransitionResult => {
  if (error.error.code === 'FORBIDDEN') {
    return {
      lock: {
        feature,
        reason: 'forbidden',
      },
      preserveView: true,
    };
  }

  return {
    lock: null,
    preserveView: true,
  };
};
