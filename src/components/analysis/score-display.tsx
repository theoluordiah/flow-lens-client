"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReportScores, ScoreKey } from "@/types";

export const SCORE_LABELS: Record<ScoreKey, string> = {
  consistency: "Consistency",
  codeQuality: "Code quality",
  collaboration: "Collaboration",
  projectActivity: "Project activity",
};

export const scoreTone = (n: number) =>
  n >= 75
    ? { text: "text-success", bg: "bg-success", stroke: "var(--color-success)" }
    : n >= 50
      ? { text: "text-warning", bg: "bg-warning", stroke: "var(--color-warning)" }
      : { text: "text-error", bg: "bg-error", stroke: "var(--color-error)" };

export function ScoreRing({ value, size = 128, label }: { value: number; size?: number; label?: string }) {
  const stroke = size * 0.08;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const tone = scoreTone(value);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-secondary)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - value / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold tabular-nums text-text-primary" style={{ fontSize: size * 0.28 }}>
          {value}
        </span>
        {label && <span className="text-[11px] text-text-muted -mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

export function ScoreBars({
  scores,
  breakdown,
  className,
}: {
  scores: ReportScores;
  breakdown?: Partial<Record<ScoreKey, string>>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3.5 w-full", className)}>
      {(Object.keys(SCORE_LABELS) as ScoreKey[]).map((key, i) => {
        const value = scores[key];
        const tone = scoreTone(value);
        return (
          <div key={key}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs font-medium text-text-secondary">{SCORE_LABELS[key]}</span>
              <span className={cn("text-sm font-semibold tabular-nums", tone.text)}>{value}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
              <motion.div
                className={cn("h-full rounded-full", tone.bg)}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.8, delay: 0.1 * i, ease: "easeOut" }}
              />
            </div>
            {breakdown?.[key] && (
              <p className="text-[11px] text-text-muted mt-1">{breakdown[key]}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
