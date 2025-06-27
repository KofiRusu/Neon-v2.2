import React from 'react';
import { cn } from '../lib/utils';

export interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function Slider({
  className,
  value = [50],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  ...props
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = [Number((e.target as HTMLInputElement).value)];
    onValueChange?.(newValue);
  };

  return (
    <div className={cn('relative flex items-center w-full', className)} {...props}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        disabled={disabled}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-secondary slider-neon"
        style={{
          background: `linear-gradient(to right, var(--neon-blue) 0%, var(--neon-blue) ${((value[0] - min) / (max - min)) * 100}%, var(--bg-secondary) ${((value[0] - min) / (max - min)) * 100}%, var(--bg-secondary) 100%)`,
        }}
      />
    </div>
  );
}
