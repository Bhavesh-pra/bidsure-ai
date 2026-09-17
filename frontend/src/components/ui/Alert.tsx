import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "border-slate-200 bg-slate-50 text-slate-900",
        info: "border-blue-200 bg-blue-50 text-blue-900 [&>svg]:text-blue-600",
        success: "border-emerald-200 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-600",
        warning: "border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600",
        destructive: "border-rose-200 bg-rose-50 text-rose-900 [&>svg]:text-rose-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const ICONS = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Whether to show the leading icon */
  showIcon?: boolean;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", showIcon = true, children, ...props }, ref) => {
    const Icon = ICONS[variant ?? "default"];
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && <Icon className="h-4 w-4" aria-hidden />}
        {children}
      </div>
    );
  }
);
Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm leading-relaxed", className)} {...props} />
  )
);
AlertDescription.displayName = "AlertDescription";
