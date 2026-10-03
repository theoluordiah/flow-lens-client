"use client";

import { useState } from "react";
import { Plus, Trash2, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getRepositories } from "@/api/repositories";
import { getAccountStats } from "@/api/account";
import { LIMITS, LINK_PRESETS, type ProfileConfig, type ProfileProject } from "@/lib/profile/types";
import { safeUrl } from "@/lib/profile/sanitize";
import type { RepoLite } from "@/types";
import { CharCount, Field, TagInput } from "./fields";

type Update = (recipe: (p: ProfileConfig) => ProfileConfig) => void;

function urlError(url: string): string | null {
  if (!url.trim()) return null;
  return safeUrl(url) ? null : "Enter a full link starting with https:// (or mailto: for email).";
}

export function BasicsForm({ profile, update }: { profile: ProfileConfig; update: Update }) {
  const set = <K extends keyof ProfileConfig>(key: K, value: ProfileConfig[K]) => update((p) => ({ ...p, [key]: value }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">About you</CardTitle>
        <CardDescription className="text-xs">Everything here is yours to write — FlowLens never invents achievements or stats.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="pb-name">
            <Input id="pb-name" value={profile.displayName} maxLength={LIMITS.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="Ada Lovelace" />
          </Field>
          <Field label="Professional title" htmlFor="pb-title">
            <Input id="pb-title" value={profile.title} maxLength={LIMITS.title} onChange={(e) => set("title", e.target.value)} placeholder="Full-stack engineer" />
          </Field>
        </div>
        <Field label="Current focus" htmlFor="pb-focus" hint="One line, e.g. what you're building or learning now.">
          <Input id="pb-focus" value={profile.focus} maxLength={LIMITS.focus} onChange={(e) => set("focus", e.target.value)} placeholder="Developer tooling and static analysis" />
        </Field>
        <Field label="Bio" htmlFor="pb-bio">
          <Textarea id="pb-bio" rows={4} value={profile.bio} maxLength={LIMITS.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A short introduction in your own words. Markdown is fine." />
          <div className="flex justify-end">
            <CharCount value={profile.bio} max={LIMITS.bio} />
          </div>
        </Field>
      </CardContent>
    </Card>
  );
}

export function SkillsForm({ profile, update }: { profile: ProfileConfig; update: Update }) {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const importLanguages = async () => {
    setImporting(true);
    setImportError(null);
    try {
      const { stats } = await getAccountStats();
      const top = Object.entries(stats.languageRepos ?? {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([lang]) => lang);
      if (!top.length) setImportError("GitHub didn't report a primary language for any of your repositories.");
      update((p) => {
        const merged = [...p.languages];
        for (const lang of top) if (merged.length < LIMITS.languages && !merged.includes(lang)) merged.push(lang);
        return { ...p, languages: merged };
      });
    } catch {
      setImportError("Couldn't load your GitHub languages right now.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Programming languages" hint="Press Enter or comma to add." error={importError}>
          <TagInput value={profile.languages} max={LIMITS.languages} maxLength={LIMITS.tag} onChange={(languages) => update((p) => ({ ...p, languages }))} placeholder="TypeScript, Go…" />
        </Field>
        <Button type="button" variant="outline" size="sm" onClick={importLanguages} disabled={importing}>
          {importing ? <Loader2 className="animate-spin" /> : <Download />}
          Add top languages from my GitHub repos
        </Button>
        <Field label="Tech stack & tools">
          <TagInput value={profile.stack} max={LIMITS.stack} maxLength={LIMITS.tag} onChange={(stack) => update((p) => ({ ...p, stack }))} placeholder="React, PostgreSQL, Docker…" />
        </Field>
      </CardContent>
    </Card>
  );
}

const emptyProject: ProfileProject = { name: "", description: "", url: "", tech: "" };

export function ProjectsForm({ profile, update }: { profile: ProfileConfig; update: Update }) {
  const [repos, setRepos] = useState<RepoLite[] | null>(null);
  const [reposError, setReposError] = useState<string | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const setProject = (i: number, patch: Partial<ProfileProject>) =>
    update((p) => ({ ...p, projects: p.projects.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const full = profile.projects.length >= LIMITS.projects;

  const loadRepos = async () => {
    setLoadingRepos(true);
    setReposError(null);
    try {
      const res = await getRepositories(1, 100);
      // Only public repositories: a profile README is public.
      setRepos(res.repos.filter((r) => !r.private));
    } catch {
      setReposError("Couldn't load your repositories.");
    } finally {
      setLoadingRepos(false);
    }
  };

  const addRepo = (fullName: string) => {
    const repo = repos?.find((r) => r.full_name === fullName);
    if (!repo || full) return;
    update((p) => ({
      ...p,
      projects: [
        ...p.projects,
        {
          name: repo.name.slice(0, LIMITS.projectName),
          description: (repo.description ?? "").slice(0, LIMITS.projectDescription),
          url: repo.htmlUrl,
          tech: repo.language ?? "",
        },
      ],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Featured projects</CardTitle>
        <CardDescription className="text-xs">Up to {LIMITS.projects}. Only public repositories are offered for import.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile.projects.map((project, i) => (
          <div key={i} className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <Input value={project.name} maxLength={LIMITS.projectName} onChange={(e) => setProject(i, { name: e.target.value })} />
              </Field>
              <Field label="Tech" hint="Optional, e.g. Next.js · Postgres">
                <Input value={project.tech} maxLength={LIMITS.projectTech} onChange={(e) => setProject(i, { tech: e.target.value })} />
              </Field>
            </div>
            <Field label="Description">
              <Input value={project.description} maxLength={LIMITS.projectDescription} onChange={(e) => setProject(i, { description: e.target.value })} />
            </Field>
            <Field label="Link" error={urlError(project.url)}>
              <Input value={project.url} maxLength={LIMITS.url} onChange={(e) => setProject(i, { url: e.target.value })} placeholder="https://github.com/you/project" />
            </Field>
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => update((p) => ({ ...p, projects: p.projects.filter((_, j) => j !== i) }))}>
                <Trash2 /> Remove
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={full} onClick={() => update((p) => ({ ...p, projects: [...p.projects, { ...emptyProject }] }))}>
            <Plus /> Add project
          </Button>
          {repos === null ? (
            <Button type="button" variant="outline" size="sm" disabled={full || loadingRepos} onClick={loadRepos}>
              {loadingRepos ? <Loader2 className="animate-spin" /> : <Download />}
              Import from GitHub
            </Button>
          ) : (
            <select
              aria-label="Import a repository"
              disabled={full}
              value=""
              onChange={(e) => addRepo(e.target.value)}
              className="h-8 max-w-full rounded-[var(--radius-sm)] border border-border bg-surface-secondary px-2 text-xs text-text-primary"
            >
              <option value="">{repos.length ? "Choose a public repository…" : "No public repositories found"}</option>
              {repos.map((r) => (
                <option key={r.full_name} value={r.full_name}>
                  {r.full_name}
                </option>
              ))}
            </select>
          )}
        </div>
        {reposError && <p className="text-[11px] text-error">{reposError}</p>}
      </CardContent>
    </Card>
  );
}

export function LinksForm({ profile, update }: { profile: ProfileConfig; update: Update }) {
  const setLink = (i: number, patch: Partial<{ label: string; url: string }>) =>
    update((p) => ({ ...p, links: p.links.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const full = profile.links.length >= LIMITS.links;
  const unused = LINK_PRESETS.filter((l) => !profile.links.some((x) => x.label === l));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Links</CardTitle>
        <CardDescription className="text-xs">Invalid links are left out of the exports until they&apos;re fixed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <datalist id="pb-link-presets">
          {LINK_PRESETS.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        {profile.links.map((link, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-start gap-2">
            <Input aria-label="Link label" list="pb-link-presets" value={link.label} maxLength={LIMITS.linkLabel} onChange={(e) => setLink(i, { label: e.target.value })} placeholder="Label" />
            <div className="space-y-1">
              <Input
                aria-label={`${link.label || "Link"} URL`}
                value={link.url}
                maxLength={LIMITS.url}
                onChange={(e) => setLink(i, { url: e.target.value })}
                placeholder={link.label === "Email" ? "mailto:you@example.com" : "https://"}
              />
              {urlError(link.url) && <p className="text-[11px] text-error">{urlError(link.url)}</p>}
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Remove link" onClick={() => update((p) => ({ ...p, links: p.links.filter((_, j) => j !== i) }))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {unused.slice(0, 5).map((label) => (
            <Button key={label} type="button" variant="outline" size="sm" disabled={full} onClick={() => update((p) => ({ ...p, links: [...p.links, { label, url: "" }] }))}>
              <Plus /> {label}
            </Button>
          ))}
          <Button type="button" variant="outline" size="sm" disabled={full} onClick={() => update((p) => ({ ...p, links: [...p.links, { label: "", url: "" }] }))}>
            <Plus /> Other
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
