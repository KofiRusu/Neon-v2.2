import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'neon-blue'
    | 'neon-purple'
    | 'neon-pink'
    | 'neon-green'
    | 'secondary'
    | 'destructive'
    | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-neon-blue text-white',
    'neon-blue': 'bg-neon-blue text-white',
    'neon-purple': 'bg-neon-purple text-white',
    'neon-pink': 'bg-neon-pink text-white',
    'neon-green': 'bg-neon-green text-black',
    secondary: 'glass text-secondary',
    destructive: 'bg-neon-pink text-white',
    outline: 'glass border border-border-glass text-secondary',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
