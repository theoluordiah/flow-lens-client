"use client";

import { useState } from "react";
import { Check, Copy, FileArchive, FileCode2, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { saveBlob } from "@/lib/download-card";
import { createZip } from "@/lib/profile/zip";
import { validateSvg } from "@/lib/profile/sanitize";
import type { ProfileExport } from "@/lib/profile/export";

export function ExportPanel({ output, username }: { output: ProfileExport; username: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  // Never hand out an asset that fails the safety check (the preview explains why).
  const assets = output.assets.filter((a) => validateSvg(a.svg).ok);
  const fileName = (path: string) => path.split("/").pop() ?? path;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output.readme);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  const downloadZip = () => {
    const zip = createZip([{ path: "README.md", content: output.readme }, ...assets.map((a) => ({ path: a.path, content: a.svg }))]);
    saveBlob(new Blob([zip.slice().buffer], { type: "application/zip" }), `${username}-profile-readme.zip`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Export</CardTitle>
        <CardDescription className="text-xs">FlowLens never writes to your GitHub account. You add the files yourself.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={downloadZip}>
            <FileArchive /> Download all (.zip)
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy Markdown"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => saveBlob(new Blob([output.readme], { type: "text/markdown;charset=utf-8" }), "README.md")}
          >
            <FileText /> README.md
          </Button>
          {assets.map((a) => (
            <Button
              key={a.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => saveBlob(new Blob([a.svg], { type: "image/svg+xml" }), fileName(a.path))}
            >
              <FileCode2 /> {fileName(a.path)}
            </Button>
          ))}
        </div>
        {copyError && <p className="text-[11px] text-error">Your browser blocked clipboard access. Use the README.md download instead.</p>}

        <div className="rounded-[var(--radius-md)] border border-border p-4 text-xs text-text-secondary">
          <p className="mb-2 font-medium text-text-primary">Add it to your GitHub profile</p>
          <ol className="list-decimal space-y-1.5 pl-4">
            <li>
              Create a <strong>public</strong> repository named exactly{" "}
              <code className="rounded bg-surface-secondary px-1 font-mono text-accent">{username}</code> (GitHub shows its README on
              your profile).{" "}
              <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-accent hover:underline">
                New repository <ExternalLink size={11} />
              </a>
            </li>
            <li>
              Unzip the download into the repository root, keeping the <code className="font-mono">assets/</code> folder next to{" "}
              <code className="font-mono">README.md</code>.
            </li>
            <li>Commit and push, then open github.com/{username}.</li>
          </ol>
          <p className="mt-3 text-text-muted">
            Animations run inside the SVGs and play in most browsers; some GitHub clients (such as the mobile apps) may show the static
            final frame instead. The contribution heatmap is a snapshot — re-export to update it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
