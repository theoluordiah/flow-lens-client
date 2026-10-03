import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultProfile, type ContributionCalendar, type ProfileConfig } from "./types";
import { escapeXml, safeUrl, validateSvg, wrapText, displayUrl } from "./sanitize";
import { borderLuminance, luminanceToAscii, rowsFor, tonalRange, trimBlankEdges } from "./ascii";
import { contributionStats, renderCardSvg, renderHeatmapSvg, renderPortraitSvg } from "./svg";
import { generateReadme, REFRESH_SCRIPT_PATH, REFRESH_WORKFLOW_PATH } from "./readme";
import { isGitHubLogin, refreshFiles, refreshScript } from "./workflow";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
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

// ── Added with the reveal / refresh features ──────────────────────────────

test("portrait typing reveal is CSS-only, clipped, and honors reduced motion", () => {
  const portrait = { ...defaultProfile().portrait, enabled: true, ascii: ["@@@@", " .. "] };
  const animated = renderPortraitSvg(sampleProfile({ portrait }));
  assert.deepEqual(validateSvg(animated, wellFormed).problems, []);
  assert.ok(animated.includes('clip-path="url(#flp-clip)"'));
  assert.match(animated, /prefers-reduced-motion[^}]*\.tw, \.tc \{ animation: none; \}/);
  assert.ok(!/<animate/.test(animated), "no SMIL: reduced-motion must be able to stop it");
  const still = renderPortraitSvg(sampleProfile({ portrait, animations: false }));
  assert.ok(!still.includes("tw"));
  const card = renderCardSvg(sampleProfile({ portrait }), "octo");
  assert.deepEqual(validateSvg(card, wellFormed).problems, []);
  assert.ok(card.includes("flc-clip"));
});

test("auto-level stretches a dim photo's tonal range", () => {
  const dim = [0.1, 0.15, 0.2, 0.25, 0.3];
  const opts = { charset: "standard" as const, contrast: 1, brightness: 0, invert: false };
  assert.deepEqual(tonalRange(dim), [0.1, 0.3]);
  const [flat] = luminanceToAscii(dim, 5, 1, opts);
  const [levelled] = luminanceToAscii(dim, 5, 1, { ...opts, autoLevel: true });
  assert.equal(levelled[0], " ");
  assert.equal(levelled[4], "@");
  assert.notEqual(flat, levelled);
});

test("contributionStats derives streaks and best day from real counts only", () => {
  const cal = sampleCalendar();
  const days = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"];
  cal.weeks = [days.map((date, i) => ({ date, count: [3, 0, 2, 5, 1, 0][i], level: 1 }))];
  const stats = contributionStats(cal);
  assert.equal(stats.currentStreak, 3, "an empty today doesn't break the streak");
  assert.equal(stats.longestStreak, 3);
  assert.deepEqual(stats.bestDay, { date: "2026-10-01", count: 5 });
  const svg = renderHeatmapSvg(cal, { theme: "flowlens", animations: false });
  assert.ok(svg.includes("Current streak 3 days"));
});

test("README terminal headings and refresh note", () => {
  const md = generateReadme({ profile: sampleProfile(), username: "octo", calendar: sampleCalendar() });
  assert.ok(md.includes("## `octo@github ~ $ ./contributions.sh`"));
  assert.ok(md.includes("refreshed daily"));
  const plain = generateReadme({ profile: sampleProfile({ terminalHeadings: false, autoRefresh: false }), username: "octo", calendar: sampleCalendar() });
  assert.ok(plain.includes("## Contributions"));
  assert.ok(plain.includes("Snapshot of my GitHub contribution calendar"));
});

test("export includes the refresh workflow only with real heatmap data and a valid login", () => {
  assert.deepEqual(buildProfileExport(sampleProfile(), "octo", null).extras, []);
  const ex = buildProfileExport(sampleProfile(), "octo", sampleCalendar());
  assert.deepEqual(ex.extras.map((f) => f.path), [REFRESH_WORKFLOW_PATH, REFRESH_SCRIPT_PATH]);
  assert.ok(ex.extras[0].content.includes("secrets.GITHUB_TOKEN"));
  assert.deepEqual(buildProfileExport(sampleProfile({ autoRefresh: false }), "octo", sampleCalendar()).extras, []);
  assert.deepEqual(refreshFiles("bad login!", sampleProfile()), []);
  assert.equal(isGitHubLogin("octo-cat"), true);
  assert.equal(isGitHubLogin("-octo"), false);
});

test("committed refresh bundle matches the current renderer source", async () => {
  const { bundleRefreshScript, OUTPUT } = await import("../../../scripts/gen-refresh-script.mjs");
  assert.equal(readFileSync(OUTPUT, "utf8"), await bundleRefreshScript(), "run `npm run gen:refresh-script`");
});

function runRefresh(response: unknown, status = 200) {
  const dir = mkdtempSync(join(tmpdir(), "flowlens-refresh-"));
  mkdirSync(join(dir, "assets"));
  writeFileSync(join(dir, "refresh.mjs"), refreshScript("octo", { theme: "phosphor", animations: true }));
  const mock = `globalThis.fetch = async (url, init) => { globalThis.__req = { url, init }; return new Response(${JSON.stringify(JSON.stringify(response))}, { status: ${status} }); };`;
  const run = spawnSync(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(mock)}`, "refresh.mjs"], {
    cwd: dir,
    env: { ...process.env, GITHUB_TOKEN: "test-token" },
    encoding: "utf8",
  });
  const out = join(dir, "assets/flowlens-contributions.svg");
  return { run, svg: existsSync(out) ? readFileSync(out, "utf8") : null };
}

test("exported refresh script renders real API data and refuses to fake it", () => {
  const cal = sampleCalendar();
  const ok = runRefresh({
    data: { user: { contributionsCollection: {
      startedAt: cal.from, endedAt: cal.to, hasAnyRestrictedContributions: false, restrictedContributionsCount: 0,
      contributionCalendar: { totalContributions: 742, weeks: cal.weeks.map((w) => ({ contributionDays: w.map((d) => ({ date: d.date, contributionCount: d.count, contributionLevel: ["NONE", "FIRST_QUARTILE", "SECOND_QUARTILE", "THIRD_QUARTILE", "FOURTH_QUARTILE"][d.level] })) })) },
    } } },
  });
  assert.equal(ok.run.status, 0, ok.run.stderr);
  assert.ok(ok.svg?.includes("742 contributions"));
  assert.ok(ok.svg?.includes("#39D353"), "uses the exported theme");
  assert.deepEqual(validateSvg(ok.svg ?? "", wellFormed).problems, []);

  const denied = runRefresh({ message: "Bad credentials" }, 401);
  assert.notEqual(denied.run.status, 0);
  assert.equal(denied.svg, null);
  assert.match(denied.run.stderr, /HTTP 401/);

  const missing = runRefresh({ data: { user: null } });
  assert.notEqual(missing.run.status, 0);
  assert.equal(missing.svg, null);
});
