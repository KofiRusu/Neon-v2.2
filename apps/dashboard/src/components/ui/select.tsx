import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
          text-white focus:outline-none focus:ring-2 focus:ring-cyan-400
          focus:border-transparent transition-colors
          ${className || ''}
        `}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
}

export const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <option
        ref={ref}
        className={`bg-gray-800 text-white ${className || ''}`}
        {...props}
      >
        {children}
      </option>
    );
  }
);

SelectItem.displayName = 'SelectItem';

// Compound component pattern
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectValue = ({ placeholder }: { placeholder?: string }) => <option value="" disabled>{placeholder}</option>;
export const SelectTrigger = Select; 