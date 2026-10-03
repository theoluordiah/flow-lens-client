"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-states";
import { ToneToggle } from "./tone-toggle";
import { getCodeReview, runCodeReview, setFindingDismissed } from "@/api/review";
import { Check, EyeOff, FileCode2, Lightbulb, RefreshCw, RotateCcw, ScanSearch, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeReview as Review, FindingSeverity, RepoFacts, ReportTone, ReviewFinding } from "@/types";

type Style = { label: string; variant: "error" | "warning" | "secondary" | "default"; bar: string };

// Automatic checks are facts, so they get firm labels.
const CHECK_STYLE: Record<FindingSeverity, Style> = {
  high: { label: "Serious", variant: "error", bar: "bg-error" },
  medium: { label: "Should fix", variant: "warning", bar: "bg-warning" },
  low: { label: "Minor", variant: "secondary", bar: "bg-border-hover" },
};

// AI findings are suggestions, so they are labelled as things to look at, not verdicts.
const AI_STYLE: Record<FindingSeverity, Style> = {
  high: { label: "Likely important", variant: "warning", bar: "bg-warning" },
  medium: { label: "Worth checking", variant: "default", bar: "bg-accent" },
  low: { label: "Small thing", variant: "secondary", bar: "bg-border-hover" },
};

const LOADING_LINES = [
  "Reading the file tree…",
  "Running the automatic checks…",
  "Reading your most important files…",
  "Double-checking every finding against the code…",
];

function LoadingLine() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, LOADING_LINES.length - 1)), 2500);
    return () => clearInterval(id);
  }, []);
  return <p className="text-sm text-text-secondary">{LOADING_LINES[i]}</p>;
}

function FactChips({ facts }: { facts: RepoFacts }) {
  const items: [string, boolean][] = [
    ["README", facts.hasReadme],
    [facts.hasTests ? `${facts.testFileCount} test file${facts.testFileCount === 1 ? "" : "s"}` : "Tests", facts.hasTests],
    ["CI", facts.hasCi],
    [".gitignore", facts.hasGitignore],
    ["License", facts.hasLicense],
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([label, ok]) => (
        <span
          key={label}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px]",
            ok ? "border-success/30 text-success" : "border-border text-text-muted"
          )}
        >
          {ok ? <Check size={11} /> : <X size={11} />}
          {label}
        </span>
      ))}
    </div>
  );
}

function FindingRow({
  finding,
  href,
  onToggle,
}: {
  finding: ReviewFinding;
  href: string | null;
  onToggle: (f: ReviewFinding) => void;
}) {
  const s = (finding.source === "ai" ? AI_STYLE : CHECK_STYLE)[finding.severity];
  const location = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ""}` : null;
  return (
    <li
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface p-4 pl-5",
        finding.dismissed && "opacity-60"
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", finding.dismissed ? "bg-border" : s.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Badge variant={s.variant}>{s.label}</Badge>
          <span className="text-[11px] uppercase tracking-wider text-text-muted">{finding.category}</span>
        </div>
        <button
          type="button"
          onClick={() => onToggle(finding)}
          className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[11px] text-text-muted hover:bg-surface-secondary hover:text-text-primary transition-colors"
        >
          {finding.dismissed ? <RotateCcw size={12} /> : <EyeOff size={12} />}
          {finding.dismissed ? "Restore" : "Not a real issue"}
        </button>
      </div>

      <p className="text-sm font-medium text-text-primary mt-2">{finding.title}</p>

      {location &&
        (href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:underline break-all"
          >
            <FileCode2 size={12} className="shrink-0" />
            {location}
          </a>
        ) : (
          <p className="mt-1 font-mono text-[11px] text-text-muted break-all">{location}</p>
        ))}

      {finding.evidence && (
        <pre className="mt-2 overflow-x-auto rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-[12px] text-text-secondary">
          <span className="select-none text-text-muted">{finding.line} </span>
          {finding.evidence}
        </pre>
      )}

      {!finding.dismissed && (
        <>
          <p className="text-sm text-text-secondary leading-relaxed mt-2">{finding.explanation}</p>
          {finding.fix && (
            <p className="text-sm text-text-secondary leading-relaxed mt-2">
              <span className="text-text-primary font-medium">Suggested fix: </span>
              {finding.fix}
            </p>
          )}
        </>
      )}
    </li>
  );
}

function Section({
  icon,
  title,
  note,
  findings,
  href,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
  findings: ReviewFinding[];
  href: (f: ReviewFinding) => string | null;
  onToggle: (f: ReviewFinding) => void;
}) {
  if (!findings.length) return null;
  return (
    <section className="mt-6">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-primary">
        {icon}
        {title}
        <span className="text-text-muted font-normal normal-case tracking-normal">({findings.length})</span>
      </h4>
      <p className="text-[11px] text-text-muted mt-1">{note}</p>
      <ul className="mt-3 space-y-3">
        {findings.map((f) => (
          <FindingRow key={f.fingerprint} finding={f} href={href(f)} onToggle={onToggle} />
        ))}
      </ul>
    </section>
  );
}

export function CodeReviewPanel({ owner, repo, htmlUrl }: { owner: string; repo: string; htmlUrl?: string }) {
  const [tone, setTone] = useState<ReportTone>("mentor");
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (t: ReportTone) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const data = await getCodeReview(owner, repo, t);
        if (id === requestId.current) setReview(data);
      } catch (err) {
        if (id === requestId.current) setError(err instanceof Error ? err.message : "Failed to load the code review");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [owner, repo]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(tone);
  }, [load, tone]);

  const run = async (refresh: boolean) => {
    const id = ++requestId.current;
    setRunning(true);
    setError(null);
    try {
      const data = await runCodeReview(owner, repo, tone, refresh);
      if (id === requestId.current) setReview(data);
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : "The code review failed");
    } finally {
      if (id === requestId.current) setRunning(false);
    }
  };

  const setDismissed = (fingerprint: string, dismissed: boolean) =>
    setReview((r) =>
      r && { ...r, findings: r.findings.map((f) => (f.fingerprint === fingerprint ? { ...f, dismissed } : f)) }
    );

  // Optimistic, so the finding disappears the moment you click; reverted if saving fails.
  const toggle = async (f: ReviewFinding) => {
    const next = !f.dismissed;
    setDismissed(f.fingerprint, next);
    try {
      await setFindingDismissed(owner, repo, f.fingerprint, next);
    } catch {
      setDismissed(f.fingerprint, !next);
    }
  };

  const href = (f: ReviewFinding) =>
    htmlUrl && review?.sha && f.file
      ? `${htmlUrl}/blob/${review.sha}/${f.file.split("/").map(encodeURIComponent).join("/")}${f.line ? `#L${f.line}` : ""}`
      : null;

  const active = review?.findings.filter((f) => !f.dismissed) ?? [];
  const dismissed = review?.findings.filter((f) => f.dismissed) ?? [];
  const confirmed = active.filter((f) => f.source === "check");
  const suggestions = active.filter((f) => f.source === "ai");

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ScanSearch size={16} className="text-accent" />
              Code review
            </CardTitle>
            <p className="text-[11px] text-text-muted mt-1">
              Automatic checks you can rely on, plus suggestions from reading your most important files.
            </p>
          </div>
          <ToneToggle value={tone} onChange={setTone} disabled={running} />
        </div>
      </CardHeader>

      <CardContent>
        {running ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <LoadingLine />
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Something went wrong" description={error} onRetry={() => load(tone)} />
        ) : !review ? (
          <EmptyState
            icon={<ScanSearch size={20} />}
            title={tone === "roast" ? "Ready to have your code roasted?" : "No code review yet"}
            description="FlowLens checks the repo for common problems, then reads your most important files and points out anything worth a second look, linked to the exact line."
            action={{ label: "Review my code", onClick: () => run(false) }}
          />
        ) : (
          <motion.div key={`${tone}-${review.createdAt}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <blockquote className="border-l-2 border-accent pl-4 md:max-w-2xl">
                <p className="text-sm text-text-primary leading-relaxed">{review.summary}</p>
              </blockquote>
              <div className="flex shrink-0 gap-2">
                {[
                  ["Confirmed", confirmed.length],
                  ["Worth a look", suggestions.length],
                ].map(([label, n]) => (
                  <div key={label} className="min-w-20 rounded-[var(--radius-md)] border border-border px-3 py-2 text-center">
                    <p className="text-lg font-bold text-text-primary tabular-nums leading-none">{n}</p>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <FactChips facts={review.facts} />
            </div>

            <Section
              icon={<ShieldCheck size={13} className="text-success" />}
              title="Confirmed by automatic checks"
              note="Found by fixed rules that look at the files themselves, so these are facts about the repo."
              findings={confirmed}
              href={href}
              onToggle={toggle}
            />
            <Section
              icon={<Lightbulb size={13} className="text-warning" />}
              title="Worth a look"
              note="Suggestions from reading the code. Each one points at a real line, but give it a quick check before acting on it."
              findings={suggestions}
              href={href}
              onToggle={toggle}
            />

            {!active.length && (
              <div className="mt-6 flex items-center gap-3 rounded-[var(--radius-md)] border border-success/30 bg-success-subtle p-4">
                <ShieldCheck size={18} className="text-success shrink-0" />
                <p className="text-sm text-text-secondary">Nothing worth flagging in the files FlowLens read.</p>
              </div>
            )}

            {dismissed.length > 0 && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowDismissed((v) => !v)}
                  className="text-[11px] text-text-muted hover:text-text-primary underline-offset-2 hover:underline"
                >
                  {showDismissed ? "Hide" : "Show"} {dismissed.length} dismissed finding{dismissed.length === 1 ? "" : "s"}
                </button>
                {showDismissed && (
                  <ul className="mt-3 space-y-3">
                    {dismissed.map((f) => (
                      <FindingRow key={f.fingerprint} finding={f} href={href(f)} onToggle={toggle} />
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6 pt-4 border-t border-border">
              <p className="text-[11px] text-text-muted">
                {review.aiReviewed
                  ? `Read in full: ${review.filesReviewed.join(", ")}.`
                  : "Only the automatic checks ran this time, so there are no suggestions."}
                {review.sha && ` Commit ${review.sha.slice(0, 7)} on ${review.branch}.`}
              </p>
              <Button size="sm" variant="secondary" onClick={() => run(true)} className="shrink-0">
                <RefreshCw size={14} />
                Review again
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
