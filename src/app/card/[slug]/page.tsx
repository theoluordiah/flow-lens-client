"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreBars, ScoreRing } from "@/components/analysis/score-display";
import { TONES } from "@/components/analysis/tone-toggle";
import { DownloadPngButton } from "@/components/analysis/download-png-button";
import { API_BASE } from "@/api/client";
import { getPublicCard } from "@/api/analysis";
import { ArrowRight, ThumbsUp, Target } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import type { PublicCard } from "@/types";

export default function PublicCardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [card, setCard] = useState<PublicCard | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    getPublicCard(slug)
      .then((c) => {
        setCard(c);
        setStatus(c ? "ready" : "missing");
      })
      .catch(() => setStatus("error"));
  }, [slug]);

  const tone = TONES.find((t) => t.value === card?.tone) ?? TONES[0];

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="text-sm font-bold tracking-tight uppercase text-text-primary">
          FlowLens
        </Link>

        {status === "loading" && (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64" />
          </div>
        )}

        {(status === "missing" || status === "error") && (
          <div className="mt-16 text-center space-y-3">
            <h1 className="text-lg font-semibold text-text-primary">
              {status === "missing" ? "This card isn't available" : "Couldn't load this card"}
            </h1>
            <p className="text-sm text-text-muted">
              {status === "missing"
                ? "It may have been unshared by its owner."
                : "Please try again in a moment."}
            </p>
          </div>
        )}

        {status === "ready" && card && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {card.user?.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.user.avatarUrl} alt="" className="h-11 w-11 rounded-full" />
                )}
                <div className="min-w-0">
                  <p className="text-base font-semibold text-text-primary truncate">
                    {card.user ? `@${card.user.username}` : "FlowLens developer"}
                  </p>
                  <p className="text-xs text-text-muted truncate">{card.repoFullName}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone.active}`}>
                {tone.icon}
                {tone.label}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 mt-8">
              <ScoreRing value={card.scores.overall} size={148} label="overall" />
              <ScoreBars scores={card.scores} breakdown={card.breakdown} className="flex-1" />
            </div>

            {card.headline && (
              <p className="mt-8 text-lg font-medium text-text-primary leading-snug">
                “{card.headline}”
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 mt-6">
              <div>
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success mb-2">
                  <ThumbsUp size={13} /> Strengths
                </h2>
                <ul className="space-y-1.5">
                  {card.strengths.map((s) => (
                    <li key={s} className="text-sm text-text-secondary">{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning mb-2">
                  <Target size={13} /> Next level
                </h2>
                <ul className="space-y-1.5">
                  {card.improvements.map((s) => (
                    <li key={s} className="text-sm text-text-secondary">{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-2">
                {card.topLanguage && <Badge variant="secondary">{card.topLanguage}</Badge>}
                <span className="text-[11px] text-text-muted">
                  {new Date(card.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <DownloadPngButton
                  imageUrl={`${API_BASE}/api/card/${slug}/image.svg`}
                  filename={`flowlens-${card.repoFullName.split("/").pop()}-${card.tone}.png`}
                />
                <Button asChild size="sm">
                  <Link href="/login">
                    <GithubIcon className="h-4 w-4" />
                    Get your own score
                    <ArrowRight size={14} />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
