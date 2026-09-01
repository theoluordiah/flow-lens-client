"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Palette, Bell, Shield, ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
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
    <AppShell title="Settings">
      <div className="max-w-lg space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary tracking-tight">
            Settings
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your account and preferences.
          </p>
        </div>

        {/* Account */}
        <SettingsSection
          icon={<User size={16} />}
          title="Account"
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-muted">Username</p>
              <p className="text-sm text-text-primary">{user.username}</p>
            </div>
            {user.displayName && (
              <div>
                <p className="text-xs text-text-muted">Name</p>
                <p className="text-sm text-text-primary">{user.displayName}</p>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* GitHub */}
        <SettingsSection
          icon={<GithubIcon width={16} height={16} />}
          title="GitHub"
          action={
            <Button variant="ghost" size="sm" asChild>
              <a href="/github">
                Manage
                <ExternalLink size={12} />
              </a>
            </Button>
          }
        >
          <p className="text-xs text-text-secondary">
            Your GitHub account is connected. Manage your connection settings on the GitHub page.
          </p>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection
          icon={<Palette size={16} />}
          title="Appearance"
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-muted">Theme</p>
              <p className="text-sm text-text-primary">Dark</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Light mode coming soon.
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          icon={<Bell size={16} />}
          title="Notifications"
        >
          <p className="text-xs text-text-secondary">
            Notification preferences coming soon.
          </p>
        </SettingsSection>

        {/* Security */}
        <SettingsSection
          icon={<Shield size={16} />}
          title="Security"
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-muted">Session</p>
              <p className="text-sm text-text-primary">
                Authenticated via GitHub OAuth
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </SettingsSection>
      </div>
    </AppShell>
  );
}

function SettingsSection({
  icon,
  title,
  children,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            {icon}
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
