import type {
  OptionHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';

const selectStyles =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;
export type SelectItemProps = OptionHTMLAttributes<HTMLOptionElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={[selectStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

Select.displayName = 'Select';

const SelectItem = forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, ...props }, ref) => (
    <option ref={ref} className={className} {...props} />
  )
);

SelectItem.displayName = 'SelectItem';

export { Select, SelectItem };
