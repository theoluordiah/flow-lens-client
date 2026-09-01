"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { useAccountStats } from "@/hooks/use-account-stats";
import { AccountCard } from "@/components/dashboard/account-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { LanguageBreakdown } from "@/components/dashboard/language-breakdown";
import { DashboardSkeleton } from "@/components/ui/loading-skeletons";
import { ErrorState } from "@/components/ui/empty-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { getGreeting } from "@/lib/utils";
import type { RepoLite } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { stats, repos, loading, error, fetchAccount } = useAccountStats();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchAccount();
  }, [user, fetchAccount]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const weeklyActivity = stats?.weeklyActivity ?? [];

  return (
    <AppShell title="Dashboard">
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorState
          title="Unable to load your account stats"
          description="Something went wrong while aggregating your GitHub activity."
          onRetry={fetchAccount}
        />
      ) : stats ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">
                {getGreeting()}, {user.displayName || user.username}.
              </h2>
              <p className="text-sm text-text-secondary mt-0.5">
                Your entire GitHub journey across {stats.repoCount} repositories.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAccount}
              aria-label="Refresh account stats"
            >
              <RefreshCw size={14} />
              Refresh
            </Button>
          </div>

          {/* Account Player Card (GitFut-style) */}
          <AccountCard user={user} stats={stats} repos={repos} />

          {/* Activity + Languages */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="col-span-full lg:col-span-8">
              <Card>
                <CardHeader className="pb-1">
                  <div className="flex items-center justify-between">
                    <CardTitle>Coding Activity</CardTitle>
                    <span className="text-[11px] text-text-muted">
                      {weeklyActivity.length || 6} weeks
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ActivityChart data={weeklyActivity} />
                </CardContent>
              </Card>
            </div>
            <div className="col-span-full lg:col-span-4">
              <LanguageBreakdown languages={stats.languageRepos} />
            </div>
          </div>

          {/* Top Repositories */}
          {repos.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Top Repositories</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border/50">
                  {[...repos]
                    .sort((a, b) => b.stars - a.stars)
                    .slice(0, 5)
                    .map((repo: RepoLite) => (
                      <li key={repo.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{repo.full_name}</p>
                          {repo.description && (
                            <p className="text-xs text-text-muted truncate">{repo.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          {repo.language && (
                            <span className="text-xs text-text-muted">{repo.language}</span>
                          )}
                          <span className="text-xs text-text-secondary tabular-nums">★ {repo.stars}</span>
                          <span className="text-xs text-text-secondary tabular-nums">⑂ {repo.forks}</span>
                        </div>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}
