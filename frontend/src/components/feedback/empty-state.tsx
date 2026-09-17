import React from "react";
import { InboxIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty state for when a resource list or section has no items.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Nothing here yet",
  message = "There are no items to display.",
  action,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
        {icon ?? <InboxIcon className="h-6 w-6" aria-hidden />}
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
