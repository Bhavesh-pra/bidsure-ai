import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { icon: "h-5 w-5", text: "text-xs" },
  md: { icon: "h-7 w-7", text: "text-sm" },
  lg: { icon: "h-10 w-10", text: "text-base" },
} as const;

/**
 * Reusable loading state for any resource section.
 * Accessible: provides role="status" and a live region.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading…",
  className,
  size = "md",
}) => {
  const s = sizeMap[size];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-slate-500",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <Loader2 className={cn(s.icon, "animate-spin text-blue-500")} aria-hidden />
      <p className={cn(s.text, "font-medium")}>{message}</p>
    </div>
  );
};
