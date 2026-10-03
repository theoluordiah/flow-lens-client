// Text and URL hygiene shared by the SVG and README generators.

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanText(s: string): string {
  return s.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
}

/** Escapes text for SVG/XML content and attribute values. */
export function escapeXml(s: string): string {
  return s
    .replace(CONTROL_CHARS, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Returns a normalized URL when it is a well-formed http(s) or mailto link, else null.
 * Everything else (javascript:, data:, relative paths) is rejected.
 */
export function safeUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s || s.length > 300) return null;
  try {
    const u = new URL(s);
    if (!["http:", "https:", "mailto:"].includes(u.protocol)) return null;
    if (u.protocol !== "mailto:" && !u.hostname.includes(".") && u.hostname !== "localhost") return null;
    return u.href;
  } catch {
    return null;
  }
}

/** Human-friendly form of a link for the card: host + path, no scheme or trailing slash. */
export function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol === "mailto:") return u.pathname;
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return `${u.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return url;
  }
}

/** Greedy word wrap; words longer than a line are hard-broken. */
export function wrapText(text: string, maxChars: number, maxLines = Infinity): string[] {
  const words = cleanText(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (let word of words) {
    while (word.length > maxChars) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(word.slice(0, maxChars));
      word = word.slice(maxChars);
    }
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept[maxLines - 1];
    kept[maxLines - 1] = (last.length >= maxChars ? last.slice(0, maxChars - 1) : last) + "…";
    return kept;
  }
  return lines;
}

export interface SvgCheck {
  ok: boolean;
  problems: string[];
}

/**
 * Structural safety check for generated SVG before it is previewed or exported.
 * GitHub would strip most of this anyway; failing here means a generator bug.
 */
export function validateSvg(svg: string, parse?: (s: string) => boolean): SvgCheck {
  const problems: string[] = [];
  if (!/^<svg[\s>]/.test(svg.trim())) problems.push("does not start with <svg>");
  if (!svg.trim().endsWith("</svg>")) problems.push("is not closed");
  if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svg)) problems.push("is missing the SVG namespace");
  if (/<script/i.test(svg)) problems.push("contains a script");
  if (/<foreignObject/i.test(svg)) problems.push("contains foreignObject");
  // Attribute checks look only inside tags: user text is escaped, so it can't contain "<".
  const tags = svg.match(/<[^>]*>/g) ?? [];
  if (tags.some((t) => /\son[a-z]+\s*=/i.test(t))) problems.push("contains an event handler attribute");
  if (tags.some((t) => /\s(?:xlink:)?href\s*=/i.test(t))) problems.push("references an external resource");
  const styles = (svg.match(/<style>[\s\S]*?<\/style>/g) ?? []).join("\n");
  const markup = `${tags.join("\n")}\n${styles}`;
  if (/url\(\s*['"]?(?!#)/i.test(markup)) problems.push("loads a url() that is not a local reference");
  if (/@import/i.test(styles)) problems.push("imports a stylesheet");
  if (!/<title[\s>]/.test(svg)) problems.push("has no <title> for accessibility");
  if (parse && !parse(svg)) problems.push("is not well-formed XML");
  return { ok: problems.length === 0, problems };
}
