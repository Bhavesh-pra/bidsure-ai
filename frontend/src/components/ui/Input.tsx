import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Accessible label (use htmlFor on a <Label> instead, but this can be used for aria-label) */
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm text-slate-900",
          "placeholder:text-slate-400",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-rose-400 focus-visible:ring-rose-400"
            : "border-slate-300 focus-visible:ring-blue-500",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
