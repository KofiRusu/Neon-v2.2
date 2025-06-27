import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'neon' | 'neon-purple' | 'neon-pink' | 'neon-green' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    default: 'btn-neon',
    neon: 'btn-neon',
    'neon-purple': 'btn-neon-purple',
    'neon-pink': 'btn-neon-pink',
    'neon-green': 'btn-neon-green',
    ghost: 'glass hover:bg-glass-strong text-secondary hover:text-primary',
    outline:
      'glass border-2 border-border-glass text-secondary hover:text-primary hover:border-neon-blue',
  };

  const sizes = {
    default: 'h-10 px-6 py-2',
    sm: 'h-8 px-4 text-sm',
    lg: 'h-12 px-8 text-lg',
    icon: 'h-10 w-10',
  };

  return (
    <button className={cn(baseClasses, variants[variant], sizes[size], className)} {...props} />
  );
}
