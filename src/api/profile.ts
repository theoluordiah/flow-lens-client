import client from "./client";
import type { ContributionCalendar, ProfileConfig } from "@/lib/profile/types";

export interface SavedProfileResponse {
  profile: ProfileConfig | null;
  updatedAt: string | null;
}

export async function getSavedProfile(): Promise<SavedProfileResponse> {
  const { data } = await client.get<SavedProfileResponse>("/api/profile");
  return data;
}

export async function saveProfile(profile: ProfileConfig): Promise<SavedProfileResponse> {
  const { data } = await client.put<SavedProfileResponse>("/api/profile", { profile });
  return data;
}

export async function deleteSavedProfile(): Promise<void> {
  await client.delete("/api/profile");
}

export async function getContributionCalendar(): Promise<ContributionCalendar> {
  const { data } = await client.get<ContributionCalendar>("/api/profile/contributions");
  return data;
}
