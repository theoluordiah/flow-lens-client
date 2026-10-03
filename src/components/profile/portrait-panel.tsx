"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ACCEPTED_PHOTO_TYPES,
  CHARSET_LABELS,
  PortraitError,
  checkPhotoFile,
  loadImage,
} from "@/lib/profile/ascii";
import { PORTRAIT_CHARSETS, type PortraitCharset, type ProfileConfig } from "@/lib/profile/types";
import { Slider, Toggle } from "./fields";

type Update = (recipe: (p: ProfileConfig) => ProfileConfig) => void;

export function PortraitPanel({
  profile,
  update,
  hasPhoto,
  applyPhoto,
  forgetPhoto,
  avatarUrl,
}: {
  profile: ProfileConfig;
  update: Update;
  hasPhoto: boolean;
  applyPhoto: (img: HTMLImageElement) => void;
  forgetPhoto: () => void;
  avatarUrl?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const portrait = profile.portrait;
  const setPortrait = (patch: Partial<ProfileConfig["portrait"]>) => update((p) => ({ ...p, portrait: { ...p.portrait, ...patch } }));

  const run = async (load: () => Promise<HTMLImageElement>) => {
    setBusy(true);
    setError(null);
    try {
      applyPhoto(await load());
    } catch (err) {
      setError(err instanceof PortraitError ? err.message : "Couldn't turn that image into a portrait.");
    } finally {
      setBusy(false);
    }
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    run(async () => {
      checkPhotoFile(file);
      const url = URL.createObjectURL(file);
      try {
        return await loadImage(url);
      } finally {
        URL.revokeObjectURL(url);
      }
    });
  };

  const takeAvatar = () => {
    if (!avatarUrl) return;
    const url = new URL(avatarUrl);
    url.searchParams.set("s", "460");
    run(() => loadImage(url.toString(), true));
  };

  const hasAscii = portrait.ascii.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">ASCII portrait</CardTitle>
        <CardDescription className="text-xs">Optional. Turns a photo into monochrome ASCII art with a line-by-line reveal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-accent-subtle p-3 text-xs text-text-secondary">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-accent" />
          <span>
            Your photo is processed entirely in this browser and is never uploaded or stored. Only the generated ASCII text is kept,
            and only if you save your profile.
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_PHOTO_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            Upload a photo
          </Button>
          {avatarUrl && (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={takeAvatar}>
              <UserRound /> Use my GitHub avatar
            </Button>
          )}
          {hasAscii && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                forgetPhoto();
                setPortrait({ enabled: false, ascii: [] });
              }}
            >
              <Trash2 /> Remove portrait
            </Button>
          )}
        </div>
        <p className="text-[11px] text-text-muted">PNG, JPEG, WebP or GIF up to 8 MB. A well-lit, front-facing photo on a plain background works best.</p>

        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasAscii && (
          <>
            <Toggle
              checked={portrait.enabled}
              onChange={(enabled) => setPortrait({ enabled })}
              label="Show the portrait"
              description="Appears on the left of the terminal card and as its own SVG."
            />
            {!hasPhoto && (
              <p className="text-[11px] text-text-muted">
                The original photo isn&apos;t kept between sessions. Upload it again to adjust detail, contrast or characters.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Slider label="Detail (characters per line)" value={portrait.columns} min={32} max={120} step={4} disabled={!hasPhoto} onChange={(columns) => setPortrait({ columns })} />
              <Slider label="Portrait width" value={portrait.fontSize} min={4} max={12} step={0.5} format={(v) => `${Math.round(v * 0.6 * portrait.columns)}px`} onChange={(fontSize) => setPortrait({ fontSize })} />
              <Slider label="Contrast" value={portrait.contrast} min={0.5} max={2.5} step={0.1} format={(v) => v.toFixed(1)} disabled={!hasPhoto} onChange={(contrast) => setPortrait({ contrast })} />
              <Slider label="Brightness" value={portrait.brightness} min={-0.5} max={0.5} step={0.05} format={(v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2))} disabled={!hasPhoto} onChange={(brightness) => setPortrait({ brightness })} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                Characters
                <select
                  value={portrait.charset}
                  disabled={!hasPhoto}
                  onChange={(e) => setPortrait({ charset: e.target.value as PortraitCharset })}
                  className="h-8 rounded-[var(--radius-sm)] border border-border bg-surface-secondary px-2 text-xs text-text-primary disabled:opacity-50"
                >
                  {PORTRAIT_CHARSETS.map((c) => (
                    <option key={c} value={c}>
                      {CHARSET_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
              <Toggle checked={portrait.invert} disabled={!hasPhoto} onChange={(invert) => setPortrait({ invert })} label="Invert shading" />
              <Toggle checked={portrait.enhance} disabled={!hasPhoto} onChange={(enhance) => setPortrait({ enhance })} label="Auto-level tones" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
