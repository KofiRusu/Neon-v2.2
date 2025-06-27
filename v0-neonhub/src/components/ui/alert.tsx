import React from 'react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  const variants = {
    default: 'glass border-border-glass text-primary',
    destructive: 'bg-neon-pink border-neon-pink text-white',
    success: 'bg-neon-green border-neon-green text-black',
    warning: 'bg-neon-orange border-neon-orange text-white',
    info: 'bg-neon-blue border-neon-blue text-white',
  };

  return (
    <div
      className={cn('relative w-full rounded-xl border p-4', variants[variant], className)}
      {...props}
    />
  );
}

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <h5 className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
  );
}

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return <div className={cn('text-sm opacity-90', className)} {...props} />;
}
