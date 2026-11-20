"use client";

import { useEffect } from "react";

/** Refresh server-owned status without overlapping requests or polling hidden tabs. */
export function usePoll(refresh: () => Promise<void>, active = true, ms = 4000) {
  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function tick() {
      try {
        if (document.visibilityState === "visible") await refresh();
      } finally {
        if (!stopped) timer = setTimeout(() => void tick(), ms);
      }
    }
    timer = setTimeout(() => void tick(), ms);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [refresh, active, ms]);
}
