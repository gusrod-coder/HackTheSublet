"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import type { MatchesResponse } from "@/lib/types";
import { fitChanges } from "./fit-changes";
import { createLiveFitLoader } from "./live-fit-loader";
import { usePoll } from "./use-poll";

const HIGHLIGHT_MS = 10000;
type Change = { from: number; to: number; expiresAt: number };

export function useLiveFit() {
  const loader = useMemo(() => createLiveFitLoader(api.incoming.matches), []);
  const matches = useApi(loader.load, [loader]);
  const previous = useRef<MatchesResponse | null>(null);
  const [changes, setChanges] = useState<Map<string, Change>>(() => new Map());
  const blocked = matches.error?.code === "PROFILE_INCOMPLETE" || matches.error?.code === "NO_SESSION";

  const refresh = useCallback(async () => {
    if (loader.pending() === 0) await matches.reload();
  }, [loader, matches.reload]);
  usePoll(refresh, !blocked, 3000);

  useEffect(() => {
    if (blocked) {
      previous.current = null;
      setChanges(new Map());
      return;
    }
    // A failed refresh must not advance the baseline or manufacture a score change.
    if (!matches.data || matches.error) return;
    const delta = fitChanges(previous.current, matches.data);
    previous.current = matches.data;
    const ids = new Set(matches.data.ranked.map(({ listing }) => listing.id));
    const now = Date.now();
    setChanges((current) => {
      const next = new Map([...current].filter(([id, change]) => ids.has(id) && change.expiresAt > now));
      for (const [id, change] of delta) next.set(id, { ...change, expiresAt: now + HIGHLIGHT_MS });
      return delta.size === 0 && next.size === current.size ? current : next;
    });
  }, [matches.data, matches.error, blocked]);

  useEffect(() => {
    if (!changes.size) return;
    const expires = Math.min(...[...changes.values()].map((change) => change.expiresAt));
    const timer = setTimeout(() => {
      setChanges((current) => new Map([...current].filter(([, change]) => change.expiresAt > Date.now())));
    }, Math.max(0, expires - Date.now()));
    return () => clearTimeout(timer);
  }, [changes]);

  return { ...matches, data: blocked ? null : matches.data, changes };
}
