"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-states";
import { ToneToggle } from "./tone-toggle";
import { ScoreBars, ScoreRing } from "./score-display";
import { DownloadPngButton } from "./download-png-button";
import {
  generateAnalysis,
  getAnalysis,
  shareAnalysis,
  unshareAnalysis,
} from "@/api/analysis";
import {
  Check,
  Copy,
  ExternalLink,
  Link2Off,
  RefreshCw,
  Share2,
  Sparkles,
  ThumbsUp,
  Target,
} from "lucide-react";
import type { Report, ReportTone, ShareResponse } from "@/types";

const LOADING_LINES: Record<ReportTone, string[]> = {
  mentor: ["Fetching commits and PRs…", "Computing your scores…", "Writing your growth report…"],
  roast: ["Fetching commits and PRs…", "Computing your scores…", "Sharpening the jokes…"],
  hype: ["Fetching commits and PRs…", "Computing your scores…", "Warming up the hype-man…"],
};

// Mounted only while generating, so each run starts from the first line.
function LoadingLine({ lines, ms = 1800 }: { lines: string[]; ms?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), ms);
    return () => clearInterval(id);
  }, [lines, ms]);
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={i}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="text-sm text-text-secondary"
      >
        {lines[i]}
      </motion.p>
    </AnimatePresence>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function SharePanel({
  share,
  filename,
  onUnshare,
}: {
  share: ShareResponse;
  filename: string;
  onUnshare: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-5 rounded-[var(--radius-md)] border border-border bg-surface-secondary/50 p-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={share.imageUrl}
            alt="Shareable FlowLens score card"
            width={480}
            height={230}
            className="w-full max-w-[360px] rounded-[var(--radius-md)]"
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">Your card is public</p>
            <p className="text-xs text-text-muted max-w-xs">
              Anyone with the link can see this report. Download the PNG for slides and socials, or add the badge to your GitHub README.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <DownloadPngButton imageUrl={share.imageUrl} filename={filename} variant="default" />
              <CopyButton text={share.cardUrl} label="Copy link" />
              <CopyButton
                text={`[![FlowLens score](${share.imageUrl})](${share.cardUrl})`}
                label="Copy README badge"
              />
              <Button size="sm" variant="ghost" asChild>
                <a href={share.cardUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                  Open
                </a>
              </Button>
              <Button size="sm" variant="ghost" onClick={onUnshare}>
                <Link2Off size={14} />
                Stop sharing
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AnalysisReport({ owner, repo }: { owner: string; repo: string }) {
  const [tone, setTone] = useState<ReportTone>("mentor");
  const [report, setReport] = useState<Report | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [share, setShare] = useState<ShareResponse | null>(null);
  const [sharing, setSharing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (t: ReportTone) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      setShare(null);
      try {
        const data = await getAnalysis(owner, repo, t);
        if (id !== requestId.current) return;
        setReport(data?.report ?? null);
        setCreatedAt(data?.createdAt ?? null);
      } catch (err) {
        if (id === requestId.current)
          setError(err instanceof Error ? err.message : "Failed to load report");
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

  const generate = async (refresh: boolean) => {
    const id = ++requestId.current;
    setGenerating(true);
    setError(null);
    setShare(null);
    try {
      const data = await generateAnalysis(owner, repo, tone, refresh);
      if (id !== requestId.current) return;
      setReport(data.report);
      setCreatedAt(new Date().toISOString());
    } catch (err) {
      if (id === requestId.current)
        setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      if (id === requestId.current) setGenerating(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      setShare(await shareAnalysis(owner, repo, tone));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share report");
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async () => {
    await unshareAnalysis(owner, repo);
    setShare(null);
  };

  const busy = loading || generating;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              AI Growth Report
            </CardTitle>
            <p className="text-[11px] text-text-muted mt-1">
              Scores are computed from your GitHub data — the tone only changes the commentary.
            </p>
          </div>
          <ToneToggle value={tone} onChange={setTone} disabled={generating} />
        </div>
      </CardHeader>

      <CardContent>
        {generating ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <LoadingLine lines={LOADING_LINES[tone]} />
          </div>
        ) : loading ? (
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6" />
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorState title="Something went wrong" description={error} onRetry={() => load(tone)} />
        ) : !report ? (
          <EmptyState
            icon={<Sparkles size={20} />}
            title={
              tone === "roast"
                ? "Ready to get roasted?"
                : tone === "hype"
                  ? "Ready for your hype-up?"
                  : "No report yet"
            }
            description="FlowLens scores your last six weeks of activity and explains what to improve next."
            action={{ label: "Generate report", onClick: () => generate(false) }}
          />
        ) : (
          <motion.div
            key={`${tone}-${createdAt}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col md:flex-row gap-8 md:items-start">
              <div className="flex flex-col items-center gap-2 md:w-40">
                <ScoreRing value={report.scores.overall} label="overall" />
              </div>
              <ScoreBars scores={report.scores} breakdown={report.breakdown} className="flex-1" />
            </div>

            {(report.headline || report.summary) && (
              <blockquote className="mt-6 border-l-2 border-accent pl-4">
                {report.headline && (
                  <p className="text-base font-medium text-text-primary">{report.headline}</p>
                )}
                <p className="text-sm text-text-secondary mt-1">{report.summary}</p>
              </blockquote>
            )}

            <div className="grid gap-4 md:grid-cols-2 mt-6">
              <div className="rounded-[var(--radius-md)] border border-border p-4">
                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success mb-3">
                  <ThumbsUp size={13} /> Strengths
                </h4>
                <ul className="space-y-2">
                  {report.strengths.map((s) => (
                    <li key={s} className="text-sm text-text-secondary leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border p-4">
                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning mb-3">
                  <Target size={13} /> What to improve
                </h4>
                <ul className="space-y-2">
                  {report.improvements.map((s) => (
                    <li key={s} className="text-sm text-text-secondary leading-relaxed">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
              <span className="text-[11px] text-text-muted">
                {createdAt && `Generated ${new Date(createdAt).toLocaleString()}`}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => generate(true)} disabled={busy}>
                  <RefreshCw size={14} />
                  Regenerate
                </Button>
                <Button size="sm" onClick={share ? handleUnshare : handleShare} disabled={sharing}>
                  {share ? <Link2Off size={14} /> : <Share2 size={14} />}
                  {share ? "Unshare" : sharing ? "Sharing…" : "Share card"}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {share && (
                <SharePanel
                  share={share}
                  filename={`flowlens-${repo}-${tone}.png`}
                  onUnshare={handleUnshare}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
