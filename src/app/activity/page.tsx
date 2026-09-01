"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { useDashboard } from "@/hooks/use-dashboard";
import { useRepositories } from "@/hooks/use-repositories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-states";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { useState } from "react";
import { GitCommit, GitPullRequest, AlertCircle, Users } from "lucide-react";

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, loading, fetchDashboard } = useDashboard();
  const { data: reposData, fetchRepositories } = useRepositories();
  const [selectedValue, setSelectedValue] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchRepositories(1, 50);
  }, [user, fetchRepositories]);

  useEffect(() => {
    if (data?.selectedRepository) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedValue((prev) => prev || data.selectedRepository!.full_name);
    }
  }, [data]);

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user, fetchDashboard]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const stats = data?.stats;
  const weeklyActivity = stats?.weeklyActivity ?? [];

  return (
    <AppShell title="Activity">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary tracking-tight">
              Activity
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Your recent development activity.
            </p>
          </div>
          <Select
            value={selectedValue || undefined}
            onValueChange={(value) => {
              setSelectedValue(value);
              const [owner, repo] = value.split("/");
              fetchDashboard(owner, repo);
            }}
          >
            <SelectTrigger className="w-[220px] h-8 text-xs">
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent>
              {(reposData?.repos ?? []).map((repo) => (
                <SelectItem key={repo.id} value={repo.full_name}>
                  {repo.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[280px] w-full" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </div>
        ) : data && stats ? (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Commits", value: stats.commits, icon: <GitCommit size={18} /> },
                { label: "Pull Requests", value: stats.pullRequests, icon: <GitPullRequest size={18} /> },
                { label: "Issues", value: stats.issues, icon: <AlertCircle size={18} /> },
                { label: "Contributors", value: stats.contributors, icon: <Users size={18} /> },
              ].map((m) => (
                <Card key={m.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      {m.icon}
                      <span className="text-[11px] uppercase tracking-wider">{m.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-text-primary tabular-nums">
                      {m.value.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Weekly Activity */}
            <Card>
              <CardHeader className="pb-1">
                <CardTitle>Coding Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityChart data={weeklyActivity} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Selected Repository</CardTitle>
              </CardHeader>
              <CardContent>
                {data.selectedRepository ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text-primary">
                      {data.selectedRepository.full_name}
                    </p>
                    {data.selectedRepository.description && (
                      <p className="text-xs text-text-muted">
                        {data.selectedRepository.description}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">No repository selected.</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <EmptyState
            title="No activity data available"
            description="Connect GitHub to see your development activity."
          />
        )}
      </div>
    </AppShell>
  );
}
