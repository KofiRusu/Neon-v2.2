"use client";

import React, { useState } from "react";

export interface TooltipProps {
  children: React.ReactNode;
}

export const TooltipProvider = ({ children }: TooltipProps) => {
  return <div>{children}</div>;
};

export interface TooltipRootProps {
  children: React.ReactNode;
}

export const Tooltip = ({ children }: TooltipRootProps) => {
  return <div className="relative">{children}</div>;
};

export interface TooltipTriggerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

export const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  TooltipTriggerProps
>(({ children, className, asChild, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      className: `${children.props.className || ""} ${className || ""}`,
      ref,
    });
  }

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
});

TooltipTrigger.displayName = "TooltipTrigger";

export interface TooltipContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipContentProps
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`
          absolute z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 
          text-xs text-gray-50 shadow-md border border-gray-700
          invisible opacity-0 hover:visible hover:opacity-100 transition-all
          ${className || ""}
        `}
      {...props}
    >
      {children}
    </div>
  );
});

TooltipContent.displayName = "TooltipContent";
