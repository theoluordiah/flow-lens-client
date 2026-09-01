"use client";

import { useState, useCallback, useRef } from "react";
import { getAccountStats } from "@/api/account";
import { getRepositories } from "@/api/repositories";
import type { RepoLite, AccountStats } from "@/types";

const PER_PAGE = 30;

export function useAccountStats(loadRepos = true) {
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [repos, setRepos] = useState<RepoLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchRepos = useCallback(async () => {
    const allRepos: RepoLite[] = [];
    let page = 1;
    let hasNext = true;
    while (hasNext && page <= 40) {
      const res = await getRepositories(page, PER_PAGE);
      allRepos.push(...res.repos);
      hasNext = res.pagination.hasNextPage;
      page += 1;
    }
    return allRepos;
  }, []);

  const fetchAccount = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const { stats: accountStats } = await getAccountStats();
      if (requestId !== requestIdRef.current) return;

      let allRepos: RepoLite[] = [];
      if (loadRepos) {
        try {
          allRepos = await fetchRepos();
          if (requestId !== requestIdRef.current) return;
        } catch {
          // repo list is a nice-to-have; don't fail the whole dashboard
        }
      }

      setStats(accountStats);
      setRepos(allRepos);
    } catch (err: unknown) {
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load account stats");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [fetchRepos, loadRepos]);

  return { stats, repos, loading, error, fetchAccount };
}
