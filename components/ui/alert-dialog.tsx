import type { HTMLAttributes, ReactNode, MouseEvent } from 'react';

export type AlertDialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => {
  if (!open) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onOpenChange?.(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      {children}
    </div>
  );
};

export type AlertDialogContentProps = HTMLAttributes<HTMLDivElement>;

const AlertDialogContent = ({
  className,
  ...props
}: AlertDialogContentProps) => (
  <div
    role="alertdialog"
    aria-modal="true"
    className={[
      'w-full max-w-md rounded-lg bg-background p-6 text-foreground shadow-lg',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
);

const AlertDialogHeader = ({
  className,
  ...props
}: AlertDialogContentProps) => (
  <div className={['space-y-1.5', className].filter(Boolean).join(' ')} {...props} />
);

const AlertDialogTitle = ({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={['text-lg font-semibold leading-none', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
);

const AlertDialogDescription = ({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={['text-sm text-muted-foreground', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
);

const AlertDialogFooter = ({
  className,
  ...props
}: AlertDialogContentProps) => (
  <div
    className={[
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
);

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
};
