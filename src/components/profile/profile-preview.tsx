"use client";

import { useMemo, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import { AlertTriangle, RotateCcw, Play } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateSvg } from "@/lib/profile/sanitize";
import { LIMITS, type ProfileConfig } from "@/lib/profile/types";
import type { ProfileExport, ProfileAsset } from "@/lib/profile/export";

type Update = (recipe: (p: ProfileConfig) => ProfileConfig) => void;

const ASSET_LABELS: Record<ProfileAsset["key"], string> = {
  card: "Card SVG",
  portrait: "Portrait SVG",
  contributions: "Heatmap SVG",
};

export const svgDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const parsesAsXml = (svg: string) => {
  if (typeof DOMParser === "undefined") return true;
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  return !doc.querySelector("parsererror");
};

function SvgPreview({ asset }: { asset: ProfileAsset }) {
  const [replay, setReplay] = useState(0);
  const check = useMemo(() => validateSvg(asset.svg, parsesAsXml), [asset.svg]);
  const kb = (new Blob([asset.svg]).size / 1024).toFixed(1);
  const alt = asset.svg.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] ?? "";
  return (
    <div className="space-y-2">
      {!check.ok && (
        <Alert variant="error">
          <AlertDescription>This SVG failed a safety check ({check.problems.join(", ")}). Please report it; it won&apos;t be exported.</AlertDescription>
        </Alert>
      )}
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-[#0d1117] p-3">
        {/* Rendered through <img> like GitHub does, so scripts could never run and CSS animation behaves the same. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={replay} src={svgDataUri(asset.svg)} alt={alt} className="mx-auto h-auto max-w-full" />
      </div>
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span className="font-mono">
          {asset.path} · {kb} KB{asset.inReadme ? "" : " · not used in README"}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={() => setReplay((n) => n + 1)}>
          <Play /> Replay
        </Button>
      </div>
    </div>
  );
}

function ReadmePreview({ markdown, assets }: { markdown: string; assets: ProfileAsset[] }) {
  const sources = useMemo(() => Object.fromEntries(assets.map((a) => [a.path, svgDataUri(a.svg)])), [assets]);
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-[#0d1117] p-5 text-sm leading-relaxed text-[#e6edf3]">
      <ReactMarkdown
        urlTransform={(url) => sources[url.replace(/^\.\//, "")] ?? defaultUrlTransform(url)}
        components={{
          h1: ({ children }) => <h1 className="mb-3 border-b border-[#30363d] pb-2 text-2xl font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-6 border-b border-[#30363d] pb-1.5 text-lg font-semibold">{children}</h2>,
          p: ({ children }) => <p className="mb-3">{children}</p>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#4493f8] hover:underline">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-6">{children}</ol>,
          code: ({ children }) => <code className="rounded bg-[#6e768166] px-1.5 py-0.5 text-[0.85em]">{children}</code>,
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} className="h-auto max-w-full" />,
        }}
      >
        {/* GitHub hides HTML comments; react-markdown would print them as text. */}
        {markdown.replace(/<!--[\s\S]*?-->\s*/g, "")}
      </ReactMarkdown>
      <p className="mt-4 border-t border-[#30363d] pt-2 text-[11px] text-[#8b949e]">
        Approximate GitHub rendering. Raw HTML in the Markdown is shown as text here; GitHub allows a limited subset.
      </p>
    </div>
  );
}

export function ProfilePreview({ output, profile, update }: { output: ProfileExport; profile: ProfileConfig; update: Update }) {
  const overridden = profile.readmeOverride !== null;
  return (
    <Tabs defaultValue="readme">
      <TabsList className="h-auto flex-wrap justify-start">
        <TabsTrigger value="readme">README</TabsTrigger>
        {output.assets.map((a) => (
          <TabsTrigger key={a.key} value={a.key}>
            {ASSET_LABELS[a.key]}
          </TabsTrigger>
        ))}
        <TabsTrigger value="markdown">Markdown</TabsTrigger>
      </TabsList>
      <TabsContent value="readme">
        <ReadmePreview markdown={output.readme} assets={output.assets} />
      </TabsContent>
      {output.assets.map((a) => (
        <TabsContent key={a.key} value={a.key}>
          <SvgPreview asset={a} />
        </TabsContent>
      ))}
      <TabsContent value="markdown" className="space-y-2">
        {overridden && (
          <Alert variant="warning">
            <AlertDescription className="flex items-start gap-2 text-xs">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              You&apos;re editing the Markdown by hand, so form changes won&apos;t show up here until you regenerate. SVG assets still update.
            </AlertDescription>
          </Alert>
        )}
        <Textarea
          aria-label="README Markdown"
          value={output.readme}
          maxLength={LIMITS.readme}
          onChange={(e) => {
            const value = e.target.value;
            update((p) => ({ ...p, readmeOverride: value === output.generatedReadme ? null : value }));
          }}
          className="min-h-[420px] font-mono text-xs leading-relaxed"
          spellCheck={false}
        />
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" disabled={!overridden} onClick={() => update((p) => ({ ...p, readmeOverride: null }))}>
            <RotateCcw /> Regenerate from form
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
