"use client";
/**
 * Tiny data hook for client components. OWNER: h1.
 *
 *   const { data, error, loading, reload } = useApi(() => api.incoming.matches(), []);
 *   if (error?.code === "PROFILE_INCOMPLETE") …
 */
import { useCallback, useEffect, useState, type DependencyList } from "react";
import { ApiClientError } from "./api-client";

export function useApi<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await run());
      setError(null);
    } catch (e) {
      setError(e instanceof ApiClientError ? e : new ApiClientError(0, "NETWORK", String(e)));
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}
