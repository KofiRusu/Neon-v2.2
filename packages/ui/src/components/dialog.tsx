import React from 'react';
import { cn } from '../lib/utils';

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ children, ...props }: DialogProps) {
  return <div {...props}>{children}</div>;
}

export interface DialogTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {}

export function DialogTrigger({ className, ...props }: DialogTriggerProps) {
  return <button className={cn('btn-neon', className)} {...props} />;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <div className="modal-overlay">
      <div className={cn('modal-content', className)} {...props}>
        {children}
      </div>
    </div>
  );
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-6', className)}
      {...props}
    />
  );
}

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h2 className={cn('text-2xl font-bold text-primary', className)} {...props} />;
}

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <p className={cn('text-sm text-secondary', className)} {...props} />;
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6',
        className
      )}
      {...props}
    />
  );
}
