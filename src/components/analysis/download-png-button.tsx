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

  const handleClick = async () => {
    setState("working");
    try {
      await downloadCardPng(imageUrl, filename);
      setState("done");
    } catch {
      setState("error");
    } finally {
      setTimeout(() => setState("idle"), 2000);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleClick} disabled={state === "working"}>
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
