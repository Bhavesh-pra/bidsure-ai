import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Value between 0–100 */
  value?: number;
  /** Visual variant */
  variant?: "default" | "success" | "warning" | "destructive";
}

const variantClasses: Record<NonNullable<ProgressProps["variant"]>, string> = {
  default: "bg-blue-600",
  success: "bg-emerald-600",
  warning: "bg-amber-500",
  destructive: "bg-rose-600",
};

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, variant = "default", ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}
        {...props}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", variantClasses[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";
