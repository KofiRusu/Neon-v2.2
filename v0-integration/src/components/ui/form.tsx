import React from 'react';
import { cn } from '../../lib/utils';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

export function Form({ className, ...props }: FormProps) {
  return <form className={cn('space-y-6', className)} {...props} />;
}

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FormItem({ className, ...props }: FormItemProps) {
  return <div className={cn('space-y-2', className)} {...props} />;
}

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function FormLabel({ className, ...props }: FormLabelProps) {
  return <label className={cn('text-sm font-medium text-primary', className)} {...props} />;
}

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FormControl({ className, ...props }: FormControlProps) {
  return <div className={cn('relative', className)} {...props} />;
}

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function FormDescription({ className, ...props }: FormDescriptionProps) {
  return <p className={cn('text-xs text-secondary', className)} {...props} />;
}

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function FormMessage({ className, ...props }: FormMessageProps) {
  return <p className={cn('text-xs text-neon-pink', className)} {...props} />;
}

// Added FormField component for compatibility
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  control?: any;
  name?: string;
  render?: ({ field }: { field: any }) => React.ReactNode;
}

export function FormField({ className, children, ...props }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {children}
    </div>
  );
}
