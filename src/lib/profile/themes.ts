import type { ProfileTheme } from "./types";

export interface SvgTheme {
  id: ProfileTheme;
  label: string;
  /** Light themes need dark-on-light ASCII shading. */
  light: boolean;
  background: string;
  chrome: string;
  border: string;
  text: string;
  muted: string;
  key: string;
  accent: string;
  /** Contribution levels 0–4. */
  heat: [string, string, string, string, string];
  /** Neofetch-style swatch row. */
  swatches: string[];
}

export const THEMES: Record<ProfileTheme, SvgTheme> = {
  flowlens: {
    id: "flowlens",
    label: "FlowLens terminal",
    light: false,
    background: "#09090B",
    chrome: "#111113",
    border: "#27272A",
    text: "#FAFAFA",
    muted: "#A1A1AA",
    key: "#818CF8",
    accent: "#6366F1",
    heat: ["#18181B", "#312E81", "#4338CA", "#6366F1", "#A5B4FC"],
    swatches: ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#A855F7", "#FAFAFA"],
  },
  phosphor: {
    id: "phosphor",
    label: "Green phosphor",
    light: false,
    background: "#050A06",
    chrome: "#0B140D",
    border: "#1C2B1F",
    text: "#C6F6CF",
    muted: "#6B9A74",
    key: "#39D353",
    accent: "#26A641",
    heat: ["#0F1A11", "#0E4429", "#006D32", "#26A641", "#39D353"],
    swatches: ["#0E4429", "#006D32", "#26A641", "#39D353", "#7EE787", "#C6F6CF"],
  },
  amber: {
    id: "amber",
    label: "Amber CRT",
    light: false,
    background: "#100B04",
    chrome: "#1A1208",
    border: "#33260F",
    text: "#FFE2B0",
    muted: "#B08A4E",
    key: "#FFB000",
    accent: "#E09B00",
    heat: ["#1C150A", "#4A3208", "#7A5300", "#C08400", "#FFB000"],
    swatches: ["#4A3208", "#7A5300", "#C08400", "#FFB000", "#FFD27A", "#FFE2B0"],
  },
  paper: {
    id: "paper",
    label: "Paper (light)",
    light: true,
    background: "#FFFFFF",
    chrome: "#F6F8FA",
    border: "#D1D9E0",
    text: "#1F2328",
    muted: "#59636E",
    key: "#4F46E5",
    accent: "#6366F1",
    heat: ["#EBEDF0", "#C7D2FE", "#A5B4FC", "#6366F1", "#4338CA"],
    swatches: ["#4F46E5", "#16A34A", "#D97706", "#DC2626", "#0891B2", "#9333EA", "#1F2328"],
  },
};

export const MONO_FONT = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

/** Monospace advance width relative to font size; close for every font in MONO_FONT. */
export const CHAR_WIDTH = 0.6;
