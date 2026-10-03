"use client";

import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { THEMES } from "@/lib/profile/themes";
import { calendarRange } from "@/lib/profile/svg";
import { PROFILE_THEMES, type ProfileConfig, type ProfileSections } from "@/lib/profile/types";
import type { CalendarState } from "@/hooks/use-profile-builder";
import { Toggle } from "./fields";

type Update = (recipe: (p: ProfileConfig) => ProfileConfig) => void;

const SECTION_LABELS: Record<keyof ProfileSections, string> = {
  card: "Terminal card",
  contributions: "Contribution heatmap",
  about: "About me",
  projects: "Featured projects",
  skills: "Languages & tools",
  links: "Links",
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function StylePanel({ profile, update }: { profile: ProfileConfig; update: Update }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Theme</CardTitle>
        <CardDescription className="text-xs">Applies to every exported SVG.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Theme">
          {PROFILE_THEMES.map((id) => {
            const t = THEMES[id];
            const active = profile.theme === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update((p) => ({ ...p, theme: id }))}
                className={cn(
                  "rounded-[var(--radius-md)] border p-3 text-left transition-colors",
                  active ? "border-accent bg-accent-subtle" : "border-border hover:border-border-hover"
                )}
              >
                <div className="mb-2 flex h-8 items-center gap-1 rounded px-2" style={{ background: t.background, border: `1px solid ${t.border}` }}>
                  <span className="font-mono text-[10px] font-bold" style={{ color: t.key }}>
                    $
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: t.text }}>
                    whoami
                  </span>
                  <span className="ml-auto flex gap-0.5">
                    {t.heat.slice(1).map((c) => (
                      <span key={c} className="h-2 w-2 rounded-[1px]" style={{ background: c }} />
                    ))}
                  </span>
                </div>
                <span className="text-xs font-medium text-text-primary">{t.label}</span>
              </button>
            );
          })}
        </div>
        <Toggle
          checked={profile.animations}
          onChange={(animations) => update((p) => ({ ...p, animations }))}
          label="Entrance animations"
          description="Pure CSS inside the SVG. Viewers who prefer reduced motion, and clients that don't animate, see the finished frame."
        />
        <Toggle
          checked={profile.terminalHeadings}
          onChange={(terminalHeadings) => update((p) => ({ ...p, terminalHeadings }))}
          label="Terminal-style headings"
          description="Section titles become shell prompts, e.g. you@github ~ $ ./links.sh"
        />
      </CardContent>
    </Card>
  );
}

export function SectionsPanel({
  profile,
  update,
  calendar,
  onRetry,
}: {
  profile: ProfileConfig;
  update: Update;
  calendar: CalendarState;
  onRetry: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">README sections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(SECTION_LABELS) as (keyof ProfileSections)[]).map((key) => (
            <Toggle
              key={key}
              checked={profile.sections[key]}
              onChange={(v) => update((p) => ({ ...p, sections: { ...p.sections, [key]: v } }))}
              label={SECTION_LABELS[key]}
            />
          ))}
        </div>

        <div className="rounded-[var(--radius-md)] border border-border p-3 text-xs">
          <p className="mb-2 font-medium text-text-primary">Contribution data</p>
          {calendar.status === "loading" && (
            <p className="flex items-center gap-2 text-text-muted">
              <Loader2 size={14} className="animate-spin" /> Loading your contribution calendar from GitHub…
            </p>
          )}
          {calendar.status === "ready" && (
            <div className="space-y-1.5 text-text-secondary">
              <p className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-success" />
                {calendar.data.totalContributions.toLocaleString()} contributions, {fmt(calendarRange(calendar.data).from)} – {fmt(calendarRange(calendar.data).to)}
              </p>
              <p className="text-text-muted">
                Real data from GitHub&apos;s contribution calendar, read with your FlowLens sign-in (no extra integration). The SVG is a
                snapshot from {fmt(calendar.data.fetchedAt)}.
              </p>
              <p className="text-text-muted">
                Because it&apos;s read with your own account, daily totals can include private contributions — only the counts appear,
                never repository names. Turn the heatmap off if you&apos;d rather not publish them.
              </p>
            </div>
          )}
          {profile.sections.contributions && (
            <div className="mt-3 border-t border-border pt-3">
              <Toggle
                checked={profile.autoRefresh}
                onChange={(autoRefresh) => update((p) => ({ ...p, autoRefresh }))}
                label="Keep it fresh with a daily GitHub Action"
                description="Adds a workflow to your profile repo that re-renders the heatmap each day from GitHub's API using the repo's own token. It reads only your public calendar (private counts only if you've enabled them on your profile)."
              />
            </div>
          )}
          {calendar.status === "error" && (
            <div className="space-y-2">
              <p className="flex items-start gap-2 text-warning">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{calendar.message} The heatmap is left out of your README until real data is available — nothing is estimated.</span>
              </p>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw /> Try again
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
