"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { LanguageBreakdown } from "@/components/dashboard/language-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/empty-states";
import { getRepository, getRepositoryStats } from "@/api/repositories";
import { ExternalLink, GitCommit, GitPullRequest, AlertCircle, Users, Star, GitFork } from "lucide-react";
import type { RepoLite, Stats } from "@/types";

export default function RepositoryDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [repository, setRepository] = useState<RepoLite | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && owner && repo) {
      const load = async () => {
        setLoading(true);
        setError(null);
        try {
          const [repoData, statsData] = await Promise.all([
            getRepository(owner, repo),
            getRepositoryStats(owner, repo),
          ]);
          setRepository(repoData);
          setStats(statsData);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Failed to load repository");
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [user, owner, repo]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AppShell title={`${owner} / ${repo}`}>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load repository"
          description={error}
          onRetry={() => window.location.reload()}
        />
      ) : repository ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary tracking-tight">
                {owner} / {repo}
              </h2>
              {repository.description && (
                <p className="text-sm text-text-secondary mt-1 max-w-xl">
                  {repository.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {repository.language && (
                  <Badge variant="secondary">{repository.language}</Badge>
                )}
                {repository.private && <Badge variant="outline">Private</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" asChild>
                <a href={repository.htmlUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                  Open GitHub
                </a>
              </Button>
            </div>
          </div>

          {/* Metrics */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {[
                { label: "Commits (14d)", value: stats.commits, icon: <GitCommit size={16} /> },
                { label: "PRs (14d)", value: stats.pullRequests, icon: <GitPullRequest size={16} /> },
                { label: "Issues (14d)", value: stats.issues, icon: <AlertCircle size={16} /> },
                { label: "Contributors", value: stats.contributors, icon: <Users size={16} /> },
                { label: "Stars", value: stats.stars, icon: <Star size={16} /> },
                { label: "Forks", value: stats.forks, icon: <GitFork size={16} /> },
              ].map((m) => (
                <Card key={m.label}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-text-muted mb-1">
                      {m.icon}
                      <span className="text-[11px] uppercase tracking-wider">{m.label}</span>
                    </div>
                    <p className="text-xl font-bold text-text-primary tabular-nums">
                      {m.value.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              {stats ? (
                <Card>
                  <CardHeader className="pb-1">
                    <div className="flex items-center justify-between">
                      <CardTitle>Coding Activity</CardTitle>
                      <span className="text-[11px] text-text-muted">
                        Last 14 days
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ActivityChart data={stats.weeklyActivity} />
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="languages">
              {stats && <LanguageBreakdown languages={stats.languages} />}
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </AppShell>
  );
}
