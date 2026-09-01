import client from "./client";
import type { AccountStats, User } from "@/types";

export interface AccountStatsResponse {
  developer: User;
  stats: AccountStats;
}

export async function getAccountStats(): Promise<AccountStatsResponse> {
  const { data } = await client.get<AccountStatsResponse>("/api/account/stats");
  return data;
}
