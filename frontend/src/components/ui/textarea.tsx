import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900",
          "placeholder:text-slate-400",
          "transition-colors resize-y",
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
Textarea.displayName = "Textarea";
