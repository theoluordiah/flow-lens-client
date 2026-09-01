"use client";

import { useState, useCallback, useRef } from "react";
import { getDashboard } from "@/api/dashboard";
import type { DashboardResponse } from "@/types";

export function useDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchDashboard = useCallback(
    async (owner?: string, repo?: string) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      if (owner && repo) setData(null);
      try {
        const result = await getDashboard(owner, repo);
        if (requestId === requestIdRef.current) setData(result);
      } catch (err: unknown) {
        if (requestId === requestIdRef.current) {
          const message =
            err instanceof Error ? err.message : "Failed to load dashboard";
          setError(message);
        }
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, fetchDashboard };
}
