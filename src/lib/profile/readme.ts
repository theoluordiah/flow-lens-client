import type { ContributionCalendar, ProfileConfig } from "./types";
import { cleanText, safeUrl } from "./sanitize";
import { heatmapAlt } from "./svg";

export const ASSET_PATHS = {
  card: "assets/flowlens-card.svg",
  portrait: "assets/flowlens-portrait.svg",
  contributions: "assets/flowlens-contributions.svg",
} as const;

export type AssetKey = keyof typeof ASSET_PATHS;

/**
 * Neutralizes raw HTML in user text. GitHub sanitizes READMEs anyway, but the generator
 * should never emit markup the user didn't see in the form.
 */
export function mdText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Text inside [link brackets]. */
function mdLinkText(s: string): string {
  return mdText(cleanText(s)).replace(/([[\]\\])/g, "\\$1");
}

/** Percent-encodes characters that would end a Markdown link target early. */
function mdUrl(url: string): string {
  return url.replace(/[()\s<>]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
}

function mdImageAlt(s: string): string {
  return mdText(cleanText(s)).replace(/([[\]\\])/g, "\\$1");
}

export interface ReadmeInput {
  profile: ProfileConfig;
  username: string;
  /** Present only when real data was retrieved. */
  calendar: ContributionCalendar | null;
}

/** Which SVG assets the generated README references. */
export function includedAssets({ profile, calendar }: ReadmeInput): AssetKey[] {
  const keys: AssetKey[] = [];
  const hasPortrait = profile.portrait.enabled && profile.portrait.ascii.length > 0;
  if (profile.sections.card) keys.push("card");
  else if (hasPortrait) keys.push("portrait");
  if (profile.sections.contributions && calendar) keys.push("contributions");
  return keys;
}

export function generateReadme(input: ReadmeInput): string {
  const { profile, username, calendar } = input;
  const name = cleanText(profile.displayName) || username;
  const assets = includedAssets(input);
  const out: string[] = ["<!-- Generated with FlowLens Profile Builder. Edit freely. -->", "", `# Hi, I'm ${mdText(name)}`];

  if (profile.title.trim()) out.push("", `**${mdText(cleanText(profile.title))}**`);

  if (assets.includes("card")) {
    out.push("", `![${mdImageAlt(`Terminal-style developer card for ${name}${profile.title ? `, ${profile.title}` : ""}`)}](./${ASSET_PATHS.card})`);
  } else if (assets.includes("portrait")) {
    out.push("", `![${mdImageAlt(`ASCII portrait of ${name}`)}](./${ASSET_PATHS.portrait})`);
  }

  if (profile.sections.about && (profile.bio.trim() || profile.focus.trim())) {
    out.push("", "## About me");
    if (profile.bio.trim()) out.push("", mdText(profile.bio.trim()));
    if (profile.focus.trim()) out.push("", `**Currently focused on:** ${mdText(cleanText(profile.focus))}`);
  }

  const projects = profile.projects.filter((p) => cleanText(p.name));
  if (profile.sections.projects && projects.length) {
    out.push("", "## Featured projects", "");
    for (const p of projects) {
      const url = safeUrl(p.url);
      const title = url ? `**[${mdLinkText(p.name)}](${mdUrl(url)})**` : `**${mdText(cleanText(p.name))}**`;
      const desc = cleanText(p.description);
      const tech = cleanText(p.tech);
      out.push(`- ${title}${desc ? ` — ${mdText(desc)}` : ""}${tech ? ` · \`${tech.replace(/`/g, "'")}\`` : ""}`);
    }
  }

  const skills = [...profile.languages, ...profile.stack].map(cleanText).filter(Boolean);
  const uniqueSkills = Array.from(new Set(skills));
  if (profile.sections.skills && uniqueSkills.length) {
    out.push("", "## Languages & tools", "", uniqueSkills.map((s) => `\`${s.replace(/`/g, "'")}\``).join(" · "));
  }

  if (assets.includes("contributions") && calendar) {
    const fetched = new Date(calendar.fetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    out.push(
      "",
      "## Contributions",
      "",
      `![${mdImageAlt(heatmapAlt(calendar))}](./${ASSET_PATHS.contributions})`,
      "",
      `<sub>Snapshot of my GitHub contribution calendar taken ${fetched}.</sub>`
    );
  }

  const links = profile.links
    .map((l) => ({ label: cleanText(l.label), url: safeUrl(l.url) }))
    .filter((l): l is { label: string; url: string } => Boolean(l.label && l.url));
  if (profile.sections.links && links.length) {
    out.push("", "## Connect", "", links.map((l) => `[${mdLinkText(l.label)}](${mdUrl(l.url)})`).join(" · "));
  }

  out.push("");
  return out.join("\n");
}
