"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, CheckCircle2, Calendar } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";

export default function GitHubPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AppShell title="GitHub">
      <div className="max-w-lg space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight">
            GitHub
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your GitHub connection.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <GithubIcon width={16} height={16} />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatarUrl} alt={user.username} />
                <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">@{user.username}</p>
                  <div className="flex items-center gap-1 text-success">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                </div>
                {user.displayName && (
                  <p className="text-xs text-text-muted mt-0.5">{user.displayName}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Calendar size={14} />
                Connected via GitHub OAuth
              </div>
              <Button variant="secondary" size="sm" asChild>
                <a
                  href={user.profileUrl || `https://github.com/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={14} />
                  Open GitHub Profile
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Data Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-text-secondary leading-relaxed">
              FlowLens accesses your public repository data to generate development
              insights. We do not access private repositories, code contents, or
              sensitive information. Your data is used solely for generating
              your developer activity report.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
