import type { ContributionCalendar, ProfileConfig } from "./types";
import { THEMES, MONO_FONT, CHAR_WIDTH, type SvgTheme } from "./themes";
import { escapeXml as esc, displayUrl, safeUrl, wrapText, cleanText } from "./sanitize";

const SANS_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/**
 * Shared animation CSS. Every animated element is fully visible in its base style and
 * only uses `backwards` fill, so renderers that ignore CSS animation show the final,
 * static result. Reduced-motion viewers get the static version too.
 */
function styleBlock(theme: SvgTheme, animate: boolean, extra = ""): string {
  const motion = animate
    ? `
    @keyframes fl-in { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: none; } }
    @keyframes fl-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fl-blink { 50% { opacity: 0; } }
    .a { animation: fl-in 0.35s ease-out backwards; }
    .f { animation: fl-fade 0.4s ease-out backwards; }
    .cursor { animation: fl-blink 1.1s step-end infinite; }
    @media (prefers-reduced-motion: reduce) { .a, .f, .cursor { animation: none; } }`
    : "";
  return `<style>
    text { font-family: ${MONO_FONT}; fill: ${theme.text}; }
    .muted { fill: ${theme.muted}; }
    .key { fill: ${theme.key}; font-weight: 700; }
    .sans { font-family: ${SANS_FONT}; }${motion}${extra}
  </style>`;
}

function delay(animate: boolean, seconds: number): string {
  return animate ? ` style="animation-delay:${seconds.toFixed(2)}s"` : "";
}

function open(width: number, height: number, idBase: string, title: string, desc: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${idBase}-title ${idBase}-desc">
  <title id="${idBase}-title">${esc(title)}</title>
  <desc id="${idBase}-desc">${esc(desc)}</desc>`;
}

// ── ASCII portrait ──────────────────────────────────────────────────────────

export interface PortraitLayout {
  width: number;
  height: number;
  lineHeight: number;
}

export function portraitLayout(lines: string[], fontSize: number): PortraitLayout {
  const columns = Math.max(0, ...lines.map((l) => l.length));
  const lineHeight = fontSize * 1.2;
  return { width: columns * fontSize * CHAR_WIDTH, height: lines.length * lineHeight, lineHeight };
}

/** Lines of ASCII as <text> rows; spaces become NBSP so no renderer collapses them. */
function portraitRows(lines: string[], x: number, y: number, fontSize: number, animate: boolean): string {
  const { lineHeight } = portraitLayout(lines, fontSize);
  const step = Math.min(0.04, 1.6 / Math.max(1, lines.length));
  return lines
    .map((line, i) => {
      if (!line.trim()) return "";
      const content = esc(line).replace(/ /g, " ");
      const length = (line.length * fontSize * CHAR_WIDTH).toFixed(1);
      return `<text x="${x}" y="${(y + (i + 1) * lineHeight - lineHeight * 0.25).toFixed(1)}" textLength="${length}" lengthAdjust="spacing" xml:space="preserve" class="${animate ? "a " : ""}p"${delay(animate, i * step)}>${content}</text>`;
    })
    .filter(Boolean)
    .join("\n  ");
}

export function renderPortraitSvg(profile: ProfileConfig): string {
  const theme = THEMES[profile.theme];
  const { ascii, fontSize } = profile.portrait;
  const pad = 16;
  const layout = portraitLayout(ascii, fontSize);
  const width = Math.ceil(layout.width + pad * 2);
  const height = Math.ceil(layout.height + pad * 2);
  const name = cleanText(profile.displayName) || "the developer";
  return `${open(width, height, "fl-portrait", `ASCII portrait of ${name}`, `A monochrome ASCII-art portrait of ${name}, generated from a photo.`)}
  ${styleBlock(theme, profile.animations, `\n    .p { font-size: ${fontSize}px; fill: ${theme.text}; }`)}
  <rect width="${width}" height="${height}" rx="10" fill="${theme.background}"/>
  ${portraitRows(ascii, pad, pad, fontSize, profile.animations)}
</svg>`;
}

// ── Terminal card ───────────────────────────────────────────────────────────

type CardLine =
  | { kind: "header"; text: string }
  | { kind: "rule"; length: number }
  | { kind: "kv"; key: string; value: string; continuation: boolean; keyWidth: number }
  | { kind: "blank" }
  | { kind: "swatches" }
  | { kind: "prompt" };

const INFO_COLUMNS = 54;

export function cardLines(profile: ProfileConfig, username: string): CardLine[] {
  const header = cleanText(profile.displayName) || username;
  const lines: CardLine[] = [
    { kind: "header", text: `${username}@github` },
    { kind: "rule", length: Math.min(INFO_COLUMNS, `${username}@github`.length) },
  ];

  const facts: [string, string][] = [
    ["Name", header],
    ["Role", cleanText(profile.title)],
    ["Focus", cleanText(profile.focus)],
    ["Languages", profile.languages.map(cleanText).filter(Boolean).join(", ")],
    ["Stack", profile.stack.map(cleanText).filter(Boolean).join(", ")],
    ["Projects", profile.projects.map((p) => cleanText(p.name)).filter(Boolean).join(", ")],
  ];
  const links: [string, string][] = profile.links
    .map((l): [string, string | null] => [cleanText(l.label), safeUrl(l.url)])
    .filter((l): l is [string, string] => Boolean(l[0] && l[1]))
    .map(([label, url]) => [label, displayUrl(url)]);

  const shown = facts.filter(([, v]) => v);
  const keyWidth = Math.max(0, ...[...shown, ...links].map(([k]) => k.length)) + 2;
  const push = ([key, value]: [string, string]) => {
    wrapText(value, INFO_COLUMNS - keyWidth, 3).forEach((part, i) =>
      lines.push({ kind: "kv", key, value: part, continuation: i > 0, keyWidth })
    );
  };
  shown.forEach(push);
  if (links.length) {
    lines.push({ kind: "blank" });
    links.forEach(push);
  }
  lines.push({ kind: "blank" }, { kind: "swatches" }, { kind: "blank" }, { kind: "prompt" });
  return lines;
}

export function renderCardSvg(profile: ProfileConfig, username: string): string {
  const theme = THEMES[profile.theme];
  const animate = profile.animations;
  const fontSize = 14;
  const lineHeight = 22;
  const charW = fontSize * CHAR_WIDTH;
  const barH = 34;
  const pad = 24;

  const portrait = profile.portrait.enabled && profile.portrait.ascii.length > 0 ? profile.portrait.ascii : null;
  const pLayout = portrait ? portraitLayout(portrait, profile.portrait.fontSize) : null;
  const infoX = pad + (pLayout ? pLayout.width + 32 : 0);
  const lines = cardLines(profile, username);

  const width = Math.ceil(infoX + INFO_COLUMNS * charW + pad);
  const bodyTop = barH + pad;
  const infoHeight = lines.length * lineHeight;
  const height = Math.ceil(bodyTop + Math.max(infoHeight, pLayout?.height ?? 0) + pad);

  const infoTop = bodyTop + Math.max(0, ((pLayout?.height ?? 0) - infoHeight) / 2);
  const startDelay = portrait ? 0.3 : 0;
  const rows = lines.map((line, i) => {
    const y = (infoTop + (i + 1) * lineHeight - 6).toFixed(1);
    const d = delay(animate, startDelay + i * 0.07);
    const cls = animate ? ` class="a"` : "";
    switch (line.kind) {
      case "header": {
        const [user, host] = line.text.split("@");
        return `<text x="${infoX}" y="${y}"${cls}${d}><tspan class="key">${esc(user)}</tspan><tspan class="muted">@</tspan><tspan class="key">${esc(host)}</tspan></text>`;
      }
      case "rule":
        return `<text x="${infoX}" y="${y}" class="${animate ? "a " : ""}muted"${d}>${"-".repeat(line.length)}</text>`;
      case "kv": {
        const keyText = line.continuation ? "" : `<tspan class="key">${esc(line.key)}</tspan><tspan class="muted">:</tspan>`;
        return `<text x="${infoX}" y="${y}"${cls}${d}>${keyText}<tspan x="${(infoX + line.keyWidth * charW).toFixed(1)}">${esc(line.value)}</tspan></text>`;
      }
      case "swatches":
        return `<g${cls}${d}>${theme.swatches
          .map((c, j) => `<rect x="${infoX + j * 26}" y="${(Number(y) - 13).toFixed(1)}" width="22" height="14" rx="3" fill="${c}"/>`)
          .join("")}</g>`;
      case "prompt":
        return `<text x="${infoX}" y="${y}"${cls}${d}><tspan class="key">$</tspan> <tspan class="muted">whoami --profile</tspan></text>
  <rect x="${(infoX + 19 * charW).toFixed(1)}" y="${(Number(y) - 13).toFixed(1)}" width="${(charW * 0.9).toFixed(1)}" height="16" fill="${theme.key}" class="${animate ? "cursor" : ""}"/>`;
      default:
        return "";
    }
  });

  const name = cleanText(profile.displayName) || username;
  const summary = [
    cleanText(profile.title),
    profile.focus && `Focus: ${cleanText(profile.focus)}`,
    profile.stack.length > 0 && `Stack: ${profile.stack.map(cleanText).join(", ")}`,
  ]
    .filter(Boolean)
    .join(". ");

  return `${open(width, height, "fl-card", `${name}${profile.title ? ` — ${cleanText(profile.title)}` : ""}`, `Terminal-style developer card for ${name}. ${summary}`)}
  ${styleBlock(theme, animate, pLayout ? `\n    .p { font-size: ${profile.portrait.fontSize}px; fill: ${theme.text}; }\n    text:not(.p) { font-size: ${fontSize}px; }` : `\n    text { font-size: ${fontSize}px; }`)}
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="${theme.background}" stroke="${theme.border}"/>
  <path d="M0.5 12.5a12 12 0 0 1 12-12h${width - 25}a12 12 0 0 1 12 12v${barH - 12}h-${width - 1}z" fill="${theme.chrome}"/>
  <line x1="0.5" y1="${barH + 0.5}" x2="${width - 0.5}" y2="${barH + 0.5}" stroke="${theme.border}"/>
  <circle cx="20" cy="17" r="5.5" fill="#EF4444"/><circle cx="38" cy="17" r="5.5" fill="#F59E0B"/><circle cx="56" cy="17" r="5.5" fill="#22C55E"/>
  <text x="${width / 2}" y="21.5" text-anchor="middle" class="muted" style="font-size:12px">flowlens — ~/profile</text>
  ${portrait && pLayout ? portraitRows(portrait, pad, bodyTop + Math.max(0, (infoHeight - pLayout.height) / 2), profile.portrait.fontSize, animate) : ""}
  ${rows.join("\n  ")}
</svg>`;
}

// ── Contribution heatmap ────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function calendarRange(cal: ContributionCalendar): { from: string; to: string } {
  const days = cal.weeks.flat();
  return { from: days[0]?.date ?? cal.from, to: days[days.length - 1]?.date ?? cal.to };
}

export function heatmapAlt(cal: ContributionCalendar): string {
  const { from, to } = calendarRange(cal);
  return `GitHub contribution calendar for @${cal.login}: ${cal.totalContributions.toLocaleString("en-US")} contributions from ${fmtDate(from)} to ${fmtDate(to)}`;
}

export function renderHeatmapSvg(cal: ContributionCalendar, profile: ProfileConfig): string {
  const theme = THEMES[profile.theme];
  const animate = profile.animations;
  const cell = 11;
  const step = 14;
  const left = 36;
  const top = 58;
  const weeks = cal.weeks;
  const width = left + weeks.length * step + 18;
  const height = top + 7 * step + 50;
  const { from, to } = calendarRange(cal);

  const months: string[] = [];
  let lastMonth = -1;
  let lastLabelCol = -10;
  weeks.forEach((week, col) => {
    const first = week[0];
    if (!first) return;
    const month = new Date(first.date).getUTCMonth();
    if (month !== lastMonth) {
      lastMonth = month;
      if (col - lastLabelCol >= 3 && col < weeks.length - 1) {
        lastLabelCol = col;
        const label = new Date(first.date).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
        months.push(`<text x="${left + col * step}" y="${top - 8}" class="muted sans" style="font-size:10px">${label}</text>`);
      }
    }
  });

  const columns = weeks
    .map((week, col) => {
      const cells = week
        .map((day) => {
          const row = new Date(day.date).getUTCDay();
          const level = Math.max(0, Math.min(4, day.level));
          return `<rect x="${left + col * step}" y="${top + row * step}" width="${cell}" height="${cell}" rx="2" fill="${theme.heat[level]}"/>`;
        })
        .join("");
      return `<g${animate ? ` class="f"` : ""}${delay(animate, col * 0.02)}>${cells}</g>`;
    })
    .join("\n  ");

  const weekdays = [
    [1, "Mon"],
    [3, "Wed"],
    [5, "Fri"],
  ]
    .map(([row, label]) => `<text x="${left - 8}" y="${top + (row as number) * step + 9}" text-anchor="end" class="muted sans" style="font-size:9px">${label}</text>`)
    .join("");

  const legendY = top + 7 * step + 18;
  const legendX = width - 18 - 5 * step - 34;
  const legend = theme.heat
    .map((c, i) => `<rect x="${legendX + i * step}" y="${legendY - 9}" width="${cell}" height="${cell}" rx="2" fill="${c}"/>`)
    .join("");

  const total = cal.totalContributions.toLocaleString("en-US");
  const fetched = fmtDate(cal.fetchedAt);

  return `${open(width, height, "fl-heat", heatmapAlt(cal), `Each square is one day, shaded by GitHub's own contribution level (see legend). Data is GitHub's contribution calendar, captured ${fetched}.`)}
  ${styleBlock(theme, animate)}
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="${theme.background}" stroke="${theme.border}"/>
  <text x="18" y="27" class="sans" style="font-size:14px;font-weight:600">${total} contributions</text>
  <text x="${width - 18}" y="27" text-anchor="end" class="muted sans" style="font-size:11px">${fmtDate(from)} – ${fmtDate(to)}</text>
  ${months.join("\n  ")}
  ${weekdays}
  ${columns}
  <text x="18" y="${legendY}" class="muted sans" style="font-size:10px">Source: GitHub contribution calendar · snapshot ${fetched}</text>
  <text x="${legendX - 6}" y="${legendY}" text-anchor="end" class="muted sans" style="font-size:10px">Less</text>
  ${legend}
  <text x="${legendX + 5 * step + 2}" y="${legendY}" class="muted sans" style="font-size:10px">More</text>
</svg>`;
}
