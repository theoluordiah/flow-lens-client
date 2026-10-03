import type { ContributionCalendar, ProfileConfig } from "./types";
import { renderCardSvg, renderHeatmapSvg, renderPortraitSvg } from "./svg";
import { ASSET_PATHS, generateReadme, includedAssets, type AssetKey } from "./readme";

export interface ProfileAsset {
  key: AssetKey;
  path: string;
  svg: string;
  /** Referenced by the generated README (others are extra downloads). */
  inReadme: boolean;
}

export interface ProfileExport {
  generatedReadme: string;
  /** The user's hand-edited README when present, else the generated one. */
  readme: string;
  assets: ProfileAsset[];
}

export function buildProfileExport(
  profile: ProfileConfig,
  username: string,
  calendar: ContributionCalendar | null
): ProfileExport {
  const input = { profile, username, calendar };
  const used = new Set(includedAssets(input));
  const assets: ProfileAsset[] = [];

  if (profile.sections.card) {
    assets.push({ key: "card", path: ASSET_PATHS.card, svg: renderCardSvg(profile, username), inReadme: used.has("card") });
  }
  if (profile.portrait.enabled && profile.portrait.ascii.length > 0) {
    assets.push({ key: "portrait", path: ASSET_PATHS.portrait, svg: renderPortraitSvg(profile), inReadme: used.has("portrait") });
  }
  if (profile.sections.contributions && calendar) {
    assets.push({
      key: "contributions",
      path: ASSET_PATHS.contributions,
      svg: renderHeatmapSvg(calendar, profile),
      inReadme: used.has("contributions"),
    });
  }

  const generatedReadme = generateReadme(input);
  return { generatedReadme, readme: profile.readmeOverride ?? generatedReadme, assets };
}
