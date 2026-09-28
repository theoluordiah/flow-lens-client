import axios from "axios";
import client from "./client";
import type {
  GetAnalysisResponse,
  PostAnalysisResponse,
  PublicCard,
  ReportTone,
  ShareResponse,
} from "@/types";

/** Latest saved report for this repo and tone, or null if none exists yet. */
export async function getAnalysis(
  owner: string,
  repo: string,
  tone: ReportTone
): Promise<GetAnalysisResponse | null> {
  try {
    const { data } = await client.get<GetAnalysisResponse>(
      `/api/analysis/${owner}/${repo}`,
      { params: { tone } }
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export async function generateAnalysis(
  owner: string,
  repo: string,
  tone: ReportTone,
  refresh = false
): Promise<PostAnalysisResponse> {
  const { data } = await client.post<PostAnalysisResponse>(
    `/api/analysis/${owner}/${repo}`,
    {},
    { params: { tone, refresh: refresh || undefined } }
  );
  return data;
}

export async function shareAnalysis(
  owner: string,
  repo: string,
  tone: ReportTone
): Promise<ShareResponse> {
  const { data } = await client.post<ShareResponse>(
    `/api/analysis/${owner}/${repo}/share`,
    {},
    { params: { tone } }
  );
  return data;
}

export async function unshareAnalysis(owner: string, repo: string): Promise<void> {
  await client.delete(`/api/analysis/${owner}/${repo}/share`);
}

/** Public endpoint — works without being logged in. */
export async function getPublicCard(slug: string): Promise<PublicCard | null> {
  try {
    const { data } = await client.get<PublicCard>(`/api/card/${slug}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}
