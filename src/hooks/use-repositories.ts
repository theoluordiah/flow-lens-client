"use client";

import { useState, useCallback } from "react";
import { getRepositories } from "@/api/repositories";
import type { ListReposResponse } from "@/types";

export function useRepositories() {
  const [data, setData] = useState<ListReposResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = useCallback(
    async (page = 1, perPage = 30, search = "") => {
      setLoading(true);
      setError(null);
      try {
        const result = await getRepositories(page, perPage, search);
        setData(result);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load repositories";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, fetchRepositories };
}
