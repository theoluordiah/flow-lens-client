import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RepoLite, ChatContext, AccountStats } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildAccountChatContext(
  stats: AccountStats,
  repos: RepoLite[]
): ChatContext {
  const languageSummary = Object.entries(stats.languageRepos)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([lang, count]) => `${lang} (${count} repos)`)
    .join(", ");

  return {
    owner: "",
    repo: "",
    commits: stats.commits,
    pullRequests: stats.pullRequests,
    issues: stats.issues,
    contributors: stats.contributors,
    weeklyActivity: stats.weeklyActivity,
    languageSummary,
    repositories: repos.map((r) => ({
      full_name: r.full_name,
      stars: r.stars,
      forks: r.forks,
      openIssues: r.openIssues,
      language: r.language,
      updatedAt: r.updatedAt,
    })),
  };
}

export function formatNumber(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return n.toLocaleString();
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
