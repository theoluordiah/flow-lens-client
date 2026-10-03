"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  FolderGit2,
  MessageSquare,
  Settings,
  Search,
  X,
  SquareTerminal,
} from "lucide-react";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  keywords: string[];
}

const commands: CommandItem[] = [
  { label: "Go to Dashboard", href: "/dashboard", icon: <LayoutDashboard size={16} />, keywords: ["home", "overview"] },
  { label: "Go to Activity", href: "/activity", icon: <Activity size={16} />, keywords: ["commits", "pull requests"] },
  { label: "Go to Repositories", href: "/repositories", icon: <FolderGit2 size={16} />, keywords: ["repos", "projects"] },
  { label: "Ask FlowLens", href: "/chat", icon: <MessageSquare size={16} />, keywords: ["chat", "question", "ai"] },
  { label: "Open Profile Builder", href: "/profile-builder", icon: <SquareTerminal size={16} />, keywords: ["readme", "profile", "portrait", "ascii", "heatmap"] },
  { label: "Go to Settings", href: "/settings", icon: <Settings size={16} />, keywords: ["preferences", "account"] },
];

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const filtered = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.keywords.some((k) => k.includes(query.toLowerCase()))
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const executeCommand = useCallback(
    (href: string) => {
      router.push(href);
      onOpenChange(false);
      setQuery("");
    },
    [router, onOpenChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      executeCommand(filtered[selectedIndex].href);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-[var(--radius-lg)] border border-border bg-surface shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center border-b border-border px-4">
            <Search size={16} className="text-text-muted shrink-0" />
            <input
              autoFocus
              placeholder="Type a command..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-12 w-full bg-transparent px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <button
              onClick={() => onOpenChange(false)}
              className="text-text-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-text-muted">
                No results found.
              </div>
            ) : (
              filtered.map((cmd, i) => (
                <button
                  key={cmd.href}
                  onClick={() => executeCommand(cmd.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition-colors",
                    i === selectedIndex
                      ? "bg-surface-secondary text-text-primary"
                      : "text-text-secondary hover:bg-surface-secondary/50"
                  )}
                >
                  {cmd.icon}
                  {cmd.label}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[11px] text-text-muted">
            <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-surface px-1 py-0.5">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-surface px-1 py-0.5">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-surface px-1 py-0.5">esc</kbd> close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
