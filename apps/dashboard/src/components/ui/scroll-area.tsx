import React from "react";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-hidden ${className || ""}`}
        {...props}
      >
        <div className="h-full w-full overflow-auto">{children}</div>
      </div>
    );
  },
);

ScrollArea.displayName = "ScrollArea";

export interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`absolute right-0 top-0 h-full w-2 bg-gray-700 rounded ${className || ""}`}
        {...props}
      />
    );
  },
);

ScrollBar.displayName = "ScrollBar";
