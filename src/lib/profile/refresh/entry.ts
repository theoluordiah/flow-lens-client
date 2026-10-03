// Entry point bundled into the stand-alone heatmap refresh script that FlowLens exports
// for the user's profile repository (see scripts/gen-refresh-script.mjs). It runs in
// GitHub Actions on Node 20+ with no dependencies, using the workflow's GITHUB_TOKEN.
import { writeFileSync } from "node:fs";
import { renderHeatmapSvg } from "../svg";
import { validateSvg } from "../sanitize";
import type { ContributionCalendar, ProfileTheme } from "../types";

/** Prepended to the bundle by the Profile Builder export. */
declare const FLOWLENS_CONFIG: { login: string; theme: ProfileTheme; animations: boolean; out: string };

const LEVELS: Record<string, number> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      startedAt
      endedAt
      hasAnyRestrictedContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

interface GraphQLDay {
  date: string;
  contributionCount: number;
  contributionLevel: string;
}

/** On any failure the existing SVG is left untouched: no data is better than made-up data. */
function fail(message: string): never {
  console.error(`FlowLens heatmap refresh failed: ${message}`);
  process.exit(1);
}

async function main() {
  const { login, out } = FLOWLENS_CONFIG;
  const token = process.env.GITHUB_TOKEN;
  if (!token) fail("GITHUB_TOKEN is not set");

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "flowlens-heatmap-refresh" },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) fail(`GitHub API returned HTTP ${res.status}`);
  const json = (await res.json()) as {
    errors?: { message: string }[];
    data?: { user?: { contributionsCollection?: {
      startedAt: string;
      endedAt: string;
      hasAnyRestrictedContributions: boolean;
      restrictedContributionsCount: number;
      contributionCalendar: { totalContributions: number; weeks: { contributionDays: GraphQLDay[] }[] };
    } } };
  };
  if (json.errors?.length) fail(json.errors.map((e) => e.message).join("; "));
  const c = json.data?.user?.contributionsCollection;
  if (!c) fail(`GitHub returned no contribution data for ${login}`);

  const calendar: ContributionCalendar = {
    login,
    from: c.startedAt,
    to: c.endedAt,
    totalContributions: c.contributionCalendar.totalContributions,
    hasRestrictedContributions: c.hasAnyRestrictedContributions,
    restrictedContributionsCount: c.restrictedContributionsCount,
    weeks: c.contributionCalendar.weeks.map((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 }))
    ),
    fetchedAt: new Date().toISOString(),
  };

  const svg = renderHeatmapSvg(calendar, FLOWLENS_CONFIG);
  const check = validateSvg(svg);
  if (!check.ok) fail(`generated SVG failed validation (${check.problems.join(", ")})`);
  writeFileSync(out, svg);
  console.log(`Wrote ${out}: ${calendar.totalContributions} contributions`);
}

await main();
