import type { HTMLAttributes, ReactNode, MouseEvent } from 'react';

export type DialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
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

export type DialogContentProps = HTMLAttributes<HTMLDivElement>;

const DialogContent = ({ className, ...props }: DialogContentProps) => (
  <div
    role="dialog"
    aria-modal="true"
    className={[
      'w-full max-w-lg rounded-lg bg-background p-6 text-foreground shadow-lg',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
);

const DialogHeader = ({ className, ...props }: DialogContentProps) => (
  <div className={['space-y-1.5', className].filter(Boolean).join(' ')} {...props} />
);

const DialogTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={['text-lg font-semibold leading-none', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
);

const DialogDescription = ({
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

const DialogFooter = ({ className, ...props }: DialogContentProps) => (
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
