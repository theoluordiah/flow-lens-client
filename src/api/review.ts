import axios from "axios";
import client from "./client";
import type { CodeReview, ReportTone } from "@/types";

/** Latest saved code review for this repo and tone, or null if none exists yet. */
export async function getCodeReview(owner: string, repo: string, tone: ReportTone): Promise<CodeReview | null> {
  try {
    const { data } = await client.get<CodeReview>(`/api/review/${owner}/${repo}`, { params: { tone } });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export async function runCodeReview(
  owner: string,
  repo: string,
  tone: ReportTone,
  refresh = false
): Promise<CodeReview> {
  const { data } = await client.post<CodeReview>(
    `/api/review/${owner}/${repo}`,
    {},
    { params: { tone, refresh: refresh || undefined } }
  );
  return data;
}

/** Marks a finding as not a real issue (or restores it). Remembered for future reviews of the repo. */
export async function setFindingDismissed(
  owner: string,
  repo: string,
  fingerprint: string,
  dismissed: boolean
): Promise<void> {
  await client.post(`/api/review/${owner}/${repo}/dismiss`, { fingerprint, dismissed });
}
