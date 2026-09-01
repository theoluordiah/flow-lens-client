import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "error" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-accent-subtle text-accent border-transparent",
    secondary: "bg-surface-secondary text-text-secondary border-transparent",
    success: "bg-success-subtle text-success border-transparent",
    warning: "bg-warning-subtle text-warning border-transparent",
    error: "bg-error-subtle text-error border-transparent",
    outline: "text-text-secondary border-border",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
