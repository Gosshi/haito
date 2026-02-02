import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';

const progressStyles =
  'relative h-4 w-full overflow-hidden rounded-full bg-secondary';
const indicatorStyles =
  'h-full w-full flex-1 bg-primary transition-all';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, className, ...props }, ref) => {
    const clampedValue = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className={[progressStyles, className].filter(Boolean).join(' ')}
        {...props}
      >
        <div
          data-slot="progress-indicator"
          className={indicatorStyles}
          style={{ transform: `translateX(-${100 - clampedValue}%)` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';
