"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-text-secondary">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-error">{error}</p>
      ) : (
        hint && <p className="text-[11px] text-text-muted">{hint}</p>
      )}
    </div>
  );
}

export function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className={cn("text-[11px]", value.length > max ? "text-error" : "text-text-muted")}>
      {value.length}/{max}
    </span>
  );
}

/** Chips with an inline input; Enter or comma adds, Backspace on empty removes the last. */
export function TagInput({
  value,
  onChange,
  placeholder,
  max,
  maxLength,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max: number;
  maxLength: number;
}) {
  const [draft, setDraft] = useState("");
  const id = useId();

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim().slice(0, maxLength))
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft("");
  };

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface-secondary px-2 py-1.5 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-background">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs text-text-primary">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-text-muted hover:text-text-primary"
            aria-label={`Remove ${tag}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => {
          if (e.target.value.includes(",")) add(e.target.value);
          else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        disabled={value.length >= max}
        placeholder={value.length >= max ? `Limit of ${max} reached` : placeholder}
        className="min-w-[8rem] flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
      />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex items-start gap-3 text-sm", disabled ? "opacity-50" : "cursor-pointer")}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
      />
      <span>
        <span className="text-text-primary">{label}</span>
        {description && <span className="block text-xs text-text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => String(v),
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1", disabled && "opacity-50")}>
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id} className="font-medium text-text-secondary">
          {label}
        </label>
        <span className="font-mono text-text-muted">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)]"
      />
    </div>
  );
}
