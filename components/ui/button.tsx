"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-sm transition hover:bg-primary-700 focus-visible:outline-primary-500",
  secondary:
    "bg-primary-50 text-primary-700 shadow-sm transition hover:bg-primary-100 focus-visible:outline-primary-200",
  outline:
    "border border-primary-200 text-primary-700 hover:bg-primary-50 focus-visible:outline-primary-400",
  ghost: "text-primary-700 hover:bg-primary-50 focus-visible:outline-primary-200",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
