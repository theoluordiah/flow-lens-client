"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfileBuilder } from "@/hooks/use-profile-builder";
import { BasicsForm, LinksForm, ProjectsForm, SkillsForm } from "@/components/profile/profile-form";
import { PortraitPanel } from "@/components/profile/portrait-panel";
import { SectionsPanel, StylePanel } from "@/components/profile/style-panel";
import { ProfilePreview } from "@/components/profile/profile-preview";
import { ExportPanel } from "@/components/profile/export-panel";
import { timeAgo } from "@/lib/utils";

export default function ProfileBuilderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const builder = useProfileBuilder(user);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user || builder.loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const { profile, update } = builder;

  const confirmDelete = () => {
    if (window.confirm("Delete your saved profile and this browser's draft? Exported files you already downloaded aren't affected.")) {
      builder.remove();
    }
  };

  return (
    <AppShell title="Profile Builder">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">Profile Builder</h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              Design a terminal-style GitHub profile README with an optional ASCII portrait and your real contribution heatmap.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">
              {builder.dirty ? "Unsaved changes (draft kept in this browser)" : builder.savedAt ? `Saved ${timeAgo(builder.savedAt)}` : "Not saved yet"}
            </span>
            {builder.savedAt && (
              <Button type="button" variant="ghost" size="sm" onClick={confirmDelete}>
                <Trash2 /> Delete saved
              </Button>
            )}
            <Button type="button" size="sm" onClick={builder.save} disabled={builder.saving || !builder.dirty}>
              {builder.saving ? <Loader2 className="animate-spin" /> : <Save />}
              Save profile
            </Button>
          </div>
        </div>

        {builder.error && (
          <Alert variant="error">
            <AlertDescription>{builder.error}</AlertDescription>
          </Alert>
        )}
        {builder.notice && !builder.error && (
          <Alert>
            <AlertDescription>{builder.notice}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <Tabs defaultValue="profile" className="min-w-0">
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="projects">Projects & links</TabsTrigger>
              <TabsTrigger value="portrait">Portrait</TabsTrigger>
              <TabsTrigger value="style">Style & sections</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="space-y-4">
              <BasicsForm profile={profile} update={update} />
              <SkillsForm profile={profile} update={update} />
            </TabsContent>
            <TabsContent value="projects" className="space-y-4">
              <ProjectsForm profile={profile} update={update} />
              <LinksForm profile={profile} update={update} />
            </TabsContent>
            <TabsContent value="portrait">
              <PortraitPanel
                profile={profile}
                update={update}
                hasPhoto={builder.hasPhoto}
                applyPhoto={builder.applyPhoto}
                forgetPhoto={builder.forgetPhoto}
                avatarUrl={user.avatarUrl}
              />
            </TabsContent>
            <TabsContent value="style" className="space-y-4">
              <StylePanel profile={profile} update={update} />
              <SectionsPanel profile={profile} update={update} calendar={builder.calendar} onRetry={builder.loadCalendar} />
            </TabsContent>
          </Tabs>

          <div className="min-w-0 space-y-4 xl:sticky xl:top-0 xl:self-start">
            <ProfilePreview output={builder.output} profile={profile} update={update} />
            <ExportPanel output={builder.output} username={user.username} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
