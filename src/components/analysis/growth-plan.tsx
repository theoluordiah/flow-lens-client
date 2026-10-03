"use client";

import { ArrowRight, Compass } from "lucide-react";
import { SCORE_LABELS } from "./score-display";
import type { GrowthPlan } from "@/types";

export function GrowthPlanPanel({ plan, focus }: { plan?: GrowthPlan; focus?: string }) {
  if (!focus && !plan?.steps.length) return null;
  const steps = plan?.steps ?? [];

  return (
    <div className="mt-6 rounded-[var(--radius-md)] border border-accent/30 bg-accent-subtle/40 p-4 sm:p-5">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
        <Compass size={13} /> Where to focus next
      </h4>

      {plan && (
        <p className="text-[11px] text-text-muted mt-1">
          Weakest area: {SCORE_LABELS[plan.weakest.key]} at {plan.weakest.score}/100
        </p>
      )}

      {focus && <p className="text-sm text-text-primary leading-relaxed mt-3">{focus}</p>}

      {steps.length > 0 && (
        <ol className="mt-4 space-y-3">
          {steps.map((step, i) => (
            <li
              key={step.id}
              className="flex gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 sm:p-4"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm font-medium text-text-primary">{step.action}</p>
                  <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full bg-success-subtle px-2.5 py-0.5 text-[11px] font-semibold text-success tabular-nums">
                    {step.overallFrom}
                    <ArrowRight size={11} />
                    {step.overallTo} overall
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mt-1.5">{step.detail}</p>
                {step.changes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {step.changes.map((c) => (
                      <span
                        key={c.key}
                        className="rounded border border-border px-2 py-0.5 text-[10px] text-text-muted tabular-nums"
                      >
                        {SCORE_LABELS[c.key]} {c.from} to {c.to}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {plan && steps.length > 1 && (
        <p className="text-xs text-text-muted mt-3">
          Doing all {steps.length} over the next six weeks takes your overall score from{" "}
          <span className="font-semibold text-text-primary">{steps[0].overallFrom}</span> to{" "}
          <span className="font-semibold text-success">{plan.combinedOverall}</span>. These numbers come
          from the same formula as your scores, so they are measured, not guessed.
        </p>
      )}
    </div>
  );
}
