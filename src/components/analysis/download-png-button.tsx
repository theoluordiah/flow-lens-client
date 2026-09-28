"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Check, Download } from "lucide-react";
import { downloadCardPng } from "@/lib/download-card";

export function DownloadPngButton({
  imageUrl,
  filename,
  variant = "secondary",
  size = "sm",
}: {
  imageUrl: string;
  filename: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async () => {
    setState("working");
    setErrorMessage(null);
    try {
      await downloadCardPng(imageUrl, filename);
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      console.error("[FlowLens] PNG download failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Download failed");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={state === "working"}
      title={errorMessage ?? undefined}
    >
      {state === "done" ? <Check size={14} /> : <Download size={14} />}
      {state === "working"
        ? "Preparing…"
        : state === "done"
          ? "Downloaded"
          : state === "error"
            ? "Download failed"
            : "Download PNG"}
    </Button>
  );
}
