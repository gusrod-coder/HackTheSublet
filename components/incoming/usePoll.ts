"use client";
/** Re-run `fn` every `ms` while `active` and the tab is visible. LANE: h2. */
import { useEffect, useRef } from "react";

export function usePoll(fn: () => void, ms: number, active: boolean) {
  const latest = useRef(fn);
  latest.current = fn;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") latest.current();
    }, ms);
    return () => window.clearInterval(id);
  }, [ms, active]);
}
