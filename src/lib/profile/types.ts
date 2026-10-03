export const PROFILE_THEMES = ["flowlens", "phosphor", "amber", "paper"] as const;
export type ProfileTheme = (typeof PROFILE_THEMES)[number];

export const PORTRAIT_CHARSETS = ["standard", "detailed", "blocks", "minimal"] as const;
export type PortraitCharset = (typeof PORTRAIT_CHARSETS)[number];

export interface ProfileLink {
  label: string;
  url: string;
}

export interface ProfileProject {
  name: string;
  description: string;
  url: string;
  tech: string;
}

export interface PortraitSettings {
  enabled: boolean;
  /** Characters per line. */
  columns: number;
  contrast: number;
  brightness: number;
  charset: PortraitCharset;
  invert: boolean;
  /** Auto-level the photo's tones before shading (helps flat or dim photos). */
  enhance: boolean;
  /** Font size of the portrait in the exported SVG, which sets its rendered width. */
  fontSize: number;
  /** Generated ASCII art. The source photo is never stored. */
  ascii: string[];
}

export interface ProfileSections {
  card: boolean;
  contributions: boolean;
  about: boolean;
  projects: boolean;
  skills: boolean;
  links: boolean;
}

/** Mirrors ProfileData on the server (models/ProfileConfig.ts). */
export interface ProfileConfig {
  displayName: string;
  title: string;
  bio: string;
  focus: string;
  languages: string[];
  stack: string[];
  projects: ProfileProject[];
  links: ProfileLink[];
  theme: ProfileTheme;
  animations: boolean;
  /** Section headings styled as shell prompts, e.g. `octo@github ~ $ ./links.sh`. */
  terminalHeadings: boolean;
  /** Include a GitHub Action that re-renders the heatmap daily from GitHub's API. */
  autoRefresh: boolean;
  sections: ProfileSections;
  portrait: PortraitSettings;
  /** Hand-edited README; null means "use the generated one". */
  readmeOverride: string | null;
}

export interface ContributionDay {
  date: string;
  count: number;
  /** 0–4, GitHub's own quartile bucket. */
  level: number;
}

export interface ContributionCalendar {
  login: string;
  from: string;
  to: string;
  totalContributions: number;
  hasRestrictedContributions: boolean;
  restrictedContributionsCount: number;
  weeks: ContributionDay[][];
  fetchedAt: string;
}

/** Limits shared with the server's profileValidation.ts. */
export const LIMITS = {
  displayName: 60,
  title: 80,
  bio: 600,
  focus: 160,
  tag: 30,
  languages: 20,
  stack: 30,
  projects: 6,
  projectName: 60,
  projectDescription: 200,
  projectTech: 80,
  links: 8,
  linkLabel: 30,
  url: 300,
  readme: 20000,
};

export const LINK_PRESETS = ["Portfolio", "GitHub", "LinkedIn", "YouTube", "X", "Blog", "Email"] as const;

export function defaultProfile(user?: { username: string; displayName?: string; profileUrl?: string }): ProfileConfig {
  return {
    displayName: user?.displayName || user?.username || "",
    title: "",
    bio: "",
    focus: "",
    languages: [],
    stack: [],
    projects: [],
    links: user ? [{ label: "GitHub", url: user.profileUrl || `https://github.com/${user.username}` }] : [],
    theme: "flowlens",
    animations: true,
    terminalHeadings: true,
    autoRefresh: true,
    sections: { card: true, contributions: true, about: true, projects: true, skills: true, links: true },
    portrait: {
      enabled: false,
      columns: 64,
      contrast: 1.2,
      brightness: 0,
      charset: "standard",
      invert: false,
      enhance: true,
      fontSize: 7,
      ascii: [],
    },
    readmeOverride: null,
  };
}

/** Fills any fields a saved or drafted profile is missing (older shape, partial draft). */
export function normalizeProfile(raw: Partial<ProfileConfig> | null | undefined, base: ProfileConfig): ProfileConfig {
  if (!raw) return base;
  const portrait = { ...base.portrait, ...(raw.portrait ?? {}) };
  if (!PORTRAIT_CHARSETS.includes(portrait.charset)) portrait.charset = base.portrait.charset;
  return {
    ...base,
    ...raw,
    theme: raw.theme && PROFILE_THEMES.includes(raw.theme) ? raw.theme : base.theme,
    sections: { ...base.sections, ...(raw.sections ?? {}) },
    portrait,
    languages: raw.languages ?? base.languages,
    stack: raw.stack ?? base.stack,
    projects: raw.projects ?? base.projects,
    links: raw.links ?? base.links,
    readmeOverride: raw.readmeOverride ?? null,
  };
}
