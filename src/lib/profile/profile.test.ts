import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultProfile, type ContributionCalendar, type ProfileConfig } from "./types";
import { escapeXml, safeUrl, validateSvg, wrapText, displayUrl } from "./sanitize";
import { borderLuminance, luminanceToAscii, rowsFor, trimBlankEdges } from "./ascii";
import { renderCardSvg, renderHeatmapSvg, renderPortraitSvg } from "./svg";
import { generateReadme } from "./readme";
import { buildProfileExport } from "./export";
import { createZip, crc32 } from "./zip";

/** Tag-balance check standing in for DOMParser, which Node lacks. */
function wellFormed(svg: string): boolean {
  const stack: string[] = [];
  const body = svg.replace(/<style>[\s\S]*?<\/style>/g, "");
  for (const m of body.matchAll(/<(\/?)([a-zA-Z]+)[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = m;
    if (selfClosing) continue;
    if (closing) {
      if (stack.pop() !== name) return false;
    } else stack.push(name);
  }
  return stack.length === 0 && !/&(?!amp;|lt;|gt;|quot;|#39;)/.test(body);
}

const user = { username: "octo", displayName: "Octo Cat", profileUrl: "https://github.com/octo" };

function sampleProfile(overrides: Partial<ProfileConfig> = {}): ProfileConfig {
  return {
    ...defaultProfile(user),
    title: "Full-stack engineer",
    bio: "I build <b>tools</b> & things.",
    focus: "Developer tooling",
    languages: ["TypeScript", "Go"],
    stack: ["React", "Node.js"],
    projects: [{ name: "FlowLens", description: "Code insight", url: "https://example.com/flow (lens)", tech: "Next.js" }],
    links: [
      { label: "GitHub", url: "https://github.com/octo" },
      { label: "Bad", url: "javascript:alert(1)" },
    ],
    ...overrides,
  };
}

function sampleCalendar(): ContributionCalendar {
  const weeks: ContributionCalendar["weeks"] = [];
  const start = Date.UTC(2025, 9, 5); // a Sunday
  for (let w = 0; w < 53; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start + (w * 7 + d) * 86400000).toISOString().slice(0, 10);
      week.push({ date, count: (w + d) % 5, level: (w + d) % 5 });
    }
    weeks.push(week);
  }
  return {
    login: "octo",
    from: "2025-10-05T00:00:00Z",
    to: "2026-10-03T23:59:59Z",
    totalContributions: 742,
    hasRestrictedContributions: false,
    restrictedContributionsCount: 0,
    weeks,
    fetchedAt: "2026-10-03T12:00:00Z",
  };
}

test("escapeXml neutralizes markup and quotes", () => {
  assert.equal(escapeXml(`<script>"x" & 'y'</script>`), "&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;");
});

test("safeUrl accepts web and mailto links only", () => {
  assert.equal(safeUrl("https://example.com/a"), "https://example.com/a");
  assert.equal(safeUrl("mailto:me@example.com"), "mailto:me@example.com");
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("data:text/html,hi"), null);
  assert.equal(safeUrl("example.com"), null);
  assert.equal(safeUrl("https://nodot"), null);
  assert.equal(displayUrl("https://www.example.com/me/"), "example.com/me");
});

test("wrapText wraps, hard-breaks long words, and truncates", () => {
  assert.deepEqual(wrapText("one two three four", 9), ["one two", "three", "four"]);
  assert.deepEqual(wrapText("abcdefghij", 4), ["abcd", "efgh", "ij"]);
  assert.equal(wrapText("a b c d e f g h", 3, 2)[1].endsWith("…"), true);
});

test("luminanceToAscii maps brightness to density and honors invert and transparency", () => {
  const lum = [0, 0.5, 1, NaN];
  const [line] = luminanceToAscii(lum, 4, 1, { charset: "standard", contrast: 1, brightness: 0, invert: false });
  assert.equal(line[0], " ");
  assert.equal(line[2], "@");
  assert.equal(line[3], " ");
  const [inv] = luminanceToAscii(lum, 4, 1, { charset: "standard", contrast: 1, brightness: 0, invert: true });
  assert.equal(inv[0], "@");
  assert.equal(inv[3], " ");
  assert.deepEqual(trimBlankEdges(["  ", "x", " "]), ["x"]);
  assert.equal(rowsFor(60, 400, 400), 30);
  assert.equal(rowsFor(160, 100, 10000), 120);
});

test("borderLuminance averages edge cells and skips transparent ones", () => {
  // 3×3: bright border, dark centre
  assert.equal(borderLuminance([1, 1, 1, 1, 0, 1, 1, 1, 1], 3, 3), 1);
  assert.equal(borderLuminance([NaN, NaN, NaN, NaN, 0, NaN, NaN, NaN, NaN], 3, 3), null);
});

test("card SVG is safe, well-formed, escapes input and skips unsafe links", () => {
  const svg = renderCardSvg(sampleProfile({ title: `<img src=x onerror=alert(1)>` }), "octo");
  const check = validateSvg(svg, wellFormed);
  assert.deepEqual(check.problems, []);
  assert.ok(!svg.includes("<img"));
  assert.ok(!svg.includes("javascript"));
  assert.ok(svg.includes("github.com/octo"));
  assert.ok(svg.includes("prefers-reduced-motion"));
});

test("static card has no animation CSS", () => {
  const svg = renderCardSvg(sampleProfile({ animations: false }), "octo");
  assert.ok(!svg.includes("@keyframes"));
  assert.deepEqual(validateSvg(svg, wellFormed).problems, []);
});

test("portrait SVG embeds ASCII safely, alone and inside the card", () => {
  const portrait = { ...defaultProfile().portrait, enabled: true, ascii: [" .:<&>@ ", "@@@@@@@@"] };
  const profile = sampleProfile({ portrait });
  const solo = renderPortraitSvg(profile);
  assert.deepEqual(validateSvg(solo, wellFormed).problems, []);
  assert.ok(solo.includes("&lt;&amp;&gt;"));
  const card = renderCardSvg(profile, "octo");
  assert.deepEqual(validateSvg(card, wellFormed).problems, []);
  assert.ok(card.includes("textLength"));
});

test("heatmap SVG renders every day, a legend and the date range", () => {
  const cal = sampleCalendar();
  const svg = renderHeatmapSvg(cal, sampleProfile());
  assert.deepEqual(validateSvg(svg, wellFormed).problems, []);
  assert.equal((svg.match(/<rect /g) ?? []).length, 1 + 53 * 7 + 5);
  assert.ok(svg.includes("742 contributions"));
  assert.ok(svg.includes("Oct 5, 2025"));
  assert.ok(svg.includes("Less") && svg.includes("More"));
});

test("README omits the heatmap without real data and never emits raw HTML from input", () => {
  const md = generateReadme({ profile: sampleProfile(), username: "octo", calendar: null });
  assert.ok(!md.includes("flowlens-contributions.svg"));
  assert.ok(md.includes("I build &lt;b&gt;tools&lt;/b&gt;"));
  assert.ok(md.includes("(https://example.com/flow%20%28lens%29)"));
  assert.ok(!md.includes("javascript:"));
  assert.ok(md.includes("![Terminal-style developer card"));
  const hostile = generateReadme({ profile: sampleProfile({ title: "<script>x</script>" }), username: "octo", calendar: null });
  assert.ok(!hostile.includes("<script>"));

  const withCal = generateReadme({ profile: sampleProfile(), username: "octo", calendar: sampleCalendar() });
  assert.ok(withCal.includes("./assets/flowlens-contributions.svg"));
  assert.ok(withCal.includes("742 contributions"));
});

test("export prefers the hand-edited README and only lists real assets", () => {
  const ex = buildProfileExport(sampleProfile({ readmeOverride: "# Mine" }), "octo", null);
  assert.equal(ex.readme, "# Mine");
  assert.deepEqual(ex.assets.map((a) => a.key), ["card"]);
});

test("zip has valid signatures and CRCs", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  const zip = createZip([
    { path: "README.md", content: "# hi" },
    { path: "assets/a.svg", content: "<svg/>" },
  ]);
  const view = new DataView(zip.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.equal(view.getUint32(zip.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(zip.length - 12, true), 2);
});
