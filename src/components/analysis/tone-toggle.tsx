"use client";

import { Brain, Flame, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportTone } from "@/types";

export const TONES: { value: ReportTone; label: string; icon: React.ReactNode; active: string }[] = [
  { value: "mentor", label: "Mentor", icon: <Brain size={13} />, active: "bg-accent-subtle text-accent" },
  { value: "roast", label: "Roast", icon: <Flame size={13} />, active: "bg-error-subtle text-error" },
  { value: "hype", label: "Hype", icon: <Rocket size={13} />, active: "bg-[rgba(168,85,247,0.14)] text-[#C084FC]" },
];

export function ToneToggle({
  value,
  onChange,
  disabled,
  className,
}: {
  value: ReportTone;
  onChange: (tone: ReportTone) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Report tone"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[var(--radius-sm)] border border-border bg-surface-secondary p-0.5",
        className
      )}
    >
      {TONES.map((t) => (
        <button
          key={t.value}
          type="button"
          role="radio"
          aria-checked={value === t.value}
          disabled={disabled}
          onClick={() => onChange(t.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 h-7 text-xs font-medium transition-colors disabled:opacity-50",
            value === t.value ? t.active : "text-text-muted hover:text-text-primary"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
