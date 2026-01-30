import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';

const cardStyles = 'rounded-lg border bg-card text-card-foreground shadow-sm';
const cardHeaderStyles = 'flex flex-col space-y-1.5 p-6';
const cardTitleStyles = 'text-2xl font-semibold leading-none tracking-tight';
const cardDescriptionStyles = 'text-sm text-muted-foreground';
const cardContentStyles = 'p-6 pt-0';
const cardFooterStyles = 'flex items-center p-6 pt-0';

export type CardProps = HTMLAttributes<HTMLDivElement>;
export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;
export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={[cardStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={[cardHeaderStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={[cardTitleStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={[cardDescriptionStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={[cardContentStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={[cardFooterStyles, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
