import React from 'react';
import { cn } from '../../lib/utils';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ className, ...props }: TabsProps) {
  return <div className={cn('w-full', className)} {...props} />;
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      className={cn('glass inline-flex h-10 items-center justify-center rounded-xl p-1', className)}
      {...props}
    />
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-transparent transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:glass-strong data-[state=active]:text-neon-blue data-[state=active]:shadow-sm text-secondary hover:text-primary',
        className
      )}
      {...props}
    />
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <div
      className={cn(
        'mt-2 ring-offset-transparent focus-visible:outline-none focus-visible:ring-2',
        className
      )}
      {...props}
    />
  );
}
