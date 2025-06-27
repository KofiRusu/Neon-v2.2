import React from 'react';
import { cn } from '../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export function Progress({ className, value = 0, max = 100, ...props }: ProgressProps) {
  const percentage = (Math.min(Math.max(value, 0), max) / max) * 100;

  return (
    <div className={cn('progress-neon', className)} {...props}>
      <div className="progress-fill" style={{ width: `${percentage}%` }} />
    </div>
  );
}
