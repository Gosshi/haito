import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';

const tableWrapperStyles = 'w-full overflow-auto';
const tableStyles = 'w-full caption-bottom text-sm';
const headerStyles = '[&_tr]:border-b';
const bodyStyles = '[&_tr:last-child]:border-0';
const footerStyles = 'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0';
const rowStyles = 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted';
const headStyles =
  'h-12 px-4 text-left align-middle font-medium text-muted-foreground';
const cellStyles = 'p-4 align-middle';
const captionStyles = 'mt-4 text-sm text-muted-foreground';

export type TableProps = TableHTMLAttributes<HTMLTableElement>;
export type TableSectionProps = HTMLAttributes<HTMLTableSectionElement>;
export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;
export type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>;
export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;
export type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className={tableWrapperStyles}>
      <table
        ref={ref}
        className={[tableStyles, className].filter(Boolean).join(' ')}
        {...props}
      />
    </div>
  )
);

Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, TableSectionProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={[headerStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, TableSectionProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={[bodyStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

TableBody.displayName = 'TableBody';

const TableFooter = forwardRef<HTMLTableSectionElement, TableSectionProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={[footerStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

TableFooter.displayName = 'TableFooter';

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={[rowStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

TableRow.displayName = 'TableRow';

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={[headStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={[cellStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

TableCell.displayName = 'TableCell';

const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={[captionStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
