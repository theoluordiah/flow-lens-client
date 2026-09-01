import client from "./client";
import type { ListReposResponse, Stats, RepositoryStatsResponse } from "@/types";

export async function getRepositories(
  page = 1,
  perPage = 30,
  search = ""
): Promise<ListReposResponse> {
  const { data } = await client.get("/api/repos", {
    params: { page, perPage, search },
  });
  return data;
}

export async function getRepository(owner: string, repo: string) {
  const { data } = await client.get(`/api/repos/${owner}/${repo}`);
  return data;
}

export async function getRepositoryStats(
  owner: string,
  repo: string
): Promise<Stats> {
  const { data } = await client.get<RepositoryStatsResponse>(
    `/api/repos/${owner}/${repo}/stats`
  );
  return data.stats;
}
