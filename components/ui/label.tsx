import type { LabelHTMLAttributes } from 'react';
import { forwardRef } from 'react';

const baseStyles =
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={[baseStyles, className].filter(Boolean).join(' ')}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

export { Label };
