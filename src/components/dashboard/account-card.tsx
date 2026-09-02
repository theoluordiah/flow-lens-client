"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import {
  Star,
  Footprints,
  Activity,
  Layers,
  Share2,
  Download,
  Swords,
  Hammer,
  Gauge,
  Users,
  Boxes,
  Rocket,
  BatteryCharging,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User, AccountStats, RepoLite } from "@/types";

type Tier = "MYTHIC" | "GOLD" | "SILVER" | "BRONZE";

function getTier(score: number): Tier {
  if (score >= 85) return "MYTHIC";
  if (score >= 70) return "GOLD";
  if (score >= 50) return "SILVER";
  return "BRONZE";
}

const tierConfig: Record<Tier, { label: string; bg: string; border: string; text: string; glow: string; stroke: string; desc: string }> = {
  MYTHIC: { label: "MYTHIC", bg: "bg-violet-500/10", border: "border-violet-500/50", text: "text-violet-400", glow: "shadow-[0_0_40px_rgba(139,92,246,0.2)]", stroke: "#8B5CF6", desc: "Rare legend of the open source arena" },
  GOLD: { label: "GOLD", bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400", glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]", stroke: "#F59E0B", desc: "A consistently strong contributor" },
  SILVER: { label: "SILVER", bg: "bg-slate-400/10", border: "border-slate-400/40", text: "text-slate-300", glow: "", stroke: "#94A3B8", desc: "Solid and on the rise" },
  BRONZE: { label: "BRONZE", bg: "bg-orange-700/10", border: "border-orange-700/40", text: "text-orange-400", glow: "", stroke: "#C2410C", desc: "Just getting started" },
};

type AttrKey = "actual" | "velocity" | "synergy" | "versatile" | "reach" | "sustain";

const attrMeta: { key: AttrKey; label: string; icon: typeof Hammer; sub: string }[] = [
  { key: "actual", label: "ACTUAL", icon: Hammer, sub: "Code Output" },
  { key: "velocity", label: "VELOCITY", icon: Gauge, sub: "Peak Pace" },
  { key: "synergy", label: "SYNERGY", icon: Users, sub: "Collaboration" },
  { key: "versatile", label: "VERSATILE", icon: Boxes, sub: "Languages × Repos" },
  { key: "reach", label: "REACH", icon: Rocket, sub: "Repo Impact" },
  { key: "sustain", label: "SUSTAIN", icon: BatteryCharging, sub: "Endurance" },
];

const positionMap: Record<AttrKey, string> = {
  actual: "ST",
  velocity: "RW",
  synergy: "CAM",
  versatile: "CM",
  reach: "LF",
  sustain: "CDM",
};

const archetypeNames: Record<AttrKey, string> = {
  actual: "The Builder",
  velocity: "The Sprinter",
  synergy: "The Orchestrator",
  versatile: "The Polymath",
  reach: "The Influencer",
  sustain: "The Marathoner",
};

function getTopAttr(attrs: Record<AttrKey, number>): AttrKey {
  return Object.entries(attrs).reduce((a, b) => (b[1] > a[1] ? b : a))[0] as AttrKey;
}

function getPlaystyles(attrs: Record<AttrKey, number>): string[] {
  const sorted = (Object.entries(attrs) as [AttrKey, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  const map: Partial<Record<AttrKey, string>> = {
    actual: "Prolific",
    velocity: "Sprinter",
    synergy: "Conductor",
    versatile: "Polyglot",
    reach: "Influencer",
    sustain: "Ironman",
  };
  return sorted.map(([key]) => map[key]!).filter(Boolean);
}

function normalize(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(99, Math.round((value / max) * 99));
}

function computeAttrs(stats: AccountStats): Record<AttrKey, number> {
  const keys = Object.keys(stats.languageRepos).length;
  const weeklyMax =
    stats.weeklyActivity.length > 0
      ? Math.max(...stats.weeklyActivity, 1)
      : 1;
  const weeklyTotal = stats.weeklyActivity.reduce((a, b) => a + b, 0);
  const weekCount = Math.max(stats.weeklyActivity.length, 1);

  return {
    actual: normalize(stats.commits, 2000),
    velocity: normalize(weeklyMax, 60),
    synergy: normalize(stats.pullRequests + stats.contributors, 150),
    versatile: normalize(keys * 12 + stats.repoCount, 80),
    reach: normalize(stats.stars + stats.forks + stats.issues, 300),
    sustain: normalize(weekCount * (weeklyTotal / weekCount) * 4, 300),
  };
}

function toStars(value: number): number {
  return Math.max(1, Math.min(5, Math.round((value / 99) * 5)));
}

function WorkRate(attrs: Record<AttrKey, number>): string {
  const v = attrs.velocity;
  const s = attrs.sustain;
  const part = (n: number) => (n >= 60 ? "High" : n >= 30 ? "Medium" : "Low");
  return `${part(v)}/${part(s)}`;
}

function OverallRating({ score, size = 132 }: { score: number; size?: number }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  const tier = getTier(score);
  const tierColors: Record<Tier, string> = {
    MYTHIC: "#8B5CF6",
    GOLD: "#F59E0B",
    SILVER: "#94A3B8",
    BRONZE: "#C2410C",
  };
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={5} className="text-surface-secondary" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tierColors[tier]}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-100"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-text-primary tabular-nums tracking-tight leading-none">{animated}</span>
        <span className="text-[10px] text-text-muted mt-0.5">/99</span>
      </div>
    </div>
  );
}

function AttributeChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface-secondary px-3 py-2">
      <Icon size={13} className="text-text-muted shrink-0" />
      <span className="text-[10px] text-text-muted uppercase tracking-wider flex-1 truncate">{label}</span>
      <span className="text-xs font-bold text-text-primary">{value}</span>
    </div>
  );
}

function MetricRow({
  label,
  value,
  rating,
  unit,
}: {
  label: string;
  value: number;
  rating: number;
  unit: string;
}) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(Math.round(eased * rating));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [rating]);

  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 truncate">
        <span className="block text-[11px] font-bold text-text-primary tracking-wider leading-none">{label}</span>
        <span className="block text-[10px] text-text-muted mt-0.5 leading-none truncate">
          {value.toLocaleString()} {unit}
        </span>
      </div>
      <div className="flex-1">
        <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
            style={{ width: `${animated}%` }}
          />
        </div>
      </div>
      <span className="w-7 text-right text-xs font-bold text-text-primary tabular-nums">{animated}</span>
    </div>
  );
}

export function AccountCard({
  user,
  stats,
  repos = [],
}: {
  user: User;
  stats: AccountStats;
  repos?: RepoLite[];
}) {
  const [copied, setCopied] = useState(false);
  const [duelResult, setDuelResult] = useState<string | null>(null);

  const attrs = computeAttrs(stats);
  const overall = Math.round(
    Object.values(attrs).reduce((a, b) => a + b, 0) / Object.keys(attrs).length
  );
  const tier = getTier(overall);
  const tc = tierConfig[tier];
  const topAttr = getTopAttr(attrs);
  const playstyles = getPlaystyles(attrs);
  const weeklyTotal = stats.weeklyActivity.reduce((a, b) => a + b, 0);
  const topRepoStars = Math.max(0, ...repos.map((r) => r.stars));
  const langCount = Object.keys(stats.languageRepos).length;

  const metrics = [
    { label: "Commits (14d)", value: stats.commits, rating: normalize(stats.commits, 400), unit: "commits" },
    { label: "Stars earned", value: stats.stars, rating: normalize(stats.stars, 30), unit: "stars" },
    { label: "Top repo reach", value: topRepoStars, rating: normalize(topRepoStars, 22), unit: "stars" },
    { label: "PRs (14d)", value: stats.pullRequests, rating: normalize(stats.pullRequests, 30), unit: "PRs" },
    { label: "Followers", value: stats.followers ?? 0, rating: normalize(stats.followers ?? 0, 76), unit: "followers" },
    { label: "Languages", value: langCount, rating: normalize(langCount, 9.4), unit: "languages" },
    { label: "Contributors", value: stats.contributors, rating: normalize(stats.contributors, 11), unit: "contributors" },
    { label: "Contributions (14d)", value: weeklyTotal, rating: normalize(weeklyTotal, 850), unit: "contributions" },
  ];

  const starRating = toStars(attrs.versatile);
  const weakFoot = toStars(attrs.sustain);
  const radarData = attrMeta.map(({ key, label }) => ({
    attribute: label,
    value: Math.min(100, Math.max(50, 50 + (attrs[key] / 99) * 49)),
  }));

  const shareCard = async () => {
    const lines = [
      `${user.displayName || user.username} (@${user.username})`,
      `${tc.label} · Rating ${overall}/99`,
      `${stats.commits} commits · ${stats.stars} stars · ${stats.pullRequests} PRs · ${weeklyTotal} contributions`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadCard = () => {
    const punch = [...playstyles].join(", ");
    const lines = [
      `${user.displayName || user.username} (@${user.username}) — ${tc.label} PLAYER CARD`,
      `Rating ${overall}/99 · ${positionMap[topAttr]} · ${archetypeNames[topAttr]}`,
      `Playstyles: ${punch || "Rising talent"}`,
      "",
      ...metrics.map((m) => `${m.label}: ${m.value.toLocaleString()} ${m.unit} (${m.rating})`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user.username}-flowlens-card.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const duel = () => {
    const pool = repos.filter((r) => r.stars > 0 && r.stars < stats.stars + 100);
    if (pool.length === 0) {
      setDuelResult(`No rival strong enough yet — ${archetypeNames[topAttr].toLowerCase()} stands uncontested.`);
      return;
    }
    const rival = pool[Math.floor(Math.random() * pool.length)];
    const reach = attrs.reach;
    const verdict =
      reach >= 70
        ? "by a clear margin"
        : reach >= 50
          ? "but it stays close"
          : "and it's anyone's game";
    setDuelResult(`Rival found: ${rival.full_name} (★ ${rival.stars}). You hold a ${reach}/99 impact rating — ${verdict}.`);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className={cn("col-span-full lg:col-span-5", tc.glow)}>
        <div className={cn("relative rounded-xl border bg-surface overflow-hidden", tc.border)}>
          <div className={cn("h-1 w-full", tc.bg)} />
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className={cn("text-[11px] font-bold tracking-widest uppercase", tc.text)}>{tc.label}</span>
              <span className="text-[11px] text-text-muted font-medium">{positionMap[topAttr]} · Misplaced in the repo</span>
            </div>

            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 ring-2 ring-border">
                <AvatarImage src={user.avatarUrl} alt={user.username} />
                <AvatarFallback className="text-lg font-bold bg-surface-secondary text-text-primary">
                  {user.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-text-primary truncate leading-tight">{user.displayName || user.username}</p>
                <p className="text-xs text-text-muted mt-0.5">@{user.username}</p>
                <p className={cn("text-[11px] font-medium mt-1", tc.text)}>{attributesArchetypeLine(attrs)}</p>
              </div>
              <OverallRating score={overall} size={96} />
            </div>

            <p className="text-[11px] text-text-muted mt-3 italic">
              “{archetypeNames[topAttr]}: {tc.desc.toLowerCase()}.”
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
              <AttributeChip icon={Star} label="Skill Moves" value={"★".repeat(starRating) || "★"} />
              <AttributeChip icon={Footprints} label="Weak Foot" value={"★".repeat(weakFoot) || "★"} />
              <AttributeChip icon={Activity} label="Work Rate" value={WorkRate(attrs)} />
              <AttributeChip icon={Layers} label="Style" value={archetypeNames[topAttr]} />
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {(playstyles.length > 0 ? playstyles : ["Rising talent"]).map((p) => (
                <span key={p} className="rounded-full border border-border bg-surface-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  {p}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
              <button
                onClick={shareCard}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  copied
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-border bg-surface-secondary text-text-secondary hover:border-border-hover"
                )}
              >
                {copied ? <Check size={12} /> : <Share2 size={12} />}
                {copied ? "Copied" : "Share"}
              </button>
              <button
                onClick={downloadCard}
                className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-secondary px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary hover:border-border-hover"
              >
                <Download size={12} />
                Card
              </button>
              <button
                onClick={duel}
                className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-secondary px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary hover:border-border-hover"
              >
                <Swords size={12} />
                Duel
              </button>
            </div>

            {duelResult && (
              <p className="text-[10px] text-text-muted mt-3 bg-surface-secondary rounded-md border border-border/50 px-3 py-2">
                {duelResult}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="col-span-full lg:col-span-7 space-y-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Scouting Metrics
            <span className="text-[10px] text-text-muted font-normal block mt-0.5">Rating vs. typical open source developer</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {metrics.map((m) => (
              <MetricRow key={m.label} {...m} />
            ))}
          </div>
          <p className="text-[10px] text-text-muted mt-4 pt-3 border-t border-border">
            Top repo reach = stars on your most-starred repo · Contributions = total weekly activity.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Distribution</h3>
          <p className="text-[10px] text-text-muted mb-2">Six developer attributes scaled over a 50–100 band.</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid />
                <PolarAngleAxis dataKey="attribute" tick={{ fill: "#64748b", fontSize: 11 }} />
                <PolarRadiusAxis domain={[50, 100]} tickCount={6} tick={{ fill: "#94a3b8", fontSize: 9 }} tickFormatter={(v: number) => `${v}`} />
                <Radar dataKey="value" stroke={tc.stroke} fill={tc.stroke} fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function attributesArchetypeLine(attrs: Record<AttrKey, number>): string {
  const top = getTopAttr(attrs);
  const tagline: Record<AttrKey, string> = {
    actual: "Building fast",
    velocity: "Moving at sprint pace",
    synergy: "Orchestrating the team",
    versatile: "Working many stacks",
    reach: "Reaching far corners",
    sustain: "Endurance champion",
  };
  return tagline[top];
}