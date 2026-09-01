import client from "./client";
import type { DashboardResponse } from "@/types";

export async function getDashboard(
  owner?: string,
  repo?: string
): Promise<DashboardResponse> {
  const params: Record<string, string> = {};
  if (owner) params.owner = owner;
  if (repo) params.repo = repo;
  const { data } = await client.get("/api/dashboard", { params });
  return data;
}
