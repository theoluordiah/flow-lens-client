import type { ProfileConfig } from "./types";
import { ASSET_PATHS, REFRESH_SCRIPT_PATH, REFRESH_WORKFLOW_PATH } from "./readme";
import { REFRESH_SCRIPT_SOURCE } from "./generated/refresh-script";

export interface ExtraFile {
  path: string;
  content: string;
}

/** GitHub usernames: alphanumerics and single hyphens, at most 39 characters. */
export const isGitHubLogin = (s: string) => /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(s);

/** Ready-to-run refresh script: the bundled renderer with this profile's settings prepended. */
export function refreshScript(login: string, profile: Pick<ProfileConfig, "theme" | "animations">): string {
  const config = { login, theme: profile.theme, animations: profile.animations, out: ASSET_PATHS.contributions };
  return `// FlowLens Profile Builder: refreshes ${ASSET_PATHS.contributions} from GitHub's contribution calendar.
// Run by ${REFRESH_WORKFLOW_PATH}. Re-export from FlowLens to change the theme.
const FLOWLENS_CONFIG = ${JSON.stringify(config)};
${REFRESH_SCRIPT_SOURCE}`;
}

export function refreshWorkflow(): string {
  return `name: Refresh FlowLens heatmap

# Re-renders ${ASSET_PATHS.contributions} once a day from GitHub's GraphQL API, using
# this workflow's own GITHUB_TOKEN. It only reads your public contribution calendar
# (private counts appear only if you enabled them on your profile). If GitHub can't be
# reached, the existing SVG is left as it is.

on:
  schedule:
    - cron: "23 5 * * *"
  workflow_dispatch: {}

permissions:
  contents: write

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Render contribution heatmap
        run: node ${REFRESH_SCRIPT_PATH}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      - name: Commit if it changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add ${ASSET_PATHS.contributions}
          git diff --cached --quiet || (git commit -m "chore: refresh contribution heatmap" && git push)
`;
}

export function refreshFiles(login: string, profile: ProfileConfig): ExtraFile[] {
  if (!isGitHubLogin(login)) return [];
  return [
    { path: REFRESH_WORKFLOW_PATH, content: refreshWorkflow() },
    { path: REFRESH_SCRIPT_PATH, content: refreshScript(login, profile) },
  ];
}
